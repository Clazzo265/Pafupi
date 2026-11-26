import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from './db.js';
test('local SQLite persistence survives reopening without duplicating sample data', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pafupi-test-'));
  try {
    let db = openDb(join(dir, 'test.sqlite'));
    db.prepare('INSERT INTO messages VALUES (?,?,?,?,?)').run(
      'test-message',
      'sample-task',
      'customer-1',
      'Synthetic persistence check.',
      new Date().toISOString(),
    );
    db.close();
    db = openDb(join(dir, 'test.sqlite'));
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM tasks').get() as { n: number }).n, 1);
    assert.equal((db.prepare('SELECT COUNT(*) AS n FROM messages').get() as { n: number }).n, 1);
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
