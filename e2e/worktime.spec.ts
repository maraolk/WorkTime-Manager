import { expect, test } from '@playwright/test';

test('login opens dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('heading', { name: /work dashboard/i })).toBeVisible();
});

test('user can filter time entries', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /entries/i }).click();
  await page.getByLabel('Search').fill('dashboard');

  await expect(page.getByText('Prepared dashboard layout')).toBeVisible();
});

test('user can open reports and export', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /reports/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export csv/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('worktime-report.csv');
});
