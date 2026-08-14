# ApplyFlow Build Status

Last updated: 2026-08-14

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | In progress | Monorepo scaffolded |
| M1 Identity/Onboarding | In progress | Demo auth, onboarding API |
| M2 Resumes/AI | Partial | Upload intents, mock extraction |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Submit flow, worker outbox |
| M5 Billing/Quota | Partial | Ledger, mock upgrade |
| M6 Admin | Partial | RBAC, quota adjust, audit |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Pending | E2E partial |

## P0 Acceptance Criteria

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
| AUTH-01 | Partial | `apps/api/src/modules/auth` | Pending |
| AUTH-02 | Pending | OIDC validation | Pending |
| AUTH-03 | Pending | Email verification flow | Pending |
| AUTH-04 | Pending | Refresh token rotation | Pending |
| ONB-01..06 | Partial | `apps/api/src/modules/onboarding` | Pending |
| RES-01..04 | Partial | `apps/api/src/modules/resumes` | Pending |
| JOB-01..06 | Partial | `apps/api/src/modules/jobs` | Pending |
| APP-01..12 | Partial | `apps/api/src/modules/applications` | Pending |
| TRK-01..02 | Partial | Applications list/detail | Pending |
| BILL-01..08 | Partial | `apps/api/src/modules/billing` | Pending |
| AI-01..04 | Partial | Mock AI provider seed | Pending |
| ADM-01..06 | Partial | `apps/api/src/modules/admin` | Pending |
| SEC-01..04 | Partial | Auth guard, demo-only | Pending |
| A11Y-01..02 | Partial | Web CSS focus/320px | Pending |
| REL-01 | Partial | Outbox worker | Pending |
| OBS-01 | Partial | Structured logging | Pending |
| DEMO-01..02 | Partial | Scripts, smoke | Pending |
