import { test, expect } from '@playwright/test';

// Setup file to perform authentication and save storage state


// test('login-with-valid-credentials', async ({ page }) => {
//   await page.goto('http://localhost:3000/app/login');
//   await page.locator('#input-v-0-0').click();
//   await page.locator('#input-v-0-0').fill('aware@equature.com');
//   await page.locator('#input-v-0-0').press('Tab');
//   await page.locator('#input-v-0-2').fill('123456789');
//   await page.getByRole('button', { name: 'Sign In' }).click();
// });



test('add-rtsp-stream', async ({ page }) => {
  // Setup file will handle authentication and storage state, so we can directly navigate to the application


    await test.step('Login to the application', async () => {
        await page.goto('http://localhost:3000/app/login');
        await page.locator('#input-v-0-0').click();
        await page.locator('#input-v-0-0').fill('aware@equature.com');
        await page.locator('#input-v-0-0').press('Tab');
        await page.locator('#input-v-0-2').fill('123456789');
        await page.getByRole('button', { name: 'Sign In' }).click();
    }
    );

    // After login, navigate to the system configuration page

  await page.goto('http://localhost:3000/app/');
  await page.getByRole('link', {name: 'System'}).click();
  await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=system');
  
  const cameraTab = page.getByRole('tab', {name: 'Cameras'});
  await cameraTab.click();
  await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=cameras');

  // Click on Add Camera button and fill the form to add a new RTSP camera
  
  const addCameraButton = page.getByRole('button', { name: 'Add Camera' });
  await addCameraButton.click();

  await expect(page.locator('#input-v-0-0-40')).toBeVisible();
  await expect(page.locator('#input-v-0-0-40')).toBeEnabled();
  await expect (page.locator('#input-v-0-0-40')).toBeEditable();

  await page.locator('#input-v-0-0-40').click();
  await page.locator('#input-v-0-0-40').fill('Test Camera Playwright');
  await page.locator('#input-v-0-0-42').click();
  await page.locator('#input-v-0-0-42').fill('testing');
  await page.locator('#input-v-0-0-44').click();
  await page.locator('#input-v-0-0-44').fill('admin');
  await page.getByRole('textbox', { name: '*********' }).click();
  await page.getByRole('textbox', { name: '*********' }).fill('a');
  await page.locator('#input-v-0-0-52').click();
    await page.locator('#input-v-0-0-52').fill('192.168.7.255');
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).click();
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).fill('rtsp://localhost:8554/rtsp-test_stream5');
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).click();
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).fill('http://localhost:3456/api/files/snapshot/CityBusline.mp4');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

});

test('add-multiple-rtsp-streams', async ({ page }) => {

 await test.step('Login to the application', async () => {
        await page.goto('http://localhost:3000/app/login');
        await page.locator('#input-v-0-0').click();
        await page.locator('#input-v-0-0').fill('aware@equature.com');
        await page.locator('#input-v-0-0').press('Tab');
        await page.locator('#input-v-0-2').fill('123456789');
        await page.getByRole('button', { name: 'Sign In' }).click();
    }
    );

// After login, navigate to the system configuration page. Since we have multiple cameras to add, we will repeat the process of adding camera multiple times, so we can wrap the whole flow inside a loop.

    const numberOfCamerasToAdd = 5;

      await page.goto('http://localhost:3000/app/');
    await page.getByRole('link', {name: 'System'}).click();
    await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=system');
  
    const cameraTab = page.getByRole('tab', {name: 'Cameras'});
    await cameraTab.click();
    await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=cameras');

    // Click on Add Camera button and fill the form to add new RTSP cameras in a loop

    for(let i=1; i<=numberOfCamerasToAdd; i++) {    
  
    const addCameraButton = page.getByRole('button', { name: 'Add Camera' });
    await addCameraButton.click();

    await expect(page.locator('#input-v-0-0-40')).toBeVisible();
    await expect(page.locator('#input-v-0-0-40')).toBeEnabled();
    await expect (page.locator('#input-v-0-0-40')).toBeEditable();

  await page.locator('#input-v-0-0-40').click();
  await page.locator('#input-v-0-0-40').fill(`Playwright RTSP Test Camera ${i}`);
  await page.locator('#input-v-0-0-42').click();
  await page.locator('#input-v-0-0-42').fill('testing');
  await page.locator('#input-v-0-0-44').click();
  await page.locator('#input-v-0-0-44').fill('admin');
  await page.getByRole('textbox', { name: '*********' }).click();
  await page.getByRole('textbox', { name: '*********' }).fill('a');
  await page.locator('#input-v-0-0-52').click();
    await page.locator('#input-v-0-0-52').fill('192.168.7.255');
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).click();
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).fill(`rtsp://localhost:8554/rtsp-test_stream${i}`);
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).click();
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).fill(`http://localhost:3456/api/files/snapshot/CityBusline.mp4`);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
    }

});





