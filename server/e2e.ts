// Isolated in-memory backend for browser tests. Never touches data/pafupi.sqlite.
import { createApp } from './app.js';
import { openDb } from './db.js';
if (process.env.NODE_ENV === 'production') throw new Error('Test server cannot run in production.');
createApp(openDb()).listen(3003, '0.0.0.0');
