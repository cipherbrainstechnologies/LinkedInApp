# ApplyFlow Demo Results

Last run: 2026-08-15 (Billing + demo hardening)

## Environment

- Node: v22.x, pnpm 9.15.4
- PostgreSQL and Redis: local (apt-installed)
- Docker Compose infra: not used in this run (MinIO/Mailpit optional)
- Demo adapters: mock OIDC, mock billing webhook, mock AI, mock ATS connector

## Commands and outcomes

| Command | Exit | Summary |
|---------|------|---------|
| `pnpm --filter @applyflow/domain test` | 0 | 13 tests passed (includes billing upgrade math) |
| `pnpm --filter @applyflow/api test:integration` | 0 | 13 tests passed (6 files; billing BILL-02/05/06/07) |
| `pnpm db:seed` | 0 | Idempotent seed; launch persona reset to 20/50 |
| `pnpm test:e2e` (API :4000, web :3000) | 0 | 7 Playwright tests passed (DEMO-02 + BILL-02 upgrade) |
| `pnpm --filter @applyflow/web typecheck` | 0 | Clean |
| `pnpm lint` | not run this slice | — |
| `pnpm build` | not run this slice | — |

## Demo personas exercised

| Persona | Purpose |
|---------|---------|
| `experienced-launch` | Launch 50 plan, 20 consumed; upgrade preview/confirm/webhook to Power 100 |
| `fresher-free` | Onboarding entry |
| `experienced-launch` | Discover, applications, job prepare flow |

## Billing slice evidence (BILL-02..07)

- **BILL-02**: 20 used on 50 → Power upgrade → 80 available (ledger +50 delta, usage preserved)
- **BILL-03**: Server preview returns credit, period charge, tax, due now, renewal, quota projection
- **BILL-04**: UI processing state until webhook; quota unchanged while `PENDING`
- **BILL-05**: `payment.failed` webhook leaves plan/quota unchanged
- **BILL-06**: Duplicate webhook `providerEventId` is idempotent
- **BILL-07**: Confirm upgrade idempotency key returns same `paymentId`

## Known limitations

- Razorpay/Stripe live webhooks and raw-body signature verification: stubbed via `POST /billing/webhooks/mock` only
- `pnpm verify` full gate (lint/build) not re-run in this slice; integration + E2E added to `scripts/verify.mjs`
- Mobile Expo, visual regression, and a11y suites not executed in this run
- iOS simulator: not available in cloud agent environment

## Production gates still open

- Real payment provider certification (proration, refunds, mandate flows)
- LinkedIn OIDC production approval
- Licensed job connectors beyond mock fixtures
- WCAG audit on billing UI (manual keyboard pass recommended)
