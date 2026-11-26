import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard and task dialog have no serious or critical accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  let audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.getByRole('button', { name: 'Request a task', exact: true }).click();
  audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});

test('mobile navigation traps focus and closes without losing the workspace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open navigation' });
  await open.click();
  const first = page.getByRole('button', { name: 'Pafupi home' });
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.sidebar-user')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});

test('hosted sign-in screen has no serious or critical accessibility violations', async ({
  page,
}) => {
  await page.route('**/api/config', (r) =>
    r.fulfill({
      json: {
        authMode: 'supabase',
        supabase: {
          url: 'https://accessibility-test.supabase.co',
          publishableKey: 'sb_publishable_accessibility_test_fixture',
        },
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome, neighbour.' })).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});
