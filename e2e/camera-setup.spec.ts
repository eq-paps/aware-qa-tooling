import { test, expect } from '@playwright/test';


test('add-camera', async ({ page }) => {
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

    await page.goto('http://localhost:3000/app/');
    await page.getByRole('link', {name: 'System'}).click();
    await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=system');
    const cameraTab = page.getByRole('tab', {name: 'Cameras'});
    await cameraTab.click();
    await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=cameras');

    // Click on Add Camera button and fill the form to add a new camera

      const addCameraButton = page.getByRole('button', { name: 'Add Camera' });
  await addCameraButton.click();

  await expect(page.locator('#input-v-0-0-40')).toBeVisible();
  await expect(page.locator('#input-v-0-0-40')).toBeEnabled();
  await expect (page.locator('#input-v-0-0-40')).toBeEditable();

  await page.locator('#input-v-0-0-40').click();
  await page.locator('#input-v-0-0-40').fill('Playwright Live Camera');
  await page.locator('#input-v-0-0-42').click();
  await page.locator('#input-v-0-0-42').fill('testing with live camera');
  await page.locator('#input-v-0-0-44').click();
  await page.locator('#input-v-0-0-44').fill('admin');
  await page.getByRole('textbox', { name: '*********' }).click();
  await page.getByRole('textbox', { name: '*********' }).fill('123456');
  await page.locator('#input-v-0-0-52').click();
    await page.locator('#input-v-0-0-52').fill('192.168.7.255');
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).click();
  await page.getByRole('textbox', { name: 'rtsp://<ip-address>:<port>/<' }).fill('rtsp://localhost:8554/rtsp-test_stream5');
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).click();
  await page.getByRole('textbox', { name: 'http://<ip-address>/<url>/<' }).fill('http://localhost:3456/api/files/snapshot/CityBusline.mp4');
  await page.getByRole('button', { name: 'Add', exact: true }).click();


}
);
