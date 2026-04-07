import { test, expect } from '@playwright/test';



test('login-with-valid-credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/app/login');
  await page.locator('#input-v-0-0').click();
  await page.locator('#input-v-0-0').fill('aware@equature.com');
  await page.locator('#input-v-0-0').press('Tab');
  await page.locator('#input-v-0-2').fill('123456789');
  await page.getByRole('button', { name: 'Sign In' }).click();
});

