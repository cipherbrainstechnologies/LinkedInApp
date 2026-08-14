# ApplyFlow Build Status

Last updated: 2026-08-14 (M1 OIDC/email/refresh + M2 resume/AI)

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | Done | Monorepo, scripts, CI skeleton |
| M1 Identity/Onboarding | Partial | OIDC mock, email verify, refresh rotation, sessions API |
| M2 Resumes/AI | Partial | Scan pipeline, mock AI gateway, review UI |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Submit flow, worker outbox |
| M5 Billing/Quota | Partial | Ledger, mock upgrade |
| M6 Admin | Partial | RBAC, quota adjust, audit |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Pending | E2E partial |

## M1 deliverables (this iteration)

- `packages/auth` — PKCE, OIDC start params, JWT access/id token sign/verify (`jose`)
- `apps/mock-providers` — Mock OIDC at `/oidc` with `with-email` / `no-email` personas (AUTH-03)
- API — `GET /auth/oidc/start|callback`, LinkedIn stubs, `POST /auth/email/start|verify`, `POST /auth/token/refresh`, `GET/DELETE /sessions`
- `JwtService`, `OidcStateService` (Redis), `SessionService` mobile credentials + refresh family revoke on reuse
- `AuthGuard` — Bearer JWT or session cookie
- Web — OIDC button on `/login`, `/verify-email` page
- Tests — AUTH-02 in `packages/test-kit`, AUTH-04 integration in `apps/api`

## M2 deliverables (prior iteration)

- `packages/storage` — MIME magic-byte check, mock virus scan, local quarantine store, text extract
- `packages/ai` — Gateway + deterministic mock `RESUME_EXTRACT`, hostile prompt handling
- Worker `document.process` — scan → promote → extract → AI → resume version update
- API — upload binary, status polling, extraction review endpoints
- Web `/resumes` — upload demo PDF, poll status, review extraction, activate
- `packages/test-kit` — RES-01/02, AI-03/04 unit acceptance tests

## P0 Acceptance Criteria

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
| AUTH-01 | Partial | OIDC callback + identity link | Manual + integration pending |
| AUTH-02 | Partial | `verifyIdToken` + security events | `packages/test-kit/src/auth.acceptance.test.ts` |
| AUTH-03 | Partial | no-email persona + `/verify-email` | Manual |
| AUTH-04 | Partial | `SessionService.rotateRefreshToken` | `apps/api/src/modules/auth/auth.refresh.integration.test.ts` |
| AUTH-05 | Partial | `GET/DELETE /sessions` | Pending |
| RES-01 | Partial | Quarantine + worker scan | `packages/test-kit` |
| RES-02 | Partial | Scan rejection | `packages/test-kit` |
| RES-03 | Partial | Transactional activate | Pending integration |
| RES-04 | Partial | Immutable resume versions | Schema |
| AI-01 | Partial | Mock adapter | `packages/ai` tests |
| AI-03 | Partial | Hostile prompt bounded | `packages/ai` + test-kit |
| AI-04 | Partial | Failed extraction path | `packages/ai` tests |
