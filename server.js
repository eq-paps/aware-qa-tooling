const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3457;

app.use(express.json());
app.use(express.static("public"));

const sseClients = [];
let currentJob = null;

function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((c) => c.res.write(message));
}

function runJob(jobId, type, command, args, options = {}) {
  currentJob = { id: jobId, type, startTime: Date.now() };
  broadcast("job-start", { id: jobId, type });

  const child = spawn(command, args, {
    cwd: __dirname,
    shell: true,
    ...options,
  });

  child.stdout.on("data", (data) => {
    broadcast("output", { text: data.toString() });
  });

  child.stderr.on("data", (data) => {
    broadcast("output", { text: data.toString(), stream: "stderr" });
  });

  child.on("close", (code) => {
    const duration = Date.now() - currentJob.startTime;
    broadcast("job-end", {
      id: jobId,
      code,
      duration,
      type,
    });
    currentJob = null;
  });

  child.on("error", (err) => {
    broadcast("output", { text: `Error: ${err.message}\n`, stream: "stderr" });
    broadcast("job-end", { id: jobId, code: -1, type });
    currentJob = null;
  });

  return child;
}

app.get("/api/tests", (req, res) => {
  const testDir = path.join(__dirname, "e2e");
  try {
    const files = fs
      .readdirSync(testDir)
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => ({
        file: f,
        path: path.join("e2e", f),
        label: f
          .replace(".spec.ts", "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
    res.json({ tests: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/run-tests", (req, res) => {
  if (currentJob) {
    return res.status(409).json({ error: "A test run is already in progress" });
  }

  const { testFiles, browser } = req.body;
  if (!testFiles || !testFiles.length) {
    return res.status(400).json({ error: "No test files specified" });
  }

  const jobId = crypto.randomUUID();
  const args = ["playwright", "test", ...testFiles];
  if (browser) {
    args.push("--project=" + browser);
  }

  runJob(jobId, "tests", "npx", args);
  res.json({ jobId });
});

app.post("/api/add-cameras", (req, res) => {
  if (currentJob) {
    return res
      .status(409)
      .json({ error: "A camera operation is already in progress" });
  }

  const { count } = req.body;
  if (!count || count < 1) {
    return res.status(400).json({ error: "Count must be at least 1" });
  }

  const jobId = crypto.randomUUID();
  const child = runJob(
    jobId,
    "add-cameras",
    "python3",
    [path.join(__dirname, "add_cameras.py")],
    { stdio: ["pipe", "inherit", "inherit"] }
  );
  child.stdin.write(`${count}\n`);
  child.stdin.end();

  res.json({ jobId });
});

app.post("/api/remove-cameras", (req, res) => {
  if (currentJob) {
    return res
      .status(409)
      .json({ error: "A camera operation is already in progress" });
  }

  const jobId = crypto.randomUUID();
  const child = runJob(
    jobId,
    "remove-cameras",
    "python3",
    [path.join(__dirname, "remove_cameras.py")],
    { stdio: ["pipe", "inherit", "inherit"] }
  );
  child.stdin.write("y\n");
  child.stdin.end();

  res.json({ jobId });
});

app.get("/api/job-status", (req, res) => {
  res.json({ running: !!currentJob, job: currentJob });
});

app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const client = { id: Date.now(), res };
  sseClients.push(client);

  broadcast("connected", { message: "Connected to output stream" });

  req.on("close", () => {
    sseClients.splice(sseClients.indexOf(client), 1);
  });
});

app.listen(PORT, () => {
  console.log(`QA Test UI running at http://localhost:${PORT}`);
});
