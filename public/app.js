const testList = document.getElementById("test-list");
const browserSelect = document.getElementById("browser-select");
const runTestsBtn = document.getElementById("run-tests-btn");
const addCamerasBtn = document.getElementById("add-cameras-btn");
const removeCamerasBtn = document.getElementById("remove-cameras-btn");
const cameraCount = document.getElementById("camera-count");
const resetCounterBtn = document.getElementById("reset-counter-btn");
const resetValue = document.getElementById("reset-value");
const counterDisplay = document.getElementById("counter-display");
const output = document.getElementById("output");
const clearOutputBtn = document.getElementById("clear-output-btn");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

let selectedTests = new Set();

async function loadTests() {
  testList.innerHTML = '<p class="loading">Loading tests...</p>';
  try {
    const res = await fetch("/api/tests");
    const data = await res.json();
    if (!data.tests.length) {
      testList.innerHTML = '<p class="loading">No test files found.</p>';
      return;
    }
    testList.innerHTML = "";
    data.tests.forEach((t) => {
      const item = document.createElement("div");
      item.className = "test-item";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "test-" + t.file;
      cb.addEventListener("change", () => {
        if (cb.checked) selectedTests.add(t.path);
        else selectedTests.delete(t.path);
        runTestsBtn.disabled = selectedTests.size === 0;
      });
      const label = document.createElement("label");
      label.htmlFor = "test-" + t.file;
      label.textContent = t.label;
      item.appendChild(cb);
      item.appendChild(label);
      testList.appendChild(item);
    });
  } catch (err) {
    testList.innerHTML = `<p class="loading">Error loading tests: ${err.message}</p>`;
  }
}

loadTests();

async function loadCounter() {
  try {
    const res = await fetch("/api/counter");
    const data = await res.json();
    counterDisplay.textContent = data.counter;
  } catch {
    counterDisplay.textContent = "?";
  }
}

loadCounter();

resetCounterBtn.addEventListener("click", async () => {
  const value = parseInt(resetValue.value);
  if (value < 1) return;
  try {
    const res = await fetch("/api/counter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) {
      const err = await res.json();
      appendOutput(`Error resetting counter: ${err.error}\n`, "stderr");
      return;
    }
    counterDisplay.textContent = value;
    appendOutput(`Counter reset to ${value}\n`, "system");
  } catch (err) {
    appendOutput(`Error resetting counter: ${err.message}\n`, "stderr");
  }
});

function appendOutput(text, className = "stdout") {
  const placeholder = output.querySelector(".output-placeholder");
  if (placeholder) placeholder.remove();

  const lines = text.split("\n");
  lines.forEach((line) => {
    if (!line && lines.length > 1) return;
    const div = document.createElement("div");
    div.className = "output-line " + className;
    div.textContent = line || " ";
    output.appendChild(div);
  });
  output.scrollTop = output.scrollHeight;
}

function setStatus(state) {
  statusDot.className = "status-dot " + state;
  const labels = { idle: "Idle", running: "Running...", success: "Success", error: "Error" };
  statusText.textContent = labels[state] || state;
}

function setButtonsEnabled(enabled) {
  runTestsBtn.disabled = !enabled || selectedTests.size === 0;
  addCamerasBtn.disabled = !enabled;
  removeCamerasBtn.disabled = !enabled;
}

const evtSource = new EventSource("/api/stream");

evtSource.addEventListener("connected", () => {
  appendOutput("Connected to output stream.\n", "system");
});

evtSource.addEventListener("job-start", (e) => {
  const data = JSON.parse(e.data);
  setStatus("running");
  setButtonsEnabled(false);
  const labels = {
    tests: "Playwright Tests",
    "add-cameras": "Add Cameras",
    "remove-cameras": "Remove Cameras",
  };
  appendOutput(`\n── ${labels[data.type] || data.type} started ──\n`, "system");
});

evtSource.addEventListener("output", (e) => {
  const data = JSON.parse(e.data);
  appendOutput(data.text, data.stream === "stderr" ? "stderr" : "stdout");
});

evtSource.addEventListener("job-end", (e) => {
  const data = JSON.parse(e.data);
  const duration = (data.duration / 1000).toFixed(1);
  if (data.code === 0) {
    appendOutput(`\n── Completed in ${duration}s ──\n`, "success");
    setStatus("success");
  } else {
    appendOutput(`\n── Failed with exit code ${data.code} (${duration}s) ──\n`, "stderr");
    setStatus("error");
  }
  setButtonsEnabled(true);
  setTimeout(() => {
    if (!currentJobRunning()) setStatus("idle");
  }, 3000);
});

evtSource.onerror = () => {
  appendOutput("Connection lost. Reconnecting...\n", "stderr");
  setStatus("error");
};

function currentJobRunning() {
  return statusDot.classList.contains("running");
}

runTestsBtn.addEventListener("click", async () => {
  const testFiles = Array.from(selectedTests);
  const browser = browserSelect.value;
  appendOutput(`\nRunning ${testFiles.length} test(s) in ${browser}...\n`, "system");
  try {
    const res = await fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testFiles, browser }),
    });
    if (!res.ok) {
      const err = await res.json();
      appendOutput(`Error: ${err.error}\n`, "stderr");
    }
  } catch (err) {
    appendOutput(`Error: ${err.message}\n`, "stderr");
  }
});

addCamerasBtn.addEventListener("click", async () => {
  const count = parseInt(cameraCount.value) || 1;
  appendOutput(`\nAdding ${count} camera(s)...\n`, "system");
  try {
    const res = await fetch("/api/add-cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    if (!res.ok) {
      const err = await res.json();
      appendOutput(`Error: ${err.error}\n`, "stderr");
    }
  } catch (err) {
    appendOutput(`Error: ${err.message}\n`, "stderr");
  }
});

removeCamerasBtn.addEventListener("click", async () => {
  appendOutput(`\nRemoving so_lt_* cameras...\n`, "system");
  try {
    const res = await fetch("/api/remove-cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json();
      appendOutput(`Error: ${err.error}\n`, "stderr");
    }
  } catch (err) {
    appendOutput(`Error: ${err.message}\n`, "stderr");
  }
});

clearOutputBtn.addEventListener("click", () => {
  output.innerHTML = '<div class="output-placeholder">Output will appear here...</div>';
});
