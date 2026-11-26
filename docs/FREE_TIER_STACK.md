# Free-tier-first upgrade: decisions and activation

**Reviewed 25 November 2026.** Discovery source: [free-for.dev](https://free-for.dev/#/), maintained in [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev). It is a useful directory, not a provider contract or a guarantee of free production hosting. Quotas, commercial terms, billing, regional availability and inactivity policies can change. No service account, chargeable subscription or public deployment has been created by this change.

## Selected now versus candidates

| Capability                          | Decision / verified limits                                                                                                                                                                             | Implementation status                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source, reviews, quality automation | GitHub remains the canonical source. Existing repository Actions runs the checks.                                                                                                                      | Implemented, no added SaaS dependency.                                                                                                                                                                                       |
| Authentication                      | **Supabase Auth** optional adapter. Official pricing currently lists 50,000 MAU, two active free projects, pausing after one inactive week.                                                            | Email/password signup, email confirmation, login, reset/recovery and local sign-out UI; server verifies each bearer token using `auth.getUser(token)`. Enable only after project setup below. Not activated in this preview. |
| Transactional data                  | Keep SQLite for controlled local integration tests; evaluate Supabase Postgres with PostGIS for hosted operation. Pricing currently lists 500 MB database, 5 GB egress and 5 GB cached egress on Free. | **Not migrated.** No claim that the SQLite file is hosted by Supabase or survives an ephemeral deployment. Hosted schema, policies, transaction functions, backups and concurrency testing are required.                     |
| Static hosting/CDN                  | **Cloudflare Pages** candidate: official Free limits currently include 500 builds/month, one concurrent build, 20,000 files and 25 MiB per asset.                                                      | Static headers provided. **No deployment is wired up.** Pages alone cannot run this Express + local SQLite API. First move backend logic/data to an appropriate runtime and configure same-origin `/api` routing.            |
| Private user files                  | Supabase Storage candidate; official Free pricing currently lists 1 GB file storage.                                                                                                                   | Uploads disabled. Private buckets, scoped signed URLs, validation, scanning, retention and appropriate billing review are prerequisites.                                                                                     |
| Offline/mobile                      | First-party service worker, PNG app icons, manifest, locally bundled Manrope font and update/install UI.                                                                                               | Implemented without a third-party offline SDK; no API, token, task or message caching, no write replay.                                                                                                                      |
| Monitoring                          | First-party `/api/health` for a chosen external monitor. Do not send customer data to observability vendors by default.                                                                                | Implemented health probe; no third-party monitoring account or analytics is provisioned.                                                                                                                                     |
| Payments                            | No suitable commercially approved Malawi partner has been verified.                                                                                                                                    | Deliberately unavailable. No free-tier directory entry is evidence of a supported marketplace/escrow/mobile-money integration.                                                                                               |

### Official sources checked

- [Supabase pricing](https://supabase.com/pricing): Free/Pro limits, inactivity and pricing. Free's community support is not an uptime SLA. Current Pro starts at USD 25/month; evaluate backup/production needs rather than assuming Free is sufficient.
- [Supabase `getUser`](https://supabase.com/docs/reference/javascript/auth-getuser): server validation contract. This app makes a provider request; decoding a JWT or trusting editable user metadata is not sufficient authorization.
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/): builds, asset limits and Functions charged against Workers quotas. Static headers do not deploy an API.

No numeric claim about Malawi SMS delivery, merchant approval or map routing coverage is made. Those require separate local validation.

## Enable hosted sign-in (operator action)

1. Create/select a Supabase project in **your own** provider dashboard. Review region, data residency, terms and spend limits. Do not paste passwords, private tokens or service-role keys into chat or Git.
2. Enable Email authentication and **email confirmation**. Configure the intended Site URL plus exact redirect allowlist entries for `/` and `/?flow=recovery`. Add the actual preview hostname when testing. Do not open wildcard production redirects.
3. Configure a suitable transactional email sender/SMTP and evaluate its delivery, rate limits, domain verification and billing. Do not assume Supabase's default development email sender is suitable for public signups. Enforce at least a 12-character password policy and enable appropriate provider abuse protection.
4. Set server environment values `AUTH_MODE=supabase`, `SUPABASE_URL` (HTTPS project URL, no trailing slash), and `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`). These are project connection settings; the publishable key is designed to be public. Secret/service-role keys are **rejected** by configuration validation and must never be sent to the browser.
5. Start with a clean local database. Account mode defaults to `data/accounts.sqlite` and seeds no samples. Startup rejects a database containing demo fixtures. Demo and account environments must have separate data paths and origins for real operation.
6. Start the API and frontend for **controlled testing**. `/api/config` exposes only auth mode, project URL and publishable key. Account mode disables `/api/demo/session`, requires provider-confirmed email, exposes no sample providers and assigns the server-owned customer role. User-editable metadata can supply only a display name, never provider/admin access.
7. Confirm email, sign in, create a synthetic task and verify a second independent account cannot see it. Exercise password reset, expired/revoked tokens, sign-out, email delivery failure and provider outage on an actual configured project before approval.

The SDK stores its browser auth session in **sessionStorage**, not localStorage; it survives reloads in the same tab but is not promised to survive tab closure. An XSS can still access browser tokens: CSP, dependency hygiene and input safety remain important. Server validation occurs on every protected request; this is not a fabricated local sign-in. Provider enrollment/privileged roles are not open in account mode.

**Validation honesty:** automated tests use injected server verifiers and intercepted synthetic browser Auth responses. The real Supabase SDK's server `getUser` call is also tested against an intercepted HTTP boundary. No live Supabase project/email delivery was exercised here. The current coding sandbox restricts outbound hosts; a configured project must be tested in a runtime permitted to reach its `.supabase.co` endpoints.

## Run the built experience with one origin

```sh
npm ci
npm run build
PORT=5173 npm run serve:pilot
```

This serves the built app, service worker and API together, avoiding browser localhost cross-service URLs. It is a **pre-launch/testing** runtime; `NODE_ENV=production` remains blocked. Use a persistent volume for the database and TLS at a trusted gateway if testing remotely. There is no claim of free hosting for that API/disk. `npm run dev` still provides development hot reload, but intentionally does not install a service worker.

The service worker caches only this release's static app files. Browser navigation works offline after a successful first online load, but the private workspace requires a connection. Failed writes are never automatically retried. Updates require a user action; the UI asks users to save their form before reloading. Drafts are scoped by account ID on the device, expire after seven days when read, are not encrypted, and can be cleared in Profile; sign-out removes the current account's draft.

## Public release gate

Hosted auth plus an attractive PWA does **not** make the marketplace production ready. Finish hosted transactional data and migrations, verification/onboarding, geographic matching, supported payments/ledgers, file evidence, restricted support/admin operations, export/deletion, monitoring/backup drills, a security review and Malawi-specific legal/operational approval. Keep the unavailable payment adapter until a real provider has been commercially and technically verified. Do not publish a static build to Pages and describe it as the working full marketplace.
