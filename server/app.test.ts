import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { openDb } from './db.js';
import { createApp } from './app.js';
import type { Task } from '../shared/types.js';
const input = {
  title: 'Collect my printed notes',
  description: 'Please collect ten pages of printed course notes. Black and white, single sided.',
  category: 'campus',
  pickup: 'Private pickup landmark',
  destination: 'Private destination landmark',
  duration: 30,
  goods: 12000,
  travel: 1000,
  waitingMinutes: 0,
  tip: 0,
  transport: 'walking',
  deadline: 'Today',
  safetyAccepted: true,
};
async function fixture() {
  const db = openDb(':memory:', false);
  const app = createApp(db);
  const customer = request.agent(app),
    provider = request.agent(app);
  await customer
    .post('/api/demo/session')
    .set('X-Pafupi-Client', 'web')
    .send({ role: 'customer' })
    .expect(200);
  await provider
    .post('/api/demo/session')
    .set('X-Pafupi-Client', 'web')
    .send({ role: 'provider' })
    .expect(200);
  const create = async (changes = {}, key = 'unique-request-key-1') =>
    (
      await customer
        .post('/api/tasks')
        .set('X-Pafupi-Client', 'web')
        .set('Idempotency-Key', key)
        .send({ ...input, ...changes })
        .expect(201)
    ).body as Task;
  return { db, app, customer, provider, create };
}
test('private endpoints require an authenticated development session', async () => {
  const { db, app } = await fixture();
  try {
    await request(app).get('/api/bootstrap').expect(401);
  } finally {
    db.close();
  }
});
test('custom header and cross-site checks prevent browser cross-origin writes', async () => {
  const { db, customer } = await fixture();
  try {
    await customer.post('/api/tasks').send(input).expect(403);
    await customer
      .post('/api/tasks')
      .set('X-Pafupi-Client', 'web')
      .set('sec-fetch-site', 'cross-site')
      .send(input)
      .expect(403);
  } finally {
    db.close();
  }
});
test('create persists a server-owned, server-priced task and append-only publication event', async () => {
  const { db, customer, create } = await fixture();
  try {
    const task = await create({ ownerId: 'attacker', status: 'COMPLETED', quote: { total: 1 } });
    assert.equal(task.ownerId, 'customer-1');
    assert.equal(task.status, 'PUBLISHED');
    assert.equal(task.quote.total, 15800);
    const list = await customer.get('/api/bootstrap').expect(200);
    assert.equal(list.body.tasks[0].id, task.id);
    const activity = await customer.get(`/api/tasks/${task.id}/activity`).expect(200);
    assert.equal(activity.body.events[0].type, 'PUBLISHED');
  } finally {
    db.close();
  }
});
test('retrying a publish is idempotent, but a changed payload with the same key is rejected', async () => {
  const { db, customer, create } = await fixture();
  try {
    const a = await create();
    const b = await create();
    assert.equal(a.id, b.id);
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM tasks').get() as { n: number }).n, 1);
    await customer
      .post('/api/tasks')
      .set('X-Pafupi-Client', 'web')
      .set('Idempotency-Key', 'unique-request-key-1')
      .send({ ...input, title: 'Different task request' })
      .expect(409);
  } finally {
    db.close();
  }
});
test('provider discovery hides private locations and filters incompatible tasks', async () => {
  const { db, provider, create } = await fixture();
  try {
    await create();
    await create({ category: 'home' }, 'unique-request-key-2');
    const r = await provider.get('/api/bootstrap').expect(200);
    assert.equal(r.body.tasks.length, 1);
    assert.equal(r.body.tasks[0].pickup, 'Private until assigned');
    assert.equal(r.body.tasks[0].ownerId, '');
  } finally {
    db.close();
  }
});
test('only eligible providers can offer, and duplicate offers are rejected', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const t = await create();
    const path = `/api/tasks/${t.id}/offers`;
    await customer
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I would like to offer.' })
      .expect(403);
    await provider
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(201);
    await provider
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(409);
    const incompatible = await create({ category: 'home' }, 'unique-request-key-2');
    await provider
      .post(`/api/tasks/${incompatible.id}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(403);
  } finally {
    db.close();
  }
});
test('full quote selection, protected messaging, payment blocking and auditable dispute', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    const base = `/api/tasks/${task.id}`;
    await provider.get(`${base}/activity`).expect(403);
    const { body: offer } = await provider
      .post(`${base}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(201);
    await provider
      .post(`${base}/select`)
      .set('X-Pafupi-Client', 'web')
      .send({ offerId: offer.id })
      .expect(403);
    const selected = await customer
      .post(`${base}/select`)
      .set('X-Pafupi-Client', 'web')
      .send({ offerId: offer.id, quote: { total: 1 } })
      .expect(200);
    assert.equal(selected.body.status, 'PAYMENT_PENDING');
    assert.equal(selected.body.quote.total, 15800);
    await customer
      .post(`${base}/select`)
      .set('X-Pafupi-Client', 'web')
      .send({ offerId: offer.id })
      .expect(409);
    await customer
      .post(`${base}/payment`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'confirmed' })
      .expect(503);
    await customer
      .post(`${base}/transition`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'PAYMENT_CONFIRMED' })
      .expect(409);
    await provider
      .post(`${base}/transition`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'IN_PROGRESS' })
      .expect(409);
    await customer
      .post(`${base}/messages`)
      .set('X-Pafupi-Client', 'web')
      .send({ body: 'Let’s agree on the collection point.' })
      .expect(201);
    const chat = await provider.get(`${base}/activity`).expect(200);
    assert.equal(chat.body.messages.length, 1);
    const discovery = await provider.get('/api/bootstrap').expect(200);
    assert.equal(discovery.body.tasks[0].pickup, input.pickup);
    await customer
      .post(`${base}/transition`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'DISPUTED', detail: 'The scope requires clarification before any work.' })
      .expect(200);
    const { body: activity } = await customer.get(`${base}/activity`).expect(200);
    assert.deepEqual(
      activity.events.map((e: { type: string }) => e.type),
      ['PUBLISHED', 'OFFER_SUBMITTED', 'PROVIDER_SELECTED', 'PAYMENT_PENDING', 'DISPUTED'],
    );
    assert.match(activity.events[2].detail, /15800/);
  } finally {
    db.close();
  }
});
test('evidence required before confirmation; only customer can complete a task', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    // Trusted test fixture only. There is intentionally no runtime endpoint to bypass payment.
    db.prepare('UPDATE tasks SET data=? WHERE id=?').run(
      JSON.stringify({ ...task, providerId: 'provider-1', status: 'IN_PROGRESS' }),
      task.id,
    );
    const path = `/api/tasks/${task.id}/transition`;
    await provider
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'AWAITING_CONFIRMATION' })
      .expect(400);
    await provider
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({
        status: 'AWAITING_CONFIRMATION',
        detail: 'All ten printed pages handed over at the agreed meeting point.',
      })
      .expect(200);
    await provider
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'COMPLETED' })
      .expect(409);
    await customer
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'COMPLETED' })
      .expect(200);
    await customer
      .post(path)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'COMPLETED' })
      .expect(409);
  } finally {
    db.close();
  }
});
test('cancelled tasks cannot receive offers or be reopened', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    const base = `/api/tasks/${task.id}`;
    await customer
      .post(`${base}/transition`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'CANCELLED' })
      .expect(200);
    await provider
      .post(`${base}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(409);
    await customer
      .post(`${base}/transition`)
      .set('X-Pafupi-Client', 'web')
      .send({ status: 'PUBLISHED' })
      .expect(409);
  } finally {
    db.close();
  }
});
test('expired offers cannot be selected', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    const { body: offer } = await provider
      .post(`/api/tasks/${task.id}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect these notes today.' })
      .expect(201);
    db.prepare('UPDATE offers SET createdAt=? WHERE id=?').run(
      '2000-01-01T00:00:00.000Z',
      offer.id,
    );
    await customer
      .post(`/api/tasks/${task.id}/select`)
      .set('X-Pafupi-Client', 'web')
      .send({ offerId: offer.id })
      .expect(409);
  } finally {
    db.close();
  }
});
test('provider cannot publish tasks or read nonexistent task records', async () => {
  const { db, provider, customer } = await fixture();
  try {
    await provider
      .post('/api/tasks')
      .set('X-Pafupi-Client', 'web')
      .set('Idempotency-Key', 'unique-request-key-1')
      .send(input)
      .expect(403);
    await customer.get('/api/tasks/unknown/activity').expect(404);
  } finally {
    db.close();
  }
});

