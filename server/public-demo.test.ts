import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { openDb } from './db.js';
import { createApp } from './app.js';

test('shared public demo explicitly reports shared identities and never enables payments', async () => {
  const db = openDb();
  try {
    const app = createApp(db, { publicDemo: true });
    const visitor = request.agent(app);
    await visitor
      .post('/api/demo/session')
      .set('X-Pafupi-Client', 'web')
      .send({ role: 'customer' })
      .expect(200);
    const { body } = await visitor.get('/api/bootstrap').expect(200);
    assert.equal(body.demo, true);
    assert.equal(body.publicDemo, true);
    assert.equal(body.user.id, 'customer-1');
    db.prepare(
      "UPDATE tasks SET data=json_set(data, '$.status', 'PAYMENT_PENDING') WHERE id=?",
    ).run(body.tasks[0].id);
    await visitor
      .post(`/api/tasks/${body.tasks[0].id}/payment`)
      .set('X-Pafupi-Client', 'web')
      .send({})
      .expect(503);
  } finally {
    db.close();
  }
});

test('shared public demo cannot be combined with real account authentication', () => {
  const db = openDb(':memory:', false);
  try {
    assert.throws(
      () => createApp(db, { publicDemo: true, config: { authMode: 'supabase' } }),
      /requires sample authentication/,
    );
  } finally {
    db.close();
  }
});
