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

    // Click on Add Camera button and fill the form to add a new RTSP camera
}
);
