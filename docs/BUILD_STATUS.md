# ApplyFlow Build Status

Last updated: 2026-08-15 (ONB + Admin AI + E2E)

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | Done | Monorepo, scripts, CI skeleton |
| M1 Identity/Onboarding | Partial | OIDC, onboarding resumability, fresher path |
| M2 Resumes/AI | Partial | Pipeline + admin AI routes skeleton |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Submit flow, worker outbox |
| M5 Billing/Quota | Partial | Ledger, mock upgrade |
| M6 Admin | Partial | RBAC, quota adjust, audit, AI admin |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Partial | Playwright golden path E2E |

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

- `apps/web/playwright.config.ts` + `e2e/demo-golden.spec.ts` — login, onboarding, discover, applications, plan

## P0 Acceptance Criteria (selected)

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
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
