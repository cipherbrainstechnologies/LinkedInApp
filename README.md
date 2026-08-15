# ApplyFlow

Apply faster without losing control or accuracy.

## Quick start

**Prerequisites:** Node.js 22+, pnpm through Corepack, and Docker Desktop.

Docker Compose provides PostgreSQL 16, Redis 7, MinIO and Mailpit, so separate local installations are not required.

### Windows PowerShell

```powershell
corepack enable
pnpm bootstrap

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

# Prisma currently runs from packages/db and requires its own environment file.
Copy-Item .env packages\db\.env -Force

docker compose -f infra/compose.yaml up -d --wait
docker compose -f infra/compose.yaml ps

pnpm db:migrate

# Run only after migration succeeds.
pnpm db:seed

## Demo sign-in

Open http://localhost:3000/login and choose a demo persona (no password). Demo auth is disabled in production.

| Persona | Email |
|---------|-------|
| Experienced (free) | experienced.free@demo.applyflow.local |
| Experienced Launch (paid) | experienced.launch@demo.applyflow.local |
| Fresher | fresher.free@demo.applyflow.local |

Admin: http://localhost:3001 — use `x-admin-email: support@demo.applyflow.local`

## Commands

| Command | Description |
|---------|-------------|
| `pnpm bootstrap` | Install deps and generate Prisma client |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm dev` | Run web, admin, API, mocks (parallel) |
| `pnpm verify` | Lint, typecheck, test, build |
| `pnpm demo:reset` | Migrate + reseed |
| `pnpm demo:smoke` | Smoke tests |

## Architecture

- **apps/web** — Candidate Next.js app
- **apps/admin** — Admin Next.js app
- **apps/api** — NestJS/Fastify API
- **apps/worker** — Outbox/connector worker
- **packages/domain** — Pure business rules (no framework imports)
- **packages/db** — Prisma schema and migrations

See `docs/` for full specifications and `docs/BUILD_STATUS.md` for implementation progress.

## Important boundaries

- LinkedIn OIDC sign-in only; no scraping or automated LinkedIn submissions
- AI output is draft until user confirms
- Quotas use an append-only ledger
- Real payment/AI providers are disabled until configured
