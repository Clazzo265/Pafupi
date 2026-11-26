# Build stages, acceptance & pilot validation

The PDF is a **multi-phase product specification**, not a claim that one foundation completes the system. This repository implements a usable development slice of phases 1–3. All remaining work must be tracked as reviewed issues before release.

## v0.2 progress

Premium typography/layout, data-derived task summaries, keyboard navigation, automated dashboard/dialog accessibility checks, account-scoped draft validation/expiry, offline static-shell recovery, safe install/update prompts, security headers and same-origin build serving are implemented. Optional Supabase email/password signup, confirmation, sign-in, password recovery, server token verification and sign-out are coded and tested with synthetic boundaries; **no live project is configured or certified**. Account mode contains no sample providers and does not permit self-assigned privileges. See [free-tier decisions and activation](FREE_TIER_STACK.md).

The acceptance table below remains conservative: optional auth is not a completed production launch, local SQLite is not hosted transactional data, and a PWA does not solve payments, trust, safety operations or market validation.

## Acceptance matrix against the brief

| #   | Criterion                          | Current evidence / gap                                                                                                                                     |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Create a legitimate task           | Validated creation / explicit permitted-task agreement; no automatic restricted-content moderation yet                                                     |
| 2   | Discover eligible nearby providers | Sample availability/category/transport filters only. No verified users or geographic matching                                                              |
| 3   | Appropriate distance/travel data   | Honest manual-location fallback; no numerical distance/time claims; routing absent                                                                         |
| 4   | Reproducible transparent price     | Server calculator, quote breakdown, integer-rounding and manipulation tests; rates are hypotheses                                                          |
| 5   | Offers and selection               | Working for sample personas; expiry, renewal, uniqueness and atomic selection                                                                              |
| 6   | Trusted task states                | Backend state guards, transactional events and actor tests; payment-dependent transitions blocked                                                          |
| 7   | No client-forged payment success   | No confirmation API/client bypass; 503 unconfigured adapter; real payments unimplemented                                                                   |
| 8   | Evidence and confirmation          | Text evidence guards and owner confirmation tested with isolated fixtures; real paid execution/files/codes absent                                          |
| 9   | Auditable dispute handling         | Participant can record dispute and history; no staffed investigation, adjudication or refunds                                                              |
| 10  | Unauthorized access blocked        | Sample-role privacy and ownership tests; demo remains sample auth; optional hosted auth coded/tested with fixtures, live setup and privileged RBAC missing |
| 11  | Admin monitoring                   | Not implemented                                                                                                                                            |
| 12  | Affordable Android / connectivity  | Responsive layout, low-data vector assets, offline notice, draft persistence; real device/field tests and resilient queues needed                          |
| 13  | Automated major workflows          | Backend suite plus desktop/mobile browser suite; real external services/security/load testing remains                                                      |
| 14  | No critical issue before launch    | **Not approved for production**. Shared demo accounts are deliberately unsuitable for real use                                                             |
| 15  | GitHub canonical source/automation | Source, documentation and CI workflow present; repo owners must enable protections, Projects and deployment environments                                   |

## Prioritized engineering backlog

### Phase 1 — foundation hardening

- Choose managed database/auth/runtime via documented regional and cost evaluation; add migrations and repository adapter.
- Verified contact sign-in, Malawi phone normalization, secure recovery, sessions, backend customer/provider/support/admin claims and account controls.
- Private provider verification workflow and service areas. Do not mistake payment or a phone OTP for trustworthy task history.
- Real privacy notices/consent, export/deletion, storage retention and real-device accessibility testing.

### Phase 2 — marketplace

- Verified pilot landmarks; consented coordinates, PostGIS geographic indexes, actual walking/driving routes, clearly labelled straight-line fallbacks, radius options 250 m/500 m/1/2/3/5 km + custom.
- Transparent configurable ranking, category qualifications, provider workload/availability and suitability. Validate proposed 25/20/20/20/10/5 weights empirically; do not rank by sensitive characteristics.
- Negotiated offers, provider minima, admin-versioned prices/limits, customer maxima, quote expiry/refresh, explicit expense approvals and no double-counted travel/waiting.
- Full task scheduling, custom task fields (quantity/photos/duration/distance limits) and timeout recovery. Category selection already supports broader tasks but the complete custom schema is not implemented.

### Phase 3 — trust and execution

- Verified identity review, private evidence/receipts, one-time pickup/handover confirmation, safe check-ins and incident escalation.
- Offline retry queues for suitable operations; authenticated push/SMS/email adapters and reliable notifications.
- Two-sided eligible completed-task reviews, anti-duplication/moderation/appeals, support investigation and dispute resolution tools.

### Phase 4 — financial infrastructure (before any real paid execution)

- Verified Malawi merchant/payment partner, legal/consumer/data-protection review, supported settlement model; no unsupported escrow claims.
- Immutable transaction/payment ledger, signed replay-safe callbacks, reconciliation, eligible refunds, settlements and withdrawal checks.
- Explicit payment costs and terms, cash only under deliberately configured and agreed policy; no automatically verified cash payments.

### Phase 5 — operations

- Restricted support and admin console; verification queues, tasks, complaints, refunds, disputes, fraud alerts, pricing/settings and sensitive-action audit.
- Aggregated operational metrics and unit economics. No invented customer counts, revenue, task history or provider reliability metrics.
- Monitoring, restore drills, penetration tests, load tests, incident ownership and operational launch sign-off.

### Phase 6 — expansion

Expand beyond the initial campus only when real repeat demand, safe fulfilment, provider compensation and sustainable costs justify it. Additional Rumphi locations, institutions and business accounts are later work, not seeded claims.

## Evidence-led validation (not yet conducted)

1. **Interview at least 30 potential customers.** Record errand frequency, time lost, current alternatives, trust needs, accessibility, acceptable total fees and willingness to delegate. Obtain informed consent; keep identifiable research outside Git.
2. **Interview at least 20 potential providers.** Availability, transport, categories, minimum compensation, safety, verification and payment preferences. Validate MK 5,000/hour as a hypothesis, not a local wage fact.
3. **Research actual alternatives.** Couriers, delivery companies, informal runners, social arrangements and marketplaces. Keep dated sources; invent no competitor statistics or market size.
4. **Run a controlled manual pilot.** Named support owner, verified providers, permitted tasks, agreed scope/prices and legally suitable payments. Measure actual requests, successful matches, time to match, duration, provider acceptance, failures, disputes, repeat use and cost per completed task.
5. **Digital launch gate.** Verify auth, privacy, safety, finances, accessibility on affordable Android devices and interrupted networks, backup restoration and support readiness. Pre-register success thresholds with stakeholders instead of retrofitting them to outcomes.

## Definition of done for future PRs

Small reviewed changes; typed contracts; permission/state and failure-mode tests; mobile/keyboard checks; documented secrets/provider costs; no data in Git; green CI; deployment and rollback notes; explicit separation of real integrations from fixtures. No unresolved critical issue at production release.
