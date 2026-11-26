import { mkdirSync } from 'node:fs';
import { openDb } from './db.js';
import { createApp } from './app.js';
if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE === 'false')
  throw new Error(
    'This foundation uses development-only sessions. Production startup is blocked until real authentication, provider eligibility and payment adapters are implemented.',
  );
mkdirSync('data', { recursive: true });
const db = openDb(process.env.DATABASE_PATH || 'data/pafupi.sqlite');
const port = Number(process.env.PORT || 3001);
const server = createApp(db).listen(port, '0.0.0.0', () =>
  console.log(
    `PAFUPI development API on port ${port}. Sample identities enabled. Not for public production use.`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
