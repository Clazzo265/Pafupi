# Development operations & launch runbook

## v0.2 operational additions

Read [FREE_TIER_STACK.md](FREE_TIER_STACK.md) for reviewed free-tier options and hosted-auth setup. Current preview remains sample mode unless configured by the project owner. `npm run build && npm run serve:pilot` serves static files, service worker and API from one origin (API `PORT`, default 3001). This remains controlled pre-launch software; production startup is blocked. Both Vite dev and Vite preview now proxy `/api`, so a built preview plus a running API works locally. No provider account or public cloud deployment has been made.

- `GET /api/health`: no-store, no-auth liveness probe; checks SQLite connectivity. It is not a backup/payment-reconciliation guarantee.
- `GET /api/config`: public auth mode and optional non-secret Supabase project URL/publishable key. No secret/service-role credentials accepted.
- `AUTH_MODE=demo`: original sample workflow, process-local sessions, seeded `data/pafupi.sqlite`.
- `AUTH_MODE=supabase`: separate `data/accounts.sqlite` by default; no fixtures; remote verified email auth; customer role only; no provider enrollment or live payments. Use HTTPS and correct redirect URLs for controlled remote tests.
- Build service worker: static files only, explicit update button, never private API caching. To inspect an old-version issue, use browser Application → Service Workers/Cache Storage, remove only `pafupi-shell-*` caches and reload online. Do not silently erase drafts.
- Browser regression tests now run against built assets, including offline reload/privacy, auth UX fixtures and Axe serious/critical checks. Synthetic fixtures are not evidence of live email delivery.

The existing GitHub CI still applies. Tests build before Playwright and use only synthetic credentials/data. Finish real hosted auth/email testing and a persistent managed data deployment before any public launch.

## GitHub-first responsibilities

Keep source, design decisions, issue templates/backlog, tests, reviews, workflows and deployment configuration in this repository. Use GitHub Issues/Projects to track the phases in ROADMAP.md. Protect the release branch, require reviewed PRs and green CI, enable dependency/security alerts and secret scanning where available, and tag reviewed releases. No GitHub project, issue or release has been created automatically by this implementation.

GitHub Actions builds/tests; it is **not** an always-on application runtime. GitHub Pages can serve `dist/` as a static frontend after a real public API is provisioned and base paths/API routing are configured. The current build uses root-relative URLs, a Vite development proxy and a dynamic `/api`, so blindly publishing `dist/` to Pages would leave nonfunctional API calls. Do not do that or claim Pages hosts the database. No production deployment is configured.

## Development setup / preview

1. Install patched Node 22.13+ and npm 10+; `npm ci`.
2. Run `npm run dev`; browse port **5173**. The API on **3001** is a development dependency, not the UI. Both bind 0.0.0.0 for sandbox previews.
3. Vite permits `.e2b.app` previews. Browser requests use same-origin `/api`; Vite proxies to 127.0.0.1 **inside the server environment**. No browser localhost cross-service requests.
4. Optional shell vars: `DATABASE_PATH`, `PORT`, `API_TARGET`. Vite has no secret frontend environment variables. See `.env.example`; do not assume `.env` loading.
5. `npm run build` creates frontend assets only. `npm start` runs the development API only. `npm run preview` serves a build and proxies `/api` to the separately running API. `npm run serve:pilot` serves the built app and API together. Neither is public production approval.
6. CI runs `npm ci`, lint, formatting, type checks, tests, audit, build and Playwright Chromium tests. Browser setup may need system libraries. Test DB lives in memory and is discarded on server exit. Browser traces can contain test text; use only synthetic values.

### Reset development data

Stop all running API processes, then delete **only** the ignored `data/pafupi.sqlite`, `data/pafupi.sqlite-wal` and `data/pafupi.sqlite-shm` if present. Restart to recreate the sample fixture. Clear local drafts via Profile or browser storage. Never remove the repository or `.git`. All personas share the same local test data; separate real accounts do not exist yet.

### Local backup and restore

