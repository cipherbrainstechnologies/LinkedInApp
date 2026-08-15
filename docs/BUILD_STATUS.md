# ApplyFlow Build Status

Last updated: 2026-08-15 (Billing hardening + demo gates)

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | Done | Monorepo, scripts, CI skeleton |
| M1 Identity/Onboarding | Partial | OIDC, onboarding resumability, fresher path |
| M2 Resumes/AI | Partial | Pipeline + admin AI routes skeleton |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Golden path submit, tracker, worker scenarios |
| M5 Billing/Quota | Partial | Proration preview, webhook idempotency, delta grant |
| M6 Admin | Partial | RBAC, quota adjust, audit, AI admin |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Partial | verify + smoke + integration; Playwright BILL-02 |

## Recent deliverables

### M1 onboarding (ONB-01..04)

- Extended `validateOnboardingCompletion` — fresher education/projects/skills, work auth, multiple titles
- `GET /onboarding` returns saved step + server-backed fields (ONB-04)
- Profile `POST /profile/work-authorisations`
- Web onboarding wizard restores progress from API
- Tests: `packages/domain/src/onboarding/completion.test.ts`, `onboarding.resumability.integration.test.ts`

### M2 admin AI (AI-05/06)

- `GET/POST /admin/ai/providers` — write-only secret storage (fingerprint only)
- `GET/POST /admin/ai/routes`, `POST /admin/ai/routes/:id/publish` — eval threshold gate
- Admin web AI panel; seed `ai@demo.applyflow.local`; ops role has `ai.manage`
- Tests: `packages/domain/src/ai/route-publish.test.ts`, `admin-ai.integration.test.ts`

### M8 E2E (DEMO-02)

- `apps/web/playwright.config.ts` + `e2e/demo-golden.spec.ts` — login, onboarding, discover, applications, plan, upgrade

### M5 billing (BILL-02..07)

- `packages/domain/src/billing/upgrade.ts` — proration quote + quota delta (preserve usage)
- `BillingService` — preview/confirm/idempotent webhook; separate unauthenticated mock webhook route
- Plan page — human-readable preview, processing until webhook, demo simulate success/failure
- Seed resets launch persona (20/50) after demo upgrades
- Tests: `billing.upgrade.integration.test.ts`, `upgrade.test.ts`, E2E BILL-02

### M8 demo gates (DEMO-01)

- `scripts/verify.mjs` includes `pnpm test:integration`
- `scripts/smoke.mjs` runs domain + config + integration when API healthy
- `docs/DEMO_RESULTS.md` with command outcomes

## P0 Acceptance Criteria (selected)

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
| BILL-02 | Partial | Delta grant on upgrade; usage preserved | `billing.upgrade.integration.test.ts`, E2E |
| BILL-03 | Partial | Server proration preview fields | integration preview test |
| BILL-04 | Partial | Processing UI until webhook | plan page + integration mid-state |
| BILL-05 | Partial | Failed webhook preserves plan | `billing.upgrade.integration.test.ts` |
| BILL-06 | Partial | Webhook idempotency | `billing.upgrade.integration.test.ts` |
| BILL-07 | Partial | Confirm idempotency key | `billing.upgrade.integration.test.ts` |
| DEMO-01 | Partial | verify/smoke/integration gates | `scripts/verify.mjs`, `DEMO_RESULTS.md` |
| APP-01 | Partial | Draft snapshots job/profile/resume/policy | applications API |
| APP-02 | Partial | Prepare + confirm gate | `submission.test.ts`, integration |
| APP-05 | Partial | Idempotent submit | `applications.submit.integration.test.ts` |
| APP-08 | Partial | OTP/CAPTCHA → WAITING_FOR_USER | worker scenarios |
| APP-10 | Partial | Uncertain → verified submit | worker scenario |
| APP-11 | Partial | Final failure releases quota | worker scenario |
| APP-12 | Partial | Duplicate prevention | integration test |
| TRK-01 | Partial | Search/filter URL state | web applications |
| TRK-02 | Partial | Detail timeline/snapshot/evidence | web application detail |
| ONB-01 | Partial | Onboarding + profile + resume | domain + integration |
| ONB-02 | Partial | Fresher path without experience | `completion.test.ts` |
| ONB-03 | Partial | Unconfirmed extraction blockers | onboarding complete |
| ONB-04 | Partial | Resumable onboarding GET | `onboarding.resumability.integration.test.ts` |
| AI-05 | Partial | Publish eval threshold | `route-publish.test.ts`, `admin-ai.integration.test.ts` |
| AI-06 | Partial | Secret fingerprint only | `admin-ai.integration.test.ts` |
| DEMO-02 | Partial | Playwright golden paths | `apps/web/e2e/demo-golden.spec.ts` |
| AUTH-04 | Partial | Refresh rotation | `auth.refresh.integration.test.ts` |
| RES-03 | Partial | Advisory lock activate | `resume.activate.integration.test.ts` |
