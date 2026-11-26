import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Pages subpath renders without a backend, filters and explains its limits', async ({
  page,
}) => {
  const apiRequests: string[] = [];
  const failures: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/api')) apiRequests.push(request.url());
  });
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.getByText('Read-only concept demo · GitHub Pages')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(3);
  await page.getByRole('button', { name: 'Campus errands', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Explore example' }).click();
  await expect(page.getByText(/No campus business/)).toBeVisible();
  await page.getByRole('button', { name: 'All services', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(3);
  await page.getByRole('link', { name: 'How it works' }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Local help. Clear expectations.' }),
  ).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(failures).toEqual([]);
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length)),
  ).toBe(0);
});

for (const width of [390, 1440])
  test(`read-only demo is accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''))).toEqual(
      [],
    );
  });