Stop the API before copying the SQLite DB or use SQLite's online backup capability. WAL files must not be ignored during a live filesystem copy. Keep any copies outside Git and encrypt them if they could contain private data. Restore with the API stopped, preserve a rollback copy and check `PRAGMA integrity_check`, foreign keys, task/offer counts and sample workflows. Sessions are not restored. This is guidance for development only; no managed backup, RPO/RTO or restoration drills have been configured.

## Production launch prerequisites

- Configure and validate the hosted-auth adapter on a real project (demo sessions/fixtures are already disabled in account mode); finish verified contact policies, privileged backend roles, recovery/revocation and user-data controls.
- Replace local DB with a backed-up transactional managed database. Set a region/data-residency policy, access controls, indexes, migrations and retention. Load-test real concurrency and recovery.
- Deploy a dedicated API runtime with TLS, restrictive CORS or same-origin reverse proxy, CSP, trusted-proxy settings, rate limits, health checks, secret manager and private DB network access.
- Implement customer/provider eligibility, controlled identity review, restricted uploads, safety escalation, support/admin permission boundaries and audited actions.
- Obtain payment merchant approval and legal review. Verify Malawi availability, MWK handling, fee disclosures, webhook signing, settlement/split capability and refunds with provider sandbox/certification. Never describe an internal balance as protected escrow.
- Define signed webhook raw-body handling, immutable ledger and idempotent processing. Test duplicate/out-of-order callbacks, forged signatures, wrong currency/amount, timeouts and reconciliation. No successful client-side redirect may confirm payment.
- Configure private file storage, secure signed URLs, scanning and evidence/handover requirements. Do not use Git or LFS for uploads.
- Verify campus service coverage and any map points. Configure key restrictions, attribution, quotas, travel-mode suitability and budget alerts before adding maps/routes. Manual landmark descriptions remain required.
- Add observable structured logs without private text, uptime/error/payment reconciliation alerts, support procedures, deletion/export and breach response. Establish a responsible launch approval owner.

## Cost / dependency disclosures

This local foundation needs no cloud accounts. **Zero-cost production is not guaranteed.** No live vendor quota, billing or commercial access claims have been made. Before provisioning, record actual current figures in a deployment decision:

| Dependency             | Verify before use                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GitHub Actions / Pages | Plan-specific build minutes, artifact retention, bandwidth, static-site limits; required repository settings         |
| Database / auth        | Region, MAU/OTP costs, storage, reads/writes/compute, idle pausing, PITR/backups, egress and scaling                 |
| API runtime            | Cold starts, request/time/memory limits, always-on charges, outbound networking and scheduled jobs                   |
| SMS/email/push         | Malawi delivery availability, sender/merchant approvals, per-message fees, reliability and retry policy              |
| Payment provider       | Commercial contract, KYC/AML obligations, MWK/mobile-money methods, fees, chargebacks, refunds and settlement timing |
| Maps/routes/places     | Billing account, restricted keys, per-service quotas, routing coverage, data licence/attribution, caching rules      |
| File storage           | Object operations/egress, private access, scanning, compression, retention and encrypted backups                     |

Store CI secrets only in GitHub environment/repository secrets. Keep runtime secrets in provider secret managers. Never put a service-account private key, payment token, identity document or user record in the repository. No production credentials are currently requested or configured.

## Incident / rollback

1. Stop accepting new tasks and payment requests at the API/gateway. For this preview, stop the development process.
2. Do not delete task/financial events. Preserve a minimal access-controlled snapshot and relevant logs outside Git.
3. Revoke affected sessions/keys, isolate the compromised adapter and escalate to the named security/operations owner. Never ask customers for PINs.
4. Investigate with least-privilege access, reconcile all affected task/payment records and append corrections rather than rewriting money history.
5. Restore a tested backup or redeploy the previous reviewed release; validate schema compatibility before rollback. Reconcile before re-enabling payments.
6. Notify users/authorities as required, document the private incident and add regression tests. No live emergency response or support desk is supplied by this development build.
