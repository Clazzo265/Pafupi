import { test, expect } from '@playwright/test';
test('installed app opens offline without caching private API responses or replaying writes', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  const cached = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      result.push(...(await cache.keys()).map((r) => new URL(r.url).pathname));
    }
    return result;
  });
  expect(cached).toContain('/index.html');
  expect(cached.some((url) => url.startsWith('/api'))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your neighbourhood will be right here.' }),
  ).toBeVisible();
  await expect(page.getByText('A few essentials for the week', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Publish request' })).toHaveCount(0);
  await context.setOffline(false);
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
});
test('direct navigation and browser history retain the selected workspace view', async ({
  page,
}) => {
  await page.goto('/#tasks');
  await expect(page.getByRole('heading', { name: 'One less thing on your list.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page).toHaveURL(/#explore$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Find your helping hand.' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'One less thing on your list.' })).toBeVisible();
});
