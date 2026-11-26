import { test, expect } from '@playwright/test';
test('customer → provider offer → accepted quote → private conversation; payment remains blocked', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Request a task', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('What do you need help with?').fill('Collect a campus notebook');
  await dialog.getByLabel('Choose a category').selectOption('campus');
  await dialog
    .getByLabel('A few more details')
    .fill('Please collect one A4 notebook. Confirm the colour and price before purchasing.');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByLabel('Pickup / task location').fill('Sample collection point');
  await dialog.getByLabel('Destination', { exact: true }).fill('Sample campus meeting point');
  await dialog.getByLabel('Budget for goods (MK)').fill('1000');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog.getByText('MK 4,300', { exact: true })).toBeVisible();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Publish request' }).click();
  await expect(
    page.getByRole('heading', { name: 'Collect a campus notebook', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Try provider mode' }).click();
  await expect(page.getByRole('heading', { name: 'Good things start with you.' })).toBeVisible();
  await page.getByRole('button', { name: /Collect a campus notebook/ }).click();
  await expect(page.getByText('Private until assigned', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Your offer note').fill('I can collect your notebook this afternoon.');
  await page.getByRole('button', { name: 'Offer to help' }).click();
  await expect(page.getByText('Your offer is with the customer.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Try customer mode' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  await page.getByRole('button', { name: 'View task', exact: true }).click();
  await page.getByRole('button', { name: 'Accept quote & choose provider' }).click();
  await expect(page.getByRole('heading', { name: 'Payments aren’t connected yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Conversation', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Let’s confirm our meeting point here.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(
    page.getByText('Let’s confirm our meeting point here.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(page.getByText('No payment initiated.', { exact: false })).toBeVisible();
});
test('search and filters use actual sample category and availability data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.getByRole('button', { name: 'Home & garden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thoko B.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tadala M.' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Available sample providers').check();
  await expect(page.getByRole('heading', { name: 'No matching profiles.' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('textbox', { name: 'Search services, providers and tasks' }).fill('Chisomo');
  await expect(page.getByRole('button', { name: 'Chisomo K.' })).toBeVisible();
  await page.getByRole('button', { name: 'Chisomo K.' }).click();
  await expect(page.getByText('No verified reviews or completed tasks')).toBeVisible();
});
test('mobile layout, keyboard-accessible dialog and saved draft survive a reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Request a task', exact: true }).click();
  await page.getByLabel('What do you need help with?').fill('My locally saved task');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Request a task', exact: true }).click();
  await expect(page.getByLabel('What do you need help with?')).toHaveValue('My locally saved task');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'My tasks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'One less thing on your list.' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});

test('interrupted connectivity preserves the draft and never pretends it was published', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Request a task', exact: true }).click();
  await page.getByLabel('What do you need help with?').fill('Offline recovery test task');
  await page
    .getByLabel('A few more details')
    .fill('Synthetic task information for a connection recovery check.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Pickup / task location').fill('Sample pickup point');
  await page.getByLabel('Destination', { exact: true }).fill('Sample destination point');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Any locally saved task draft is unchanged');
  await expect(page.getByRole('button', { name: 'Publish request' })).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Publish request' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Offline recovery test task' })).toBeVisible();
});
