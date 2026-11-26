import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { price } from './domain.js';
import type { Provider, Task } from '../shared/types.js';
export const demoProviders: Provider[] = [
  {
    id: 'provider-1',
    name: 'Tadala M.',
    initials: 'TM',
    color: 'sage',
    bio: 'Happy to help with your shopping list and everyday campus errands.',
    categories: ['shopping', 'campus', 'delivery'],
    transport: 'walking',
    available: true,
    sample: true,
  },
  {
    id: 'provider-2',
    name: 'Chisomo K.',
    initials: 'CK',
    color: 'clay',
    bio: 'A little help for your busy day. Pickups, parcels and campus essentials.',
    categories: ['delivery', 'campus', 'assistance'],
    transport: 'cycling',
    available: true,
    sample: true,
  },
  {
    id: 'provider-3',
    name: 'Thoko B.',
    initials: 'TB',
    color: 'lavender',
    bio: 'From a tidy space to a task ticked off. Here to lend a hand.',
    categories: ['home', 'assistance', 'shopping'],
    transport: 'walking',
    available: false,
    sample: true,
  },
];
export function openDb(path = ':memory:', seed = true) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), providerId TEXT NOT NULL, note TEXT NOT NULL, createdAt TEXT NOT NULL, UNIQUE(taskId,providerId));
    CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), actorId TEXT NOT NULL, type TEXT NOT NULL, detail TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, taskId TEXT NOT NULL REFERENCES tasks(id), senderId TEXT NOT NULL, body TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS requests(key TEXT PRIMARY KEY, ownerId TEXT NOT NULL, fingerprint TEXT NOT NULL, taskId TEXT NOT NULL REFERENCES tasks(id));
    CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT, 'Task events are append-only'); END;
    CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT, 'Task events are append-only'); END;
    CREATE INDEX IF NOT EXISTS offers_task ON offers(taskId);
    CREATE INDEX IF NOT EXISTS events_task ON events(taskId);
    CREATE INDEX IF NOT EXISTS messages_task ON messages(taskId);`);
  if (seed && !db.prepare('SELECT id FROM tasks LIMIT 1').get()) {
    const task: Task = {
      id: 'sample-task',
      ownerId: 'customer-1',
      providerId: null,
      title: 'A few essentials for the week',
      description:
        'Please pick up bread, eggs and a small bottle of cooking oil. Confirm item prices before purchasing.',
      category: 'shopping',
      pickup: 'Pickup to be agreed with provider',
      destination: 'My campus meeting point',
      duration: 30,
      travel: 500,
      goods: 8000,
      waitingMinutes: 0,
      tip: 0,
      transport: 'walking',
      deadline: 'Today',
      safetyAccepted: true,
      status: 'OFFERS_RECEIVED',
      quote: price({ duration: 30, travel: 500, goods: 8000, waitingMinutes: 0, tip: 0 }),
      createdAt: new Date().toISOString(),
      sample: true,
    };
    db.prepare('INSERT INTO tasks VALUES (?,?)').run(task.id, JSON.stringify(task));
    db.prepare('INSERT INTO offers VALUES (?,?,?,?,?)').run(
      'sample-offer',
      task.id,
      'provider-1',
      'I can help with this list. Let’s agree on the pickup details first.',
      new Date().toISOString(),
    );
    db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(
      randomUUID(),
      task.id,
      'system',
      'SAMPLE_CREATED',
      'Illustrative development task and offer. No payment or verification has taken place.',
      new Date().toISOString(),
    );
  }
  return db;
}
export type DB = ReturnType<typeof openDb>;