test('simultaneous selection requests cannot assign twice', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    const { body: offer } = await provider
      .post(`/api/tasks/${task.id}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect your notes this afternoon.' })
      .expect(201);
    const responses = await Promise.all(
      [1, 2].map(() =>
        customer
          .post(`/api/tasks/${task.id}/select`)
          .set('X-Pafupi-Client', 'web')
          .send({ offerId: offer.id }),
      ),
    );
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
    const events = db
      .prepare("SELECT * FROM events WHERE taskId=? AND type='PROVIDER_SELECTED'")
      .all(task.id);
    assert.equal(events.length, 1);
  } finally {
    db.close();
  }
});

test('expired offers can be renewed without changing the fixed quote', async () => {
  const { db, customer, provider, create } = await fixture();
  try {
    const task = await create();
    const { body: offer } = await provider
      .post(`/api/tasks/${task.id}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'I can collect your notes this afternoon.' })
      .expect(201);
    db.prepare('UPDATE offers SET createdAt=? WHERE id=?').run(
      '2000-01-01T00:00:00.000Z',
      offer.id,
    );
    const { body: renewed } = await provider
      .post(`/api/tasks/${task.id}/offers`)
      .set('X-Pafupi-Client', 'web')
      .send({ note: 'Renewing my availability for this collection.' })
      .expect(201);
    assert.equal(renewed.id, offer.id);
    const { body: selected } = await customer
      .post(`/api/tasks/${task.id}/select`)
      .set('X-Pafupi-Client', 'web')
      .send({ offerId: offer.id })
      .expect(200);
    assert.deepEqual(selected.quote, task.quote);
  } finally {
    db.close();
  }
});

test('event update and delete are rejected at the database boundary', async () => {
  const { db, create } = await fixture();
  try {
    const task = await create();
    assert.throws(
      () => db.prepare('UPDATE events SET detail=? WHERE taskId=?').run('tampered', task.id),
      /append-only/,
    );
    assert.throws(
      () => db.prepare('DELETE FROM events WHERE taskId=?').run(task.id),
      /append-only/,
    );
  } finally {
    db.close();
  }
});

test('malformed and oversized JSON cannot cause mutations', async () => {
  const { db, customer } = await fixture();
  try {
    await customer.post('/api/tasks').set('X-Pafupi-Client', 'web').send([]).expect(400);
    await customer
      .post('/api/tasks')
      .set('X-Pafupi-Client', 'web')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
    await customer
      .post('/api/tasks')
      .set('X-Pafupi-Client', 'web')
      .send({ ...input, description: 'x'.repeat(40000) })
      .expect(413);
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM tasks').get() as { n: number }).n, 0);
  } finally {
    db.close();
  }
});
