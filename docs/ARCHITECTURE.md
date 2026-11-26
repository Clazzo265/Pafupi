# Architecture, data model & API contracts

## Boundaries

```text
Browser → Vite (5173) → same-origin /api proxy → Express (3001)
                                                   ↓
                                         SQLite (gitignored data/)
```

Development only. React never writes the database. `shared/types.ts` defines response types; `server/domain.ts` is the authoritative input validator, pricing policy and lifecycle guard. Express owns identity, task ownership, role permission, eligible-offer checks and mutations. SQLite transactions serialize offer selection and task transitions. `BEGIN IMMEDIATE` + rollback prevents partial event/state updates. Publishing is idempotent by user + request key + validated-input fingerprint. All user text is rendered as React text, not HTML.

`server/db.ts` is the local storage boundary; SQL is currently called directly by the small API. Extract a repository interface when adding the production database adapter. `server/adapters/payments.ts` defines an explicit provider contract and an **unavailable** adapter, never a fake-success implementation. No webhook route is registered. A real adapter must be introduced with a transaction ledger and replay-safe server handlers, not merely swapped in to bypass the unavailable response.

### Production selection decision (not provisioned)

Recommended evaluation: managed **PostgreSQL + PostGIS** and managed authentication (e.g. Supabase or equivalents), an always-on or serverless TypeScript backend, private object storage with signed URLs, a verified Malawi-capable licensed payment provider and a quota-limited routing adapter. PostgreSQL transactions, constraints and geographic indexes fit task assignment and financial ledgers. Firebase is a viable alternative to evaluate but has not been configured or assessed for pilot cost/region suitability. No provider's free tier or Malawi payment API access is assumed.

Keep adapters replaceable. Document region/data residency, processing agreements, pricing, inactivity limits, egress, backup/restore and merchant approval before procurement. Use public verified map data only; manual landmarks are the current honest fallback. No coordinates or points of interest have been invented.

## Current database

