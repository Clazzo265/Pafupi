# PAFUPI

**Your neighbourhood. Your people. Your tasks.**

A Malawi-first, mobile-friendly task marketplace based on the supplied _PAFUPI Master System Build Prompt_. Initial intended community: **University of Livingstonia, Laws Campus, Rumphi, Malawi**. All amounts are Malawi Kwacha (MWK).

> **Pre-launch software, not a launched marketplace.** The sample identities, availability and initial task/offer are clearly illustrative. No real identity checks, nearby-distance results, payment transactions or completed-task statistics are fabricated. Optional hosted Supabase sign-in is implemented but not configured by default. Do not enter real personal, financial or sensitive information. Production API startup is intentionally blocked.

## Premium experience upgrade (v0.2)

- Locally bundled Manrope type, refined mobile/desktop layout, clearer contrast and keyboard navigation.
- Task summaries derived from actual workspace data, with quoted amounts explicitly distinguished from payments/balances.
- Installable app manifest, offline static app shell, explicit update prompts and reconnect recovery. Private API responses are **never cached**; offline writes are never replayed.
- Account-scoped, seven-day draft recovery; corrupted storage is handled safely and quote consent is never restored automatically.
- Optional **Supabase email/password authentication**: signup/confirmation, sign-in, password recovery, server-side bearer verification and sign-out. Account mode disables sample sessions and fixtures; provider/admin privileges cannot be self-assigned.
- Same-origin built-app serving, security headers, health probe, error boundary and browser accessibility regression tests.

See [the free-tier stack and activation guide](docs/FREE_TIER_STACK.md) for the services researched via **free-for.dev**, current official limits, exact setup steps and remaining dependencies. No external account or paid service has been provisioned.

## Run locally

Requires **Node.js 22.13+** (tested with 22.22.3; built-in `node:sqlite` is experimental on Node 22) and npm 10+.

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite serves React and proxies same-origin `/api` calls to the development API on port 3001. Both bind to `0.0.0.0`; browser code never calls a localhost API. `.e2b.app` preview hosts are permitted. No external keys, images, fonts or paid services are needed to run this development stage.

SQLite persists to the **gitignored** `data/pafupi.sqlite`. It is local development storage, not GitHub-backed storage. In default demo mode, sample sessions are held in memory and expire after eight hours or an API restart. Hosted-auth mode uses provider-validated bearer tokens and a separate unseeded local database. See `.env.example` for optional shell environment overrides; `.env` is not automatically loaded. Keep Node on a supported patched release.

## Try the working flow

1. **Request a task**. Choose a category, describe the scope, enter manual meeting points and review the server-generated itemized quote. The form saves an unpublished draft on the device.
2. Publish. Repeated requests with the same idempotency key cannot create duplicates.
3. Use **Try provider mode** in the sidebar (mobile: open the menu). This deliberately switches between two **development-only personas**; it is not authentication.
4. Find the request under **Opportunities**, submit a note and agree to the displayed compensation. Sample provider Tadala supports shopping, delivery and campus categories.
5. Switch back to customer mode, open the task and accept the full quote / choose the provider. This is atomic and records the accepted quote snapshot.
6. The task stops at **Awaiting payment setup**. **No money is charged and no payment bypass exists.** The unavailable payment adapter returns 503. Task conversations, cancellation and dispute recording are available as appropriate.
7. Open the task’s **Conversation** or **Activity** tab. Refresh to retrieve updates from the other persona.

The first task and offer are marked **Sample**. They can be inspected without creating a request. Offers expire after 24 hours; the provider can renew an expired offer at the same quote. This stage offers fixed displayed compensation, not price negotiation.

## Implemented

- Responsive customer/provider workspaces, service categories, search, category / availability / transport filters, profile and help views.
- Persistent validated task creation, backend-calculated whole-MWK pricing, explicit scope / quote approval, duplicate-request protection.
- Category-compatible opportunity discovery with private meeting points hidden until assignment; **no geographic distance claims**.
- Eligible **sample** provider offers, expiry/renewal, transactional selection, frozen quote and server-owned lifecycle.
- Participant-only task messages, append-only task events, cancellation and disputes.
- State-machine and text-evidence support for post-payment milestones, tested with isolated trusted fixtures. These paths **cannot be reached from payment-pending in this preview**. No uploads or handover codes yet.
- Local draft recovery, manual service-area labels, no GPS or background tracking, no remotely loaded media.
- Accessible native modal focus management, labelled controls, keyboard navigation and reduced-motion styling. Full WCAG / real-device testing remains a launch gate.
- PWA manifest, raster icons and a build-versioned service worker. Offline app-shell loading works after the first successful online load. No private API caching, offline first-load promise or offline API writes: a saved draft is not a published task.

## Quality checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium  # first browser-test setup
npm run test:e2e
npm audit --audit-level=moderate
```

Browser tests build the app and start an **isolated in-memory API on 3003** and a built-app preview on **5174**, never the working development database. The end-to-end suite checks publishing, provider offers, quote selection, blocked payments, messaging, filtering, mobile navigation, draft recovery, offline reload/privacy, browser history and hosted-auth UI with synthetic responses. Axe checks the dashboard and request dialog for serious/critical accessibility violations; this is not a complete accessibility certification. Backend tests cover authorization, pricing manipulation, validation, idempotency, privacy, expiry, lifecycle and evidence. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to a preinstalled Chromium in restricted environments.

GitHub Actions runs linting, formatting, type checks, backend tests, browser tests, dependency auditing and the frontend build. It uploads the frontend as a CI artifact; it **does not imply a working GitHub Pages backend**.

## Architecture & next steps

React 19 + TypeScript + Vite + Tailwind 4 + Lucide + locally hosted Manrope; Express 5 + Node SQLite. Optional Supabase Auth SDK is lazy-loaded in configured account mode. Task and request dialogs are lazy-loaded. Generated assets and user data are never committed. No runtime secrets are needed at this stage.

- [Free-tier service decisions, quotas and activation](docs/FREE_TIER_STACK.md)
- [Architecture, data model and API contracts](docs/ARCHITECTURE.md)
- [Threat model and privacy limitations](docs/SECURITY.md)
- [Deployment, backup and incident runbook](docs/OPERATIONS.md)
- [Phased backlog, acceptance status and research plan](docs/ROADMAP.md)

**Not implemented / not launch-ready:** live-configured auth and email delivery, OTP, provider/admin RBAC, hosted transactional data, identity verification, geospatial indexing/maps/routes, production payment processing/webhooks/reconciliation/refunds/settlements, file evidence / delivery codes, reviews, push/SMS/email, support/admin consoles, data export/deletion workflows, automated fraud detection and production observability. There is no live support team connected. The master brief’s full acceptance criteria have **not** been met.

To try the installable built version locally:

```sh
npm run build
PORT=5173 npm run serve:pilot
```

Stop any development server using port 5173 first. This is one-origin pre-launch serving, **not public production approval**. Development hot reload (`npm run dev`) intentionally does not install a service worker.

GitHub is the source/CI/planning hub, not the production database, payment provider, backend runtime or user-upload store. Provider selection, local storage, budgets, legal suitability and actual quotas must be verified before a public pilot. See the roadmap for a safe sequence.
