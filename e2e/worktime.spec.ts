import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('login opens dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('heading', { name: /work dashboard/i })).toBeVisible();
});

test('user can filter time entries', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /entries/i }).click();
  await page.getByLabel('Search').fill('dashboard');

  await expect(page.getByText('Prepared dashboard layout')).toBeVisible();
});

test('user can open project management', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /projects/i }).click();

  await expect(page.getByRole('heading', { name: /projects and tasks/i })).toBeVisible();
  await expect(page.getByText('Northwind · 42h planned')).toBeVisible();
});

test('user can open reports and export', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /reports/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export csv/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('worktime-report-all-projects-all-time.csv');
  const path = await download.path();

  expect(path).toBeTruthy();

  const csv = await readFile(path!, 'utf-8');

  expect(csv).toContain('"Date","Project","Hours","Billable","Description"');
  expect(csv).toContain('"Client Portal"');
});

test('user can create, edit and delete projects and tasks', async ({ page }) => {
  const projectName = `Demo Project ${Date.now()}`;
  const editedProjectName = `${projectName} Updated`;
  const taskName = 'Research flow';
  const editedTaskName = 'Research flow updated';

  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /projects/i }).click();

  const projectForm = page.locator('form').first();
  const taskForm = page.locator('form').nth(1);

  await projectForm.getByLabel('Name', { exact: true }).fill(projectName);
  await projectForm.getByLabel('Client', { exact: true }).fill('Demo Client');
  await projectForm.getByLabel('Planned hours', { exact: true }).fill('12');
  await page.getByRole('button', { name: /add project/i }).click();

  const projectRow = page.locator('article').filter({ hasText: projectName }).first();

  await expect(projectRow).toBeVisible();
  await projectRow.getByRole('button', { name: /edit/i }).click();
  await projectForm.getByLabel('Name', { exact: true }).fill(editedProjectName);
  await page.getByRole('button', { name: /save project/i }).click();

  const editedProjectRow = page.locator('article').filter({ hasText: editedProjectName }).first();

  await expect(editedProjectRow).toBeVisible();

  await taskForm.locator('select[formcontrolname="projectId"]').selectOption({
    label: editedProjectName,
  });
  await taskForm.locator('input[formcontrolname="title"]').fill(taskName);
  await taskForm.locator('input[formcontrolname="plannedHours"]').fill('3');
  await page.getByRole('button', { name: /add task/i }).click();

  const taskRow = page.locator('article').filter({ hasText: taskName }).first();

  await expect(taskRow).toBeVisible();
  await taskRow.getByRole('button', { name: /edit/i }).click();
  await taskForm.locator('input[formcontrolname="title"]').fill(editedTaskName);
  await page.getByRole('button', { name: /save task/i }).click();

  const editedTaskRow = page.locator('article').filter({ hasText: editedTaskName }).first();

  await expect(editedTaskRow).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await editedTaskRow.getByRole('button', { name: /delete/i }).click();
  await expect(editedTaskRow).toBeHidden();

  page.once('dialog', (dialog) => dialog.accept());
  await editedProjectRow.getByRole('button', { name: /delete/i }).click();
  await expect(editedProjectRow).toBeHidden();
});

test('user can save daily goal in settings', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('arina@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('link', { name: /settings/i }).click();
  await page.getByLabel(/daily goal/i).fill('7');
  await page.getByRole('button', { name: /save goal/i }).click();

  await expect(page.getByRole('status')).toHaveText('Daily goal saved: 7h');
});

test('user can register a new account', async ({ page }) => {
  const email = `student-${Date.now()}@example.com`;

  await page.goto('/login');
  await page.getByRole('button', { name: /create a new account/i }).click();
  await page.getByLabel('Name').fill('Student User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password1');
  await page.getByLabel(/daily goal/i).fill('7');
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page.getByRole('heading', { name: /work dashboard/i })).toBeVisible();
  await expect(page.getByText('Student User')).toBeVisible();

  const user = await page.request.get(`http://localhost:3000/users?email=${email}`);
  const [createdUser] = (await user.json()) as Array<{ id: string }>;

  if (createdUser) {
    await page.request.delete(`http://localhost:3000/users/${createdUser.id}`);
  }
});

test('user can request a password recovery link', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /forgot password/i }).click();
  await expect(page.getByRole('heading', { name: /recover your password/i })).toBeVisible();

  const resetForm = page.getByRole('form', { name: /password reset form/i });

  await resetForm.getByLabel('Email').fill('arina@example.com');
  await page.getByRole('button', { name: /send recovery link/i }).click();

  await expect(page.getByRole('status')).toContainText('Mock server prepared a reset link');
  await expect(page.getByRole('link', { name: /open mock reset link/i })).toBeVisible();
});

test('registration validates email and password strength', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /create a new account/i }).click();
  await page.getByLabel('Name').fill('Student User');
  await page.getByLabel('Email').fill('hhfh@mail');
  await page.getByLabel('Password').fill('password');
  await page.getByLabel(/daily goal/i).fill('7');

  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  await expect(page.getByText('Use at least 8 characters')).toBeVisible();
  await expect(page.getByRole('button', { name: /create account/i })).toBeDisabled();
});
