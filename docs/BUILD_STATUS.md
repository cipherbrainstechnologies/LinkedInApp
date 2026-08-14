# ApplyFlow Build Status

Last updated: 2026-08-14 (M2 resume + AI pipeline)

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | Done | Monorepo, scripts, CI skeleton |
| M1 Identity/Onboarding | Partial | Demo auth; OIDC/refresh pending |
| M2 Resumes/AI | In progress | Scan pipeline, mock AI gateway, review UI |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Submit flow, worker outbox |
| M5 Billing/Quota | Partial | Ledger, mock upgrade |
| M6 Admin | Partial | RBAC, quota adjust, audit |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Pending | E2E partial |

## M2 deliverables (this iteration)

- `packages/storage` — MIME magic-byte check, mock virus scan, local quarantine store, text extract
- `packages/ai` — Gateway + deterministic mock `RESUME_EXTRACT`, hostile prompt handling
- Worker `document.process` — scan → promote → extract → AI → resume version update
- API — upload binary, status polling, extraction review endpoints
- Web `/resumes` — upload demo PDF, poll status, review extraction, activate
- `packages/test-kit` — RES-01/02, AI-03/04 unit acceptance tests

## P0 Acceptance Criteria

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
| AUTH-01 | Partial | `apps/api/src/modules/auth` | Pending |
| RES-01 | Partial | Quarantine + worker scan | `packages/test-kit` |
| RES-02 | Partial | Scan rejection | `packages/test-kit` |
| RES-03 | Partial | Transactional activate | Pending integration |
| RES-04 | Partial | Immutable resume versions | Schema |
| AI-01 | Partial | Mock adapter | `packages/ai` tests |
| AI-03 | Partial | Hostile prompt bounded | `packages/ai` + test-kit |
| AI-04 | Partial | Failed extraction path | `packages/ai` tests |
