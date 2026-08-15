# ApplyFlow Build Status

Last updated: 2026-08-15 (Railway hosting readiness)

## Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Foundation | Done | Monorepo, bootstrap, Turbo dev deps, Compose 55432 |
| M1 Identity/Onboarding | Partial | OIDC, onboarding resumability, fresher path |
| M2 Resumes/AI | Partial | Pipeline + admin AI routes |
| M3 Jobs/Matching | Partial | Search, import, SSRF block |
| M4 Applications/Connectors | Partial | Golden path submit, tracker, worker scenarios |
| M5 Billing/Quota | Partial | Proration preview, webhook idempotency, delta grant |
| M6 Admin | Partial | Server session login, RBAC guards, dashboard, users, AI, audit |
| M7 Mobile | Shell only | Expo placeholder |
| M8 Hardening | Partial | verify + smoke + integration + Playwright (13 E2E) |
| M9 UI/UX | Partial | Design tokens, ui-web, candidate flows, mobile nav |
| M10 Railway | Done | Per-service railway.json, PORT, migrations, docs/RAILWAY.md |

## Recent deliverables (UI/UX slice)

### Design system (`packages/ui-web`, `packages/design-tokens`)

- Semantic indigo/violet/cyan token palette
- Shared primitives: Card, KpiCard, PageHeader, Badge, EmptyState, PipelineHero
- Candidate + admin shells import `@applyflow/ui-web/styles.css`

### Admin platform (`apps/admin`, `apps/api`)

- `AdminSession` model + cookie `applyflow_admin_session` (localhost domain in local env)
- `POST /admin/auth/demo/login`, `POST /logout`, `GET /me`
- `AdminAuthGuard` + `AdminRbacService` permission checks on admin routes
- Admin routes: dashboard, users (+ detail), applications, plans, AI providers, reports, audit, demo center
- Login page with server-backed Demo Admin action (not header spoofing)

### Candidate experience (`apps/web`)

- Redesigned Nav with demo badge and Help & demo link
- Home dashboard: pipeline hero, KPI cards, application status summary
- Help page: dismissible presentation checklist with local restart

### Developer experience

- `pnpm bootstrap` builds internal packages including ui-web
- `turbo.json` `dev.dependsOn: ["^build"]`
- Root `pnpm dev` without deprecated `--parallel`
- `migrate-deploy.mjs` loads root `.env`
- Compose PostgreSQL `127.0.0.1:55432:5432`
- Worker declares `dotenv` dependency

### Documentation

- `docs/implementation/UI_UX_REBUILD_PLAN.md` — route inventory and migration sequence
- `docs/DEMO_PRESENTATION_GUIDE.md` — startup, personas, candidate/admin scripts
- Root `README.md` rewritten for verified startup flow

### Tests

- `admin.auth.integration.test.ts` (3 tests)
- `apps/web/e2e/admin-demo.spec.ts` (5 admin auth E2E tests)
- Playwright golden paths updated (help tour, Welcome back heading)
- API integration: **16 tests** passing

## P0 Acceptance Criteria (selected)

| ID | Status | Implementation | Tests |
|----|--------|----------------|-------|
| AF-FND-001 | Partial | bootstrap + migrate + dev without manual package builds | bootstrap script, README |
| AF-ADM-001 | Done | Admin login page + demo session API | admin-demo E2E |
| AF-ADM-002 | Partial | Demo login gated on APP_ENV + DEMO_AUTH_ENABLED | controller guard |
| AF-ADM-003 | Done | Admin shell nav, identity, logout | admin-demo E2E |
| AF-OPS-001 | Partial | Dashboard KPIs from `/admin/overview` | seed + admin UI |
| AF-OPS-004 | Partial | Masked AI keys, test connection mock | admin-ai integration |
| AF-CAN-001 | Partial | Home dashboard KPIs and next action | demo-golden E2E |
| AF-DEMO-001 | Partial | Help checklist + restart | demo-golden E2E |
| AF-DEMO-002 | Partial | Admin demo center + presentation guide | DEMO_PRESENTATION_GUIDE |
| BILL-02..07 | Partial | Billing upgrade slice | billing integration + E2E |

## Open items

- Full `pnpm verify` lint gate (ESLint flat config missing in several packages — pre-existing)
- Admin charts library for reports (tables/KPIs only today)
- Production OIDC admin login (demo session only in local)
- Full KMS envelope for AI provider secrets (fingerprint + secretRef stub)
- WCAG automated audit beyond placeholder `test:a11y`
- Visual regression screenshots in `docs/screenshots/`
