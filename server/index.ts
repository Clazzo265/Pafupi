import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { readConfig, supabaseAuth } from './adapters/auth.js';
if (process.env.NODE_ENV === 'production')
  throw new Error(
    'Public production startup is blocked until persistent hosted data, provider eligibility, payments and operational launch review are completed. Use development mode for controlled integration testing.',
  );
mkdirSync('data', { recursive: true });
const config = readConfig();
const db = openDb(
  process.env.DATABASE_PATH ||
    (config.authMode === 'demo' ? 'data/pafupi.sqlite' : 'data/accounts.sqlite'),
  config.authMode === 'demo',
);
const port = Number(process.env.PORT || 3001);
const server = createApp(db, {
  config,
  frontendDir: process.env.SERVE_FRONTEND === 'true' ? resolve('dist') : undefined,
  auth: config.authMode === 'supabase' ? supabaseAuth(config) : undefined,
}).listen(port, '0.0.0.0', () =>
  console.log(
    `PAFUPI development API on port ${port}. Auth: ${config.authMode}. Payments unavailable. Not approved for public production use.`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
