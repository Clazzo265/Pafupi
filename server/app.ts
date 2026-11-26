import express from 'express';
import { join } from 'node:path';
import { type AppConfig, type AuthAdapter } from './adapters/auth.js';
import { unavailablePayments } from './adapters/payments.js';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { AppError, text, validateTask, price, transition } from './domain.js';
import { demoProviders, type DB } from './db.js';
import type { Task, Offer, User, Status } from '../shared/types.js';
export function createApp(
  db: DB,
  options: { config?: AppConfig; auth?: AuthAdapter; frontendDir?: string } = {},
) {
  const config = options.config || { authMode: 'demo' };
  const demo = config.authMode === 'demo';
  if (!demo && (!options.auth || !config.supabase))
    throw new Error('A configured auth verifier is required outside demo mode.');
  if (
    !demo &&
    db.prepare("SELECT id FROM tasks WHERE json_extract(data, '$.sample')=1 LIMIT 1").get()
  )
    throw new Error('Use a clean database for account mode; demo fixtures must remain isolated.');
  const workspaceMode = db
    .prepare("SELECT value FROM workspace_meta WHERE key='auth_mode'")
    .get() as { value: string } | undefined;
  if (workspaceMode && workspaceMode.value !== config.authMode)
    throw new Error(
      'Workspace auth mode mismatch: use separate databases for sample and account environments.',
    );
  if (!workspaceMode)
    db.prepare('INSERT INTO workspace_meta VALUES (?,?)').run('auth_mode', config.authMode);
  const providers = demo ? demoProviders : [];

  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    });
    if (options.frontendDir)
      res.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data:; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
      );
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  const sessions = new Map<string, { user: User; expires: number }>();
  const limits = new Map<string, { count: number; until: number }>();
  app.use('/api', (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
    });
    const key = req.socket.remoteAddress || 'local';
    const now = Date.now();
    if (limits.size > 1000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
    const limit = limits.get(key);
    if (limit && limit.until > now) {
      if (++limit.count > 300)
        return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    } else limits.set(key, { count: 1, until: now + 60000 });
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.get('X-Pafupi-Client') !== 'web' || req.get('sec-fetch-site') === 'cross-site')
        return res.status(403).json({ error: 'Request origin rejected.' });
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
        return res.status(400).json({ error: 'A JSON object is required.' });
    }
    next();
  });
  app.get('/api/health', (_req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok', version: '0.2.0' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  app.get('/api/config', (_req, res) => res.json(config));
  app.post('/api/demo/session', (req, res) => {
    if (!demo) throw new AppError(404, 'Development sessions are disabled.');
    const role = req.body.role;
    if (!['customer', 'provider'].includes(role))
      throw new AppError(400, 'Choose customer or provider.');
    const oldToken = req.headers.cookie?.match(/(?:^|; )pafupi_session=([^;]+)/)?.[1];
    if (oldToken) sessions.delete(oldToken);
    for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key);
    const token = randomBytes(32).toString('hex');
    const user: User =
      role === 'customer'
        ? { id: 'customer-1', name: 'Neighbour', role }
        : { id: 'provider-1', name: 'Tadala', role };
    sessions.set(token, { user, expires: Date.now() + 8 * 3600000 });
    res.cookie('pafupi_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure || req.get('x-forwarded-proto') === 'https',
      maxAge: 8 * 3600000,
      path: '/',
    });
    res.json(user);
  });
  app.use('/api', async (req, res, next) => {
    if (!demo) {
      const authorization = req.get('Authorization') || '';
      if (!/^Bearer [A-Za-z0-9._~-]{20,8192}$/.test(authorization))
        throw new AppError(401, 'Please sign in to continue.');
      const identity = await options.auth!.verify(authorization.slice(7));
      if (!identity.emailVerified) throw new AppError(403, 'Confirm your email before continuing.');
      // Identity comes from the trusted adapter. Client metadata cannot grant provider/admin access.
      res.locals.user = {
        id: identity.id,
        name: identity.name,
        role: 'customer',
        emailVerified: true,
      };
      return next();
    }
    const token = req.headers.cookie?.match(/(?:^|; )pafupi_session=([^;]+)/)?.[1];
    const session = token ? sessions.get(token) : undefined;
    if (!session || session.expires < Date.now())
      return res
        .status(401)
        .json({ error: 'Your development session has ended. Reload to continue.' });
    res.locals.user = session.user;
    next();
  });
  function getTask(id: string) {
    const row = db.prepare('SELECT data FROM tasks WHERE id=?').get(id) as
      { data: string } | undefined;
    if (!row) throw new AppError(404, 'Task not found.');
    return JSON.parse(row.data) as Task;
  }
  function save(task: Task) {
    db.prepare('UPDATE tasks SET data=? WHERE id=?').run(JSON.stringify(task), task.id);
  }
  function event(task: Task, actor: string, type: string, detail: string) {
    db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(
      randomUUID(),
      task.id,
      actor,
      type,
      detail,
      new Date().toISOString(),
    );
  }
  function atomic<T>(fn: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }
  function participant(task: Task, user: User) {
    if (task.ownerId !== user.id && task.providerId !== user.id)
      throw new AppError(403, 'Only task participants can access this information.');
  }
  app.get('/api/bootstrap', (_req, res) => {
    const user = res.locals.user as User;
    const all = (
      db.prepare('SELECT data FROM tasks ORDER BY rowid DESC').all() as { data: string }[]
    ).map((r) => JSON.parse(r.data) as Task);
    const profile = providers.find((p) => p.id === user.id);
    const tasks = all.filter(
      (t) =>
        t.ownerId === user.id ||
        t.providerId === user.id ||
        (user.role === 'provider' &&
          profile?.available &&
          profile.categories.includes(t.category) &&
          ['PUBLISHED', 'OFFERS_RECEIVED'].includes(t.status)),
    );
    const ids = new Set(tasks.map((t) => t.id));
    const offers = (
      db.prepare('SELECT * FROM offers ORDER BY createdAt').all() as unknown as Offer[]
    ).filter((o) => ids.has(o.taskId) && (user.role === 'customer' || o.providerId === user.id));
    // Public opportunities omit customer IDs and exact manually entered locations until selection.
    const visible = tasks.map((t) =>
      user.role === 'provider' && t.providerId !== user.id
        ? {
            ...t,
            ownerId: '',
            pickup: 'Private until assigned',
            destination: 'Private until assigned',
          }
        : t,
    );
    res.json({ user, tasks: visible, offers, providers, demo });
  });
  app.post('/api/quote', (req, res) => res.json(price(validateTask(req.body))));
  app.post('/api/tasks', (req, res) => {
    const user = res.locals.user as User;
    if (user.role !== 'customer') throw new AppError(403, 'Only customers can publish requests.');
    const input = validateTask(req.body);
    const key = text(req.get('Idempotency-Key'), 'Request key', 10, 100);
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const task = atomic(() => {
      const previous = db.prepare('SELECT * FROM requests WHERE key=?').get(`${user.id}:${key}`) as
        { fingerprint: string; taskId: string } | undefined;
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new AppError(409, 'This request key was already used for different task details.');
        return getTask(previous.taskId);
      }
      const task: Task = {
        ...input,
        id: randomUUID(),
        ownerId: user.id,
        providerId: null,
        quote: price(input),
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        sample: false,
      };
      db.prepare('INSERT INTO tasks VALUES (?,?)').run(task.id, JSON.stringify(task));
      db.prepare('INSERT INTO requests VALUES (?,?,?,?)').run(
        `${user.id}:${key}`,
        user.id,
        fingerprint,
        task.id,
      );
      event(task, user.id, 'PUBLISHED', 'Task published with a server-calculated pilot quote.');
      return task;
    });
    res.status(201).json(task);
  });
  app.post('/api/tasks/:id/offers', (req, res) => {
    const user = res.locals.user as User;
    const offer = atomic(() => {
      const task = getTask(req.params.id);
      const provider = providers.find((p) => p.id === user.id);
      if (
        user.role !== 'provider' ||
        !provider?.available ||
        !provider.categories.includes(task.category) ||
        task.ownerId === user.id
      )
        throw new AppError(403, 'This provider is not eligible for the task.');
      if (!['PUBLISHED', 'OFFERS_RECEIVED'].includes(task.status))
        throw new AppError(409, 'This task is no longer taking offers.');
      const previous = db
        .prepare('SELECT * FROM offers WHERE taskId=? AND providerId=?')
        .get(task.id, user.id) as unknown as Offer | undefined;
      if (previous) {
        if (Date.now() - Date.parse(previous.createdAt) <= 86400000)
          throw new AppError(409, 'You have already offered on this task.');
        const renewed = {
          ...previous,
          note: text(req.body.note, 'Offer note', 10, 500),
          createdAt: new Date().toISOString(),
        };
        db.prepare('UPDATE offers SET note=?,createdAt=? WHERE id=?').run(
          renewed.note,
          renewed.createdAt,
          renewed.id,
        );
        event(task, user.id, 'OFFER_RENEWED', 'Expired offer renewed at the same displayed quote.');
        return renewed;
      }
      const offer = {
        id: randomUUID(),
        taskId: task.id,
        providerId: user.id,
        note: text(req.body.note, 'Offer note', 10, 500),
        createdAt: new Date().toISOString(),
      };
      db.prepare('INSERT INTO offers VALUES (?,?,?,?,?)').run(
        offer.id,
        task.id,
        user.id,
        offer.note,
        offer.createdAt,
      );
      task.status = 'OFFERS_RECEIVED';
      save(task);
      event(task, user.id, 'OFFER_SUBMITTED', 'Provider agreed to the displayed compensation.');
      return offer;
    });
    res.status(201).json(offer);
  });
  app.post('/api/tasks/:id/select', (req, res) => {
    const user = res.locals.user as User;
    const result = atomic(() => {
      const task = getTask(req.params.id);
      if (task.ownerId !== user.id)
        throw new AppError(403, 'Only the task owner can select a provider.');
      if (task.status !== 'OFFERS_RECEIVED')
        throw new AppError(409, 'Provider selection is not available.');
      const offer = db
        .prepare('SELECT * FROM offers WHERE id=? AND taskId=?')
        .get(text(req.body.offerId, 'Offer', 1, 100), task.id) as unknown as Offer | undefined;
      if (!offer) throw new AppError(404, 'Offer not found.');
      if (Date.now() - Date.parse(offer.createdAt) > 86400000)
        throw new AppError(409, 'This offer has expired. Ask the provider for a fresh offer.');
      task.providerId = offer.providerId;
      event(
        task,
        user.id,
        'PROVIDER_SELECTED',
        `Accepted quote ${JSON.stringify(task.quote)}. Offer ${offer.id}.`,
      );
      task.status = 'PAYMENT_PENDING';
      save(task);
      event(
        task,
        user.id,
        'PAYMENT_PENDING',
        'No payment initiated. A verified payment integration is required.',
      );
      return task;
    });
    res.json(result);
  });
  app.post('/api/tasks/:id/payment', async (req, res) => {
    const task = getTask(req.params.id);
    const user = res.locals.user as User;
    if (task.ownerId !== user.id)
      throw new AppError(403, 'Only the customer can authorize payment.');
    if (task.status !== 'PAYMENT_PENDING')
      throw new AppError(409, 'Select a provider before authorizing payment.');
    await unavailablePayments.createAuthorization({
      taskId: task.id,
      amount: task.quote.total,
      currency: 'MWK',
      idempotencyKey: task.id,
    });
    res.sendStatus(503);
  });
  app.post('/api/tasks/:id/transition', (req, res) => {
    const user = res.locals.user as User;
    const result = atomic(() => {
      const task = getTask(req.params.id);
      participant(task, user);
      const role = task.ownerId === user.id ? 'customer' : 'provider';
      const next = text(req.body.status, 'Status', 1, 40) as Status;
      transition(task.status, next, role);
      const detail = ['AWAITING_CONFIRMATION', 'DISPUTED'].includes(next)
        ? text(
            req.body.detail,
            next === 'DISPUTED' ? 'Dispute reason' : 'Completion evidence',
            10,
            2000,
          )
        : `${task.status} → ${next}`;
      task.status = next;
      save(task);
      event(task, user.id, next, detail);
      return task;
    });
    res.json(result);
  });
  app.get('/api/tasks/:id/activity', (req, res) => {
    const task = getTask(req.params.id);
    participant(task, res.locals.user);
    res.json({
      events: db.prepare('SELECT * FROM events WHERE taskId=? ORDER BY rowid').all(task.id),
      messages: db.prepare('SELECT * FROM messages WHERE taskId=? ORDER BY rowid').all(task.id),
    });
  });
  app.post('/api/tasks/:id/messages', (req, res) => {
    const task = getTask(req.params.id);
    const user = res.locals.user as User;
    participant(task, user);
    if (!task.providerId)
      throw new AppError(409, 'Choose a provider before starting a task conversation.');
    const message = {
      id: randomUUID(),
      taskId: task.id,
      senderId: user.id,
      body: text(req.body.body, 'Message', 1, 2000),
      createdAt: new Date().toISOString(),
    };
    db.prepare('INSERT INTO messages VALUES (?,?,?,?,?)').run(
      message.id,
      message.taskId,
      message.senderId,
      message.body,
      message.createdAt,
    );
    res.status(201).json(message);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  if (options.frontendDir) {
    app.use(
      express.static(options.frontendDir, {
        index: false,
        dotfiles: 'deny',
        setHeaders(res, file) {
          res.setHeader(
            'Cache-Control',
            file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
          );
        },
      }),
    );
    app.get('/{*path}', (req, res, next) => {
      if (!req.accepts('html') || req.path.split('/').pop()?.includes('.')) return next();
      res.set('Cache-Control', 'no-cache').sendFile(join(options.frontendDir!, 'index.html'));
    });
  }
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status =
        err instanceof AppError
          ? err.status
          : err instanceof SyntaxError
            ? 400
            : (err as { status?: number }).status === 413
              ? 413
              : 500;
      if (status === 500) console.error('Unexpected API failure', { type: err.name });
      res
        .status(status)
        .json({ error: status === 500 ? 'Something went wrong. Please try again.' : err.message });
    },
  );
  return app;
}