| Table      | Key / contents                                         | Ownership and rules                                                                                                                                                          |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tasks`    | `id`, validated JSON task snapshot                     | Owner, selected provider. Public opportunity view redacts owner ID and manual pickup/destination. Description is public task scope; UI warns not to include private details. |
| `offers`   | id, taskId FK, providerId, note, createdAt             | One per task/provider (unique constraint). Customer sees all their task offers; providers see only their own. 24-hour expiry; expired offers may be renewed.                 |
| `events`   | id, taskId FK, actorId, type, detail, createdAt        | Participants only. Indexed by task. SQL triggers prohibit update/delete. DB owner can bypass triggers: this is not tamper-proof financial storage.                           |
| `messages` | id, taskId FK, senderId, body, createdAt               | Owner/assigned provider only. No pre-assignment conversation. Plain text, max 2,000 characters.                                                                              |
| `requests` | user-scoped key, ownerId, input fingerprint, taskId FK | Idempotent publication record. Same key + changed payload → 409.                                                                                                             |

Session identities and three clearly labelled sample provider profiles are development fixtures, **not user/verification tables**. `sample: true` is reserved for the initial fixture task. Every newly published task is still development data even when `sample` is false. Never infer real verification from initials, availability or a sample name.

SQLite uses foreign keys, WAL, parameterized statements and task indexes for events, offers and messages. Task JSON is suitable for this small foundation only; production requires typed columns, ownership constraints, owner/provider/status/category indexes and PostGIS service areas. Current discovery scans local tasks and is not scalable. API has no deletion endpoint. Retain development data only as long as needed; see operations for reset and backup. Add encrypted retention/deletion jobs and pagination before collecting real data.

### Planned production entities

Separate users, contact verifications, private identity checks, provider profiles/availability/areas, categories, tasks/locations, offers/assignments/events, conversations/messages, transaction ledger/payment events, refunds, settlements, reviews, disputes, complaints, notifications, support cases, pricing versions/settings and privileged audit logs. Use foreign keys and immutable financial entries; corrections append compensating events. Do not store payment PINs. Private identity files belong in encrypted object storage, never Git.

## Pricing v1

- Illustrative labour **MK 5,000/hour**, integer MWK, nearest-kwacha rounding (`Math.round`). Allowed labour: 15–240 minutes.
- Separate waiting: 0–120 minutes at the same illustrative hourly rate, excluding labour/travel time.
- Flat agreed complete-journey travel allowance: MK 0–20,000. No invented kilometres or route time. Customer/provider must account for return travel explicitly within the allowance.
- Goods budget: MK 0–500,000; platform fee: MK 300; optional server-supported tip MK 0–20,000 (not exposed as a form control yet).
- Compensation = labour + waiting + travel + tip. Total = compensation + goods + platform fee. Processing fees are **not configured**, not secretly included.
- Server revalidates and recomputes on publication, ignoring client `quote`, `status`, `ownerId` or verification fields. No price-change endpoint.
- Provider offers agree to that exact quote. Selection appends the full accepted quote snapshot and offer ID to the event log. Offer expiry is enforced at selection. No settlement ledger or financially completed state exists.

## Lifecycle

Publication creates `PUBLISHED`. First eligible offer moves it to `OFFERS_RECEIVED`. Customer selection atomically appends `PROVIDER_SELECTED`, assigns provider and moves to `PAYMENT_PENDING`. There is **no client-authorized transition to `PAYMENT_CONFIRMED`**.

Future trusted payment handling must validate signed webhooks against server-side amount, currency, merchant, reference and task, deduplicate provider event IDs, record ledger entries and move to payment-confirmed in one transaction. This is a launch blocker, not implemented.

Post-payment guards exist and are unit/integration-tested using isolated fixtures:

```text
PAYMENT_CONFIRMED → ACCEPTED → PROVIDER_EN_ROUTE → ARRIVED
→ IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED
```

The assigned provider performs the first five transitions; a nonempty evidence description (10–2,000 characters) is required for awaiting confirmation. Only the owner confirms completion. This is **task** completion only, never automatic settlement. In-progress steps can enter dispute according to the domain table. Owner can cancel while published, offers-received or payment-pending. Disputes require a reason and append an event; no adjudication or refund is implied. Completed/cancelled/disputed are terminal in this stage. Automated timeout, cancellation-after-payment/refund recovery, failed-payment and support-resolution paths remain future work. Expired offers can be renewed without modifying the task quote.

## HTTP contracts

All JSON. Mutations require `Content-Type: application/json` and `X-Pafupi-Client: web`. Cookie is HttpOnly, SameSite=Strict, Secure when served through HTTPS. Cross-site Fetch Metadata writes are rejected. No CORS allowlist is opened. Errors: `{ "error": "Readable message" }`. Common codes: 400 input, 401 session, 403 permission, 404 missing resource, 409 state/retry conflict, 413 body limit, 429 rate limit, 503 integration unavailable.

| Method | Path                        | Contract                                                                                                                             |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/demo/session`         | `{role: "customer"                                                                                                                   | "provider"}`; deliberately unprivileged sample persona selection. Old session invalidated. Never enable this as real auth. |
| GET    | `/api/bootstrap`            | User, visible tasks/offers, public sample providers, `demo: true`. No private events/messages.                                       |
| POST   | `/api/quote`                | Full `TaskInput` → server `Quote`. Preview may request quote with safetyAccepted=true; actual publication requires explicit consent. |
| POST   | `/api/tasks`                | Validated `TaskInput`, `Idempotency-Key` header (10–100 chars) → 201 `Task`.                                                         |
| POST   | `/api/tasks/:id/offers`     | `{note}` → 201 `Offer`; eligible available sample provider only, unique or expired renewal.                                          |
| POST   | `/api/tasks/:id/select`     | `{offerId}` → updated task; customer ownership and fresh matching offer checked.                                                     |
| POST   | `/api/tasks/:id/payment`    | Owner, selected task only; always 503 unavailable, never confirms a payment.                                                         |
| POST   | `/api/tasks/:id/transition` | `{status, detail?}` → updated task; participant, actor and current-state guards.                                                     |
| GET    | `/api/tasks/:id/activity`   | `{events, messages}`; participants only.                                                                                             |
| POST   | `/api/tasks/:id/messages`   | `{body}` → 201 message; assigned task participants only.                                                                             |

`TaskInput` fields: title (5–100), description (10–2,000), supported category, pickup/destination (3–200), integer duration/travel/goods/waitingMinutes/tip, walking/cycling/driving, Today/Tomorrow/This week, boolean safetyAccepted. Deadline values are planning labels, **not scheduled jobs or exact deadlines**. See `shared/types.ts` and API tests for the executable contract.
