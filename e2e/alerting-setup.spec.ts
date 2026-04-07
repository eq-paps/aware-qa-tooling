import { test, expect } from '@playwright/test';


test('add-triage-member', async ({ page }) => {
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
    const triageTab = page.getByRole('tab', {name: 'Alerts'});
    await triageTab.click();
    await expect(page).toHaveURL('http://localhost:3000/app/system-configuration?tab=alerts');

    // this function is incomplete.
}
);