# ApplyFlow

Apply faster without losing control or accuracy.

ApplyFlow optimises for **verified, relevant applications**—not volume. The local demo runs entirely on mock adapters (auth, billing, AI, ATS connector). No paid third-party credentials are required.

## What works in the demo today

| Area | Capabilities |
|------|----------------|
| **Auth** | Demo personas, mock OIDC, email verify, refresh rotation |
| **Onboarding** | Experienced and fresher paths, resumable wizard |
| **Resumes** | Upload pipeline, mock extraction, concurrent activate lock |
| **Jobs** | Discover/search, mock ATS import, SSRF-safe URL handling |
| **Applications** | Prepare → confirm → submit, idempotency, worker scenarios (OTP, CAPTCHA, uncertain, final failure) |
| **Billing** | Free / Launch 50 / Power 100 plans, proration preview, confirm → webhook grant, quota delta on upgrade |
| **Admin** | RBAC, quota adjust, audit, AI provider routes (write-only secrets) |
| **Tests** | Domain unit, API integration (13), Playwright E2E (7 golden paths) |

Progress and P0 criterion mapping: [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md). Last automated run: [`docs/DEMO_RESULTS.md`](docs/DEMO_RESULTS.md).

## Quick start

**Prerequisites:** Node.js 22+, pnpm (Corepack), PostgreSQL 16, Redis 7. Docker Compose is optional (`infra/compose.yaml` for MinIO, Mailpit, mock providers).

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm bootstrap          # generate Prisma client
pnpm db:migrate
pnpm db:seed

# Option A — all apps (excludes mobile)
pnpm dev

# Option B — individual processes
pnpm --filter @applyflow/api dev      # API :4000
pnpm --filter @applyflow/worker dev   # outbox / connector worker
pnpm --filter @applyflow/web dev      # candidate web :3000
pnpm --filter @applyflow/admin dev    # admin :3001
```

With Docker Compose infra:

```bash
pnpm dev:infra          # PostgreSQL, Redis, MinIO, Mailpit, mocks
pnpm db:migrate && pnpm db:seed
pnpm dev
```

### Local URLs

| Service | URL |
|---------|-----|
| Candidate web | http://localhost:3000 |
| Admin web | http://localhost:3001 |
| API (+ health) | http://localhost:4000 / http://localhost:4000/health |
| Mock providers | http://localhost:4100 |
| Mailpit (if Compose) | http://localhost:8025 |

## Demo sign-in

Open http://localhost:3000/login and choose a persona (no password). Demo auth is disabled when `APP_ENV=production` or `DEMO_AUTH_ENABLED=false`.

| Persona ID | Email | Typical use |
|------------|-------|-------------|
| `experienced-free` | experienced.free@demo.applyflow.local | Free plan, onboarding incomplete |
| `experienced-launch` | experienced.launch@demo.applyflow.local | Launch 50 — **20 used, 30 available** (resets on `db:seed`) |
| `fresher-free` | fresher.free@demo.applyflow.local | Fresher onboarding path |
| `quota-exhausted` | quota.exhausted@demo.applyflow.local | Quota blocked flows |
| `waiting-action` | waiting.action@demo.applyflow.local | Application waiting for user action |

**Plans (seed):** Free 5 apps/month · Launch 50 (₹999 example) · Power 100 (₹1,499 example). Upgrade preview shows credit, tax, and due now; quota is granted only after mock webhook success (`Plan` page → simulate webhook in demo).

**Admin:** http://localhost:3001 — header `x-admin-email: support@demo.applyflow.local` (also `finance@`, `ops@`, `ai@`, `auditor@` demo accounts in seed).

Manual demo script: [`docs/09-delivery/DEMO_RUNBOOK.md`](docs/09-delivery/DEMO_RUNBOOK.md).

## Commands

| Command | Description |
|---------|-------------|
| `pnpm bootstrap` | Install workspace deps and generate Prisma client |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed demo data (idempotent; resets launch persona quota) |
| `pnpm dev` | Web, admin, API, mocks in parallel (not mobile) |
| `pnpm dev:infra` | Wait for / start Compose-backed services |
| `pnpm verify` | Lint, typecheck, unit test, build, **integration tests** |
| `pnpm demo:reset` | Migrate + reseed |
| `pnpm demo:smoke` | API health + domain/config tests + integration (API must be up) |
| `pnpm test:integration` | API integration suite (`apps/api`) |
| `pnpm test:e2e` | Playwright (`apps/web`; API + web must be running) |
| `pnpm --filter @applyflow/domain test` | Pure domain rules (quota, billing math, onboarding) |

## Architecture

Monorepo layout (pnpm + Turborepo):

- **apps/web** — Candidate Next.js app
- **apps/admin** — Admin Next.js app
- **apps/api** — NestJS/Fastify API (`/v1`)
- **apps/worker** — Outbox, document processing, mock connector scenarios
- **apps/mobile** — Expo shell (not required for web demo)
- **packages/domain** — Pure business rules (no framework imports)
- **packages/db** — Prisma schema, migrations, seed
- **packages/auth**, **packages/schemas**, **packages/config**, etc. — shared infrastructure

Dependency direction: `apps → features/domain → shared infrastructure`. External systems are accessed through typed adapters with runtime validation.

Full specifications: [`docs/`](docs/) · Repository rules: [`AGENTS.md`](AGENTS.md) · Start contract: [`00-START-HERE.md`](00-START-HERE.md).

## Important boundaries

- LinkedIn: OIDC sign-in when enabled; **no scraping** or automated LinkedIn submissions
- AI output is draft until the user confirms
- Quotas use an **append-only ledger**; upgrades add a delta grant (usage is preserved)
- Payment success is **webhook-reconciled** in demo via `POST /v1/billing/webhooks/mock` — client redirect alone does not grant quota
- Stripe, Razorpay, OpenAI, and Anthropic remain **disabled** until configured (`STRIPE_ENABLED`, etc. in `.env`)

## Production TODO (not required for local demo)

Real provider keys, KMS-backed secrets, webhook signature verification for live Stripe/Razorpay, licensed job connectors, LinkedIn OIDC approval, and production branding/legal copy. See [`docs/DEMO_RESULTS.md`](docs/DEMO_RESULTS.md) for what remains unverified in automation.
