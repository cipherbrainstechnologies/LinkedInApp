# UI/UX Rebuild Plan

Last updated: 2026-08-15. Working checkpoint — implementation in progress on branch.

## Route inventory

### Candidate (`apps/web`)

| Route | Status |
|-------|--------|
| `/`, `/login`, `/verify-email` | Public auth |
| `/home` | Dashboard (enhanced) |
| `/discover`, `/jobs/[id]` | Find jobs |
| `/applications`, `/applications/[id]` | Tracker |
| `/resumes`, `/onboarding` | Profile path |
| `/plan` | Billing |
| `/help` | Demo guide (new) |

### Admin (`apps/admin`)

| Route | Status |
|-------|--------|
| `/login` | Server-backed demo login (new) |
| `/` | Dashboard KPIs |
| `/users`, `/users/[id]` | Customer directory |
| `/applications` | Ops list |
| `/commercial/plans` | Plan versions |
| `/intelligence/providers` | AI config |
| `/operations/reports`, `/operations/audit` | Reports & audit |
| `/demo` | Demo center |

## Reusable components

- `@applyflow/ui-web` — Card, KpiCard, PageHeader, Badge, EmptyState, PipelineHero, global styles
- `@applyflow/design-tokens` — semantic CSS variables (indigo/violet system)

## API additions

- `POST /admin/auth/demo/login`, `POST /admin/auth/logout`, `GET /admin/auth/me`
- `GET /admin/overview`, `GET /admin/plans`, `GET /admin/applications`
- Enhanced `GET /admin/customers` (pagination, plan name)
- Enhanced `GET /admin/customers/:id` (quota ledger, applications)
- `POST /admin/ai/providers/:id/test` (mock connection)

## Data model

- `admin_sessions` table for server-backed admin cookies

## Non-goals (this slice)

- Real Stripe/Razorpay/LinkedIn production integrations
- Full chart library / CSV export
- Mobile Expo UI parity
- Framework rewrite

## Migration sequence

1. DX + schema + admin auth
2. Design tokens + ui-web
3. Admin shell + routes
4. Candidate shell + home/help
5. Tests + README + presentation guide
