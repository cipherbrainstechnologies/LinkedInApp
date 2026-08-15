# ApplyFlow

Apply faster without losing control or accuracy.

ApplyFlow is a subscription SaaS for **verified, relevant job applications**—candidate web, admin control plane, API, worker, and local mock providers. The demo runs without paid third-party credentials.

## Key capabilities

| Area | Highlights |
|------|------------|
| Candidate | Dashboard, find jobs, assisted applications, resume pipeline, plan/quota, demo guide |
| Admin | Server-backed login, dashboard KPIs, user directory, plans, AI providers (masked keys), audit |
| Billing | Proration preview, webhook-granted quota, append-only ledger |
| Quality | Domain unit tests, API integration (16), Playwright E2E (13) |

Progress: [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md) · Demo evidence: [`docs/DEMO_RESULTS.md`](docs/DEMO_RESULTS.md) · **Presentation:** [`docs/DEMO_PRESENTATION_GUIDE.md`](docs/DEMO_PRESENTATION_GUIDE.md)

## Monorepo architecture

```
apps/web          Candidate Next.js (:3000)
apps/admin        Admin Next.js (:3001)
apps/api          NestJS API (:4000)
apps/worker       Outbox / connector worker
apps/mock-providers  Local OIDC + fixtures (:4100)
packages/domain   Pure business rules
packages/db       Prisma schema + migrations
packages/ui-web   Shared design system + layout styles
packages/design-tokens  Semantic CSS variables
```

Dependency direction: `apps → domain → shared infrastructure`.

## Prerequisites

- Node.js **22+**
- pnpm via Corepack (`packageManager` pinned in `package.json`)
- **Docker** (recommended) for PostgreSQL, Redis, MinIO, Mailpit
- Git

No Stripe, Razorpay, OpenAI, Anthropic, or LinkedIn credentials required for the local demo.

## Quick start

### macOS / Linux

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm bootstrap
docker compose -f infra/compose.yaml up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Windows PowerShell

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
pnpm bootstrap
docker compose -f infra/compose.yaml up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Corepack signing-key recovery

If Corepack reports a signing key error:

```bash
corepack prepare pnpm@9.15.4 --activate
```

Do not disable integrity checks.

## Environment

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL — **Compose uses host port `55432`** |
| `REDIS_URL` | Redis coordination |
| `DEMO_AUTH_ENABLED` | Candidate + admin demo login (must be `false` in production) |
| `NEXT_PUBLIC_API_URL` | Web/admin API base (`http://localhost:4000/v1`) |
| `STRIPE_ENABLED`, `OPENAI_ENABLED`, etc. | Real providers default **off** |

Example Compose database URL:

```text
DATABASE_URL=postgresql://applyflow:applyflow@127.0.0.1:55432/applyflow?schema=public
```

Compose maps `127.0.0.1:55432` → PostgreSQL `5432` inside the container.

## Development

| Command | Description |
|---------|-------------|
| `pnpm bootstrap` | Install, `prisma generate`, **build internal packages** |
| `pnpm dev:infra` | `docker compose up -d --wait` |
| `pnpm db:migrate` | Apply migrations (loads root `.env`) |
| `pnpm db:seed` | Idempotent demo seed |
| `pnpm dev` | API, worker, web, admin, mock providers (single command) |
| `pnpm verify` | Lint, typecheck, unit test, build, integration |
| `pnpm demo:smoke` | Health + domain + integration (API must be running) |
| `pnpm demo:reset` | Migrate + reseed |
| `pnpm test:e2e` | Playwright (`apps/web`) |

`pnpm dev` builds workspace dependencies first (`turbo.json` `dev.dependsOn: ["^build"]`). Do **not** start a second worker manually.

## Local URLs

| Service | URL |
|---------|-----|
| Candidate web | http://localhost:3000 |
| Admin web | http://localhost:3001 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |
| Mock providers | http://localhost:4100 |
| Mailpit | http://localhost:8025 |
| MinIO console | http://localhost:9001 |

## Candidate demo

1. Open http://localhost:3000/login
2. Choose a persona (e.g. **Experienced Launch** — 20/50 quota used)
3. Use **Help & demo** (`/help`) for the presentation checklist

| Persona | Email |
|---------|-------|
| `experienced-launch` | experienced.launch@demo.applyflow.local |
| `fresher-free` | fresher.free@demo.applyflow.local |
| `experienced-free` | experienced.free@demo.applyflow.local |
| `quota-exhausted` | quota.exhausted@demo.applyflow.local |
| `waiting-action` | waiting.action@demo.applyflow.local |

## Admin demo

1. Open http://localhost:3001/login
2. Click **Continue as Demo Admin (Support)** — server session cookie, not `x-admin-email`
3. Use **Demo center** in the sidebar for the admin script

Seeded admins: `support@`, `finance@`, `ops@`, `ai@`, `auditor@` `@demo.applyflow.local` (RBAC differs per role).

## Mock mode

- Billing upgrades complete via **Simulate webhook** on Plan page or `POST /v1/billing/webhooks/mock`
- AI provider **Test (mock)** in admin — no real API calls unless env flags enable providers
- LinkedIn: assisted/track-only — **no scraping**

## Stop and reset

```bash
# Stop dev servers: Ctrl+C in terminal running pnpm dev

# Reseed demo data (preserve containers)
pnpm demo:reset

# Stop infrastructure
docker compose -f infra/compose.yaml down

# Destructive DB reset
docker compose -f infra/compose.yaml down -v && pnpm db:migrate && pnpm db:seed
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Missing `@applyflow/*/dist` | Run `pnpm bootstrap` before `pnpm dev` |
| `DATABASE_URL` not found on migrate | Ensure `.env` at repo root; migrate loads it automatically |
| Port 55432 unavailable | Change Compose mapping and `DATABASE_URL` together |
| Admin 401 | Log in at `/login`; demo login disabled if `APP_ENV=production` |
| E2E failures | `pnpm db:seed`; API :4000 + web :3000 running |
| Worker `dotenv` error | `dotenv` is a direct dependency of `@applyflow/worker` |

## Security and product boundaries

- Quota: append-only ledger; upgrades add delta grants
- AI output is draft until candidate confirms
- Admin permissions enforced in API (`AdminAuthGuard` + RBAC)
- Secrets never returned to browser after AI key storage (fingerprint only)
- Demo auth cannot run in production (`getConfig()` fails if `DEMO_AUTH_ENABLED` in production)

## Documentation

- [`00-START-HERE.md`](00-START-HERE.md) — build contract
- [`docs/`](docs/) — specifications
- [`docs/implementation/UI_UX_REBUILD_PLAN.md`](docs/implementation/UI_UX_REBUILD_PLAN.md) — UI rebuild checkpoint
- [`AGENTS.md`](AGENTS.md) — agent rules

## Production TODO

Real payment webhooks, LinkedIn OIDC approval, licensed connectors, KMS secrets, admin MFA, and production branding — see [`docs/DEMO_PRESENTATION_GUIDE.md`](docs/DEMO_PRESENTATION_GUIDE.md).

## Railway hosting

Deploy as multiple services (API, web, admin, worker, optional mocks) with Postgres + Redis plugins. See **[`docs/RAILWAY.md`](docs/RAILWAY.md)** and [`.env.railway.example`](.env.railway.example).
