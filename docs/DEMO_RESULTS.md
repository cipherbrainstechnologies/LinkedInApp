# ApplyFlow Demo Results

Last run: 2026-08-15 (UI/UX rebuild + admin platform)

## Environment

- Node: v22.22.2, pnpm 9.15.4
- PostgreSQL: local apt install on `localhost:5432` (Compose target port `55432` when using Docker)
- Docker Compose: not available in cloud agent VM; infra optional for MinIO/Mailpit
- Demo adapters: mock OIDC, mock billing webhook, mock AI, mock ATS connector

## Commands and outcomes

| Command | Exit | Summary |
|---------|------|---------|
| `pnpm bootstrap` | 0 | Builds design-tokens, ui-web, db, domain, observability, etc. |
| `pnpm db:migrate` | 0 | Admin sessions migration applied |
| `pnpm db:seed` | 0 | Idempotent seed |
| `pnpm --filter @applyflow/api test:integration` | 0 | **16 tests** (7 files), includes admin auth |
| `pnpm --filter @applyflow/web test:e2e` | 0 | **13 Playwright tests** (8 candidate + 5 admin) |
| `pnpm --filter @applyflow/web build` | 0 | Next.js production build |
| `pnpm --filter @applyflow/admin build` | 0 | Admin Next.js build |
| `pnpm verify` (full) | 1 | Lint fails pre-existing ESLint v9 config gap in packages |

## E2E coverage

### Candidate (`demo-golden.spec.ts`)

- Experienced persona home dashboard
- Fresher onboarding entry
- Discover jobs list
- Applications and plan pages
- Job prepare → application detail with screening section
- Help & demo checklist restart
- BILL-02 upgrade Launch → Power with usage preserved

### Admin (`admin-demo.spec.ts`)

- Unauthenticated redirect to login
- Demo Admin login → operations dashboard
- User search and profile detail (quota ledger)
- Logout clears session (`/admin/auth/me` → 401)
- Authenticated `/admin/auth/me` returns support permissions

## Demo personas exercised

| Persona | Purpose |
|---------|---------|
| `experienced-launch` | Launch 50 plan, dashboard, discover, applications, upgrade |
| `fresher-free` | Onboarding entry |
| `support@demo.applyflow.local` | Admin demo login (Support role) |

## Known limitations

- `pnpm verify` lint step fails until ESLint flat configs are added workspace-wide
- `packages/db` and `packages/schemas` vitest scripts exit 1 with no test files
- Docker not available in cloud agent — use local PostgreSQL or Compose on developer machines
- Admin session cookie uses `domain=localhost` only when `APP_ENV=local`
- Visual screenshots not captured in this run

## Production gates still open

- Real payment provider certification
- LinkedIn OIDC production approval
- Production admin OIDC/MFA (demo session disabled in production)
- Full encrypted AI key storage (KMS envelope)
- WCAG 2.2 AA formal audit
