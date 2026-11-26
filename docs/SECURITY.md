# Threat model & privacy

## v0.2 security additions

Optional hosted account authentication is implemented, **not configured by default**. See [FREE_TIER_STACK.md](FREE_TIER_STACK.md). `AUTH_MODE=supabase` requires provider-verified bearer tokens and email confirmation, disables demo sessions, rejects seeded demo data and keeps all accounts as customers until a reviewed provider-onboarding system is implemented. No editable user metadata can grant roles. Test stubs are injected only into test-created apps; no network endpoint can enable them.

The browser stores hosted auth sessions in sessionStorage, which is still sensitive to XSS; never cache/log tokens or send them to third-party analytics. The SDK's session survives same-tab reload but is not guaranteed across tab closure. Passwords are handled by the provider SDK, not stored in the task DB. Provider revocation/expiry semantics and actual recovery/email delivery still require live integration verification.

The build service worker caches **only static files**, never `/api`, cross-origin responses or writes. Offline loading shows a reconnection screen rather than a cached customer's task list. Drafts are user-scoped, validated, expire after seven days when restored, and current-account drafts are removed on sign-out. Device storage is not encrypted; use no sensitive content. A corrupt draft cannot restore task consent or grant backend privileges.

Built-app serving adds CSP (self-hosted scripts/fonts, no objects, Supabase-only external connections), MIME/referrer/permissions headers, no-store APIs and no-cache service-worker/HTML responses. Set an appropriate frame-ancestor policy at the deployment gateway after determining allowed embed origins; previews must remain embeddable. Accessibility regression checks cover dashboard/request-dialog contrast and semantics, not the entire app or all assistive technologies.

## Safety boundary

The default mode is a **local/test sample workspace**. In demo mode, anyone able to reach `/api/demo/session` can choose one of the two shared test identities. Ownership checks protect data between those sample roles, **not between real people**. Demo mode has no real phone OTP, verified email, account recovery or administrative role. Hosted mode can verify email and recover passwords when configured; neither mode is a production trust decision. Do not expose this service to real customers or store real personal information. `server/index.ts` rejects `NODE_ENV=production` or `DEMO_MODE=false`.

## Assets and adversaries

Protect task addresses, private conversations/evidence, identity material, account sessions and ultimately customer/provider funds. Threats include malicious customers/providers, external attackers, shared-device access, compromised clients, privileged insiders, dependency compromise and unreliable networks/payment callbacks.

| Threat                                      | Present mitigation                                                                                              | Remaining launch work                                                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Client forges owner/price/status            | Explicit input allowlist; server-calculated prices; server-role/state checks                                    | Real verified identity and policy-controlled role grants                                                                                    |
| Double task publish / conflicting selection | Idempotency key + fingerprint; transactionally enforced task selection                                          | Multi-instance DB concurrency, distributed idempotency/lock tests, retry recovery UX                                                        |
| Unauthorized addresses/chat                 | Provider opportunity views redact precise manual meeting points; messages/events require task participation     | Minimize public description, private fields and abuse review; production RBAC/RLS                                                           |
| Payment forgery/replay                      | No successful payment implementation or public confirmation route; paid execution blocked                       | Signed raw-body webhooks, merchant approval, amount/currency validation, immutable ledger, deduplication and reconciliation                 |
| CSRF                                        | Strict same-site HttpOnly cookies; required custom mutation header; no CORS; cross-site Fetch Metadata rejected | Production origin validation, trusted proxy allowlist, session rotation / expiry, secure authentication                                     |
| Session theft                               | Cryptographically random server-held session tokens, eight-hour expiry, secure cookies over HTTPS               | Durable shared session store, account recovery, device/session controls; no real identity guarantee now                                     |
| SQL injection / stored XSS                  | Parameterized SQLite; React text rendering, no HTML injection                                                   | Production CSP / headers at gateway and dependency monitoring                                                                               |
| Abuse / huge payload                        | 32 KB JSON cap; text/integer limits; basic 300 requests/minute per socket-IP limit                              | Distributed per-account/device limits, attachment validation, malicious-content moderation                                                  |
| Event tampering                             | No API edits/deletes; append-only SQL triggers and atomic event mutations                                       | Separate restricted audit writer and off-host tamper-evident audit storage; DB owner can change local DB                                    |
| Prohibited tasks                            | Explicit safe-task consent and warnings                                                                         | Trained moderators, configurable restricted categories, operational incident response, legal review; **text moderation is not implemented** |
| Network drop                                | Local draft; idempotent publication; clear offline feedback, explicit refresh                                   | Durable authenticated retry queues for eligible operations, load/chaos tests; no offline payment execution                                  |
| Upload abuse                                | Uploads not enabled, no sensitive file collection                                                               | Private storage, MIME/magic-byte checks, size limits, malware scans, signed URLs, EXIF removal, encryption and retention                    |

Express rate limiting is intentionally basic: it keys the actual socket address, not untrusted forwarded IPs. Behind the Vite proxy users share a bucket. It is not production DDoS protection. Session state, rate limits and provider fixtures are process-local. TLS is supplied by the preview proxy, not this Node listener; do not expose the raw listener over an untrusted network.

## Privacy and retention

- **No GPS permission, coordinates, continuous tracking, contacts, ID documents, payment PINs or external analytics.** No map listings or landmarks are invented. Manual locations are user input, not verified POIs.
- The selected service-area display label and unpublished draft are in localStorage. Shared-device users can access them; storage is not encrypted. Clear a draft under Profile. Do not enter sensitive information. A browser storage failure is surfaced instead of falsely claiming a draft was saved. Drafts are user-scoped and expire on restoration after seven days; expiry is not a background secure-erasure job.
- Task descriptions are shown to eligible providers before assignment. Private pickup/destination fields are shared only after selection. A user can still disclose information in free text; UI warnings are not DLP.
- Sample provider availability is illustrative; there are no verified performance ratings or paid trust badges.
- Local database files contain all development requests/messages. `.gitignore` excludes `data/`, secrets and environment files. Nothing should ever push runtime data into GitHub commits, issues, artifacts or logs.
- No export/deletion or automated retention jobs yet. Disclose this in the preview; these are prerequisites for collecting real data. Define lawful processing, retention, informed consent and data-subject workflows with Malawi-qualified advice before launch. Do not infer regulatory compliance from these controls.

## Reporting & release gate

Before a public pilot, appoint an accountable security/safety owner and a restricted private reporting channel (GitHub private vulnerability reporting can be enabled by the repo owner). Do not post identity documents or incidents with personal data in public issues. Triage critical findings, preserve minimal evidence securely, contain the service and notify affected parties/authorities as legally required. See operations for a stop-service runbook. No external penetration test or legal compliance review has been performed.
