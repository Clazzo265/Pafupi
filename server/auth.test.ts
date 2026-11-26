import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';
import { openDb } from './db.js';
import { AppError } from './domain.js';
import { readConfig, type AppConfig, type AuthAdapter } from './adapters/auth.js';
const config: AppConfig = {
  authMode: 'supabase',
  supabase: {
    url: 'https://test-project.supabase.co',
    publishableKey: 'sb_publishable_test_fixture_only',
  },
};
const input = {
  title: 'Account isolation test task',
  description: 'Synthetic task for authentication and ownership validation.',
  category: 'campus',
  pickup: 'Private pickup for user one',
  destination: 'Private delivery for user one',
  duration: 30,
  goods: 0,
  travel: 500,
  waitingMinutes: 0,
  tip: 0,
  transport: 'walking',
  deadline: 'Today',
  safetyAccepted: true,
};
const tokenOne = 'test-identity-one-'.repeat(3),
  tokenTwo = 'test-identity-two-'.repeat(3);
// Injected verifier at the trusted adapter boundary, never a public auth bypass.
const auth: AuthAdapter = {
  async verify(token) {
    if (![tokenOne, tokenTwo].includes(token)) throw new AppError(401, 'Invalid authentication.');
    return {
      id: token === tokenOne ? 'account-one' : 'account-two',
      name: 'Test Neighbour',
      emailVerified: true,
    };
  },
};
test('configuration fails closed on typos, missing setup and privileged keys', () => {
  assert.deepEqual(readConfig({}), { authMode: 'demo' });
  for (const env of [
    { AUTH_MODE: 'production' },
    { AUTH_MODE: 'supabase' },
    {
      AUTH_MODE: 'supabase',
      SUPABASE_URL: 'http://localhost:8080',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
    {
      AUTH_MODE: 'supabase',
      SUPABASE_URL: config.supabase!.url,
      SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not_public',
    },
    {
      AUTH_MODE: 'supabase',
      SUPABASE_URL: config.supabase!.url,
      SUPABASE_PUBLISHABLE_KEY: 'eyJservice_role',
    },
  ])
    assert.throws(() => readConfig(env));
  assert.equal(
    readConfig({
      AUTH_MODE: 'supabase',
      SUPABASE_URL: config.supabase!.url,
      SUPABASE_PUBLISHABLE_KEY: config.supabase!.publishableKey,
    }).authMode,
    'supabase',
  );
});
test('account mode requires a verifier and rejects a demo database', () => {
  const clean = openDb(':memory:', false);
  const seeded = openDb();
  try {
    assert.throws(() => createApp(clean, { config }), /verifier/);
    assert.throws(() => createApp(seeded, { config, auth }), /clean database/);
  } finally {
    clean.close();
    seeded.close();
  }
});
test('account and sample environments cannot silently share the same database', () => {
  const db = openDb(':memory:', false);
  try {
    createApp(db, { config, auth });
    assert.throws(() => createApp(db), /auth mode mismatch/);
  } finally {
    db.close();
  }
});

test('health/config are public; hosted mode disables demo sessions and rejects fake tokens', async () => {
  const db = openDb(':memory:', false);
  const app = createApp(db, { config, auth });
  try {
    const health = await request(app).get('/api/health').expect(200);
    assert.equal(health.body.status, 'ok');
    assert.equal(health.headers['cache-control'], 'no-store');
    const publicConfig = await request(app).get('/api/config').expect(200);
    assert.deepEqual(publicConfig.body, config);
    await request(app)
      .post('/api/demo/session')
      .set('X-Pafupi-Client', 'web')
      .send({ role: 'provider' })
      .expect(404);
    await request(app).get('/api/bootstrap').expect(401);
    await request(app)
      .get('/api/bootstrap')
      .set('Authorization', 'Bearer forged-client-token-that-is-not-valid')
      .expect(401);
  } finally {
    db.close();
  }
});
test('independent identities cannot read private task data or grant themselves provider/admin privileges', async () => {
  const db = openDb(':memory:', false);
  const app = createApp(db, { config, auth });
  try {
    const initial = await request(app)
      .get('/api/bootstrap')
      .set('Authorization', `Bearer ${tokenOne}`)
      .expect(200);
    assert.equal(initial.body.demo, false);
    assert.deepEqual(initial.body.providers, []);
    assert.deepEqual(initial.body.tasks, []);
    assert.equal(initial.body.user.emailVerified, true);
    const { body: task } = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenOne}`)
      .set('X-Pafupi-Client', 'web')
      .set('Idempotency-Key', 'account-request-id-1')
      .send({ ...input, ownerId: 'account-two', role: 'admin' })
      .expect(201);
    assert.equal(task.ownerId, 'account-one');
    const other = await request(app)
      .get('/api/bootstrap')
      .set('Authorization', `Bearer ${tokenTwo}`)
      .expect(200);
    assert.deepEqual(other.body.tasks, []);
    assert.equal(other.body.user.role, 'customer');
    await request(app)
      .get(`/api/tasks/${task.id}/activity`)
      .set('Authorization', `Bearer ${tokenTwo}`)
      .expect(403);
    await request(app)
      .post(`/api/tasks/${task.id}/transition`)
      .set('Authorization', `Bearer ${tokenTwo}`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'CANCELLED' })
      .expect(403);
    await request(app)
      .post(`/api/tasks/${task.id}/offers`)
      .set('Authorization', `Bearer ${tokenTwo}`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I claim to be a verified provider.', role: 'provider', verified: true })
      .expect(403);
    const events = await request(app)
      .get(`/api/tasks/${task.id}/activity`)
      .set('Authorization', `Bearer ${tokenOne}`)
      .expect(200);
    assert.equal(events.body.events.length, 1);
  } finally {
    db.close();
  }
});
test('unconfirmed email cannot access marketplace even with an accepted token', async () => {
  const db = openDb(':memory:', false);
  try {
    const app = createApp(db, {
      config,
      auth: {
        async verify() {
          return { id: 'unconfirmed', name: 'Test', emailVerified: false };
        },
      },
    });
    await request(app).get('/api/bootstrap').set('Authorization', `Bearer ${tokenOne}`).expect(403);
  } finally {
    db.close();
  }
});

test('single-origin build serving keeps assets cacheable but APIs private', async () => {
  const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const root = mkdtempSync(join(tmpdir(), 'pafupi-static-'));
  const db = openDb(':memory:', false);
  try {
    mkdirSync(join(root, 'assets'));
    writeFileSync(join(root, 'index.html'), '<!doctype html><title>PAFUPI test shell</title>');
    writeFileSync(join(root, 'assets', 'test.js'), 'console.log("static fixture");');
    writeFileSync(join(root, 'sw.js'), '/* static service worker fixture */');
    const app = createApp(db, { frontendDir: root });
    const home = await request(app).get('/').expect(200);
    assert.match(home.text, /PAFUPI test shell/);
    assert.match(home.headers['content-security-policy'], /object-src 'none'/);
    const asset = await request(app).get('/assets/test.js').expect(200);
    assert.match(asset.headers['cache-control'], /immutable/);
    const worker = await request(app).get('/sw.js').expect(200);
    assert.equal(worker.headers['cache-control'], 'no-cache');
    await request(app).get('/api/bootstrap').expect(401);
    const api = await request(app).get('/api/health').expect(200);
    assert.equal(api.headers['cache-control'], 'no-store');
    await request(app).get('/.env').expect(404);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('Supabase adapter validates with the provider and does not promote client metadata', async () => {
  const { mock } = await import('node:test');
  const { supabaseAuth } = await import('./adapters/auth.js');
  let accepted = true;
  const fetch = mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      assert.match(String(input), /^https:\/\/test-project\.supabase\.co\/auth\/v1\/user/);
      assert.equal(new Headers(init?.headers).get('Authorization'), `Bearer ${tokenOne}`);
      return new Response(
        JSON.stringify(
          accepted
            ? {
                id: 'trusted-provider-id',
                email_confirmed_at: new Date().toISOString(),
                user_metadata: { name: 'A neighbour', role: 'admin', verified: true },
              }
            : { msg: 'Invalid token', code: 'bad_jwt' },
        ),
        { status: accepted ? 200 : 401, headers: { 'Content-Type': 'application/json' } },
      );
    },
  );
  try {
    const verifier = supabaseAuth(config);
    const identity = await verifier.verify(tokenOne);
    assert.deepEqual(identity, {
      id: 'trusted-provider-id',
      name: 'A neighbour',
      emailVerified: true,
    });
    accepted = false;
    await assert.rejects(
      () => verifier.verify(tokenOne),
      (error: unknown) => error instanceof AppError && error.status === 401,
    );
  } finally {
    fetch.mock.restore();
  }
});
