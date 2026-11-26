import { test, expect } from '@playwright/test';
// Browser-only auth UX fixtures; no hosted project is provisioned or claimed to be live.
const url = 'https://auth-tests.supabase.co';
const publicKey = 'sb_publishable_browser_test_fixture';
test('account mode displays hosted sign-in, validates input, scopes drafts and signs out', async ({
  page,
}) => {
  const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: 'browser-test-account', exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
  let demoCalls = 0;
  await page.route('**/api/config', (r) =>
    r.fulfill({ json: { authMode: 'supabase', supabase: { url, publishableKey: publicKey } } }),
  );
  await page.route('**/api/demo/session', (r) => {
    demoCalls++;
    return r.fulfill({ status: 404, json: { error: 'Disabled in account mode' } });
  });
  await page.route(`${url}/auth/v1/token**`, (r) =>
    r.fulfill({
      json: {
        access_token: accessToken,
        refresh_token: 'test-refresh-token-not-real',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'browser-test-account',
          email: 'test@example.test',
          email_confirmed_at: new Date().toISOString(),
          app_metadata: { provider: 'email' },
          user_metadata: { name: 'Test Neighbour' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
    }),
  );
  await page.route(`${url}/auth/v1/logout**`, (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/bootstrap', (r) => {
    if (r.request().headers().authorization !== `Bearer ${accessToken}`)
      return r.fulfill({ status: 401, json: { error: 'Sign in required' } });
    return r.fulfill({
      json: {
        user: {
          id: 'browser-test-account',
          name: 'Test Neighbour',
          role: 'customer',
          emailVerified: true,
        },
        tasks: [],
        offers: [],
        providers: [],
        demo: false,
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome, neighbour.' })).toBeVisible();
  await page.getByLabel('Email address', { exact: true }).fill('test@example.test');
  await page.getByLabel('Password', { exact: true }).fill('A-long-test-password!');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toBeVisible();
  await expect(page.getByText('Email-confirmed account', { exact: true })).toBeVisible();
  expect(demoCalls).toBe(0);
  await page.getByRole('button', { name: 'Request a task', exact: true }).first().click();
  await page.getByLabel('What do you need help with?').fill('Scoped account draft');
  expect(
    await page.evaluate(() => Boolean(localStorage.getItem('pafupi-draft:browser-test-account'))),
  ).toBe(true);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'My profile', exact: true }).click();
  await expect(page.getByText('Personal account', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out of this device' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, neighbour.' })).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('pafupi-draft:browser-test-account')),
  ).toBeNull();
});
test('account creation requires consent and reports email confirmation rather than pretending verification', async ({
  page,
}) => {
  await page.route('**/api/config', (r) =>
    r.fulfill({ json: { authMode: 'supabase', supabase: { url, publishableKey: publicKey } } }),
  );
  await page.route(`${url}/auth/v1/signup**`, (r) =>
    r.fulfill({
      json: {
        id: 'new-test-user',
        email: 'new@example.test',
        user_metadata: { name: 'New Neighbour' },
        identities: [],
        created_at: new Date().toISOString(),
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await page.getByLabel('Your display name').fill('New Neighbour');
  await page.getByLabel('Email address', { exact: true }).fill('new@example.test');
  await page.getByLabel('Password', { exact: true }).fill('A-long-test-password!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).last().click();
  await expect(page.getByRole('status')).toContainText('Check your inbox to confirm your email');
  await expect(page.getByRole('heading', { name: 'Hello, neighbour' })).toHaveCount(0);
});
