# Deploy ApplyFlow on Railway

ApplyFlow runs as **multiple Railway services** from one monorepo. Railway does not support a single service running API + web + admin together.

## Architecture on Railway

| Service | Package | Config path | Health check |
|---------|---------|-------------|--------------|
| **api** | `@applyflow/api` | `/apps/api/railway.json` | `/health` |
| **web** | `@applyflow/web` | `/apps/web/railway.json` | `/login` |
| **admin** | `@applyflow/admin` | `/apps/admin/railway.json` | `/login` |
| **worker** | `@applyflow/worker` | `/apps/worker/railway.json` | none (background) |
| **mocks** (optional) | `@applyflow/mock-providers` | `/apps/mock-providers/railway.json` | `/health` |

**Plugins (required):**

- PostgreSQL → `DATABASE_URL`
- Redis → `REDIS_URL`

**Optional:**

- Volume mounted at `/data` for `LOCAL_STORAGE_PATH` (resume uploads in staging)

## Quick setup

### 1. Create project

1. New Railway project from this GitHub repository.
2. Add **PostgreSQL** and **Redis** plugins.
3. Create empty services: `api`, `web`, `admin`, `worker`, and optionally `mocks`.

### 2. Configure each service

For every service:

- **Root Directory:** repository root `/` (not the app subfolder).
- **Config file path:** absolute path from repo root, e.g. `/apps/api/railway.json`.
- **Watch paths** (recommended): `apps/api/**`, `packages/**` for api (adjust per service).

Railway auto-detects pnpm monorepos; the `railway.json` in each app folder sets build/start commands.

### 3. Environment variables

Use [`.env.railway.example`](../../.env.railway.example) as a template.

**Critical:**

| Variable | Services | Notes |
|----------|----------|-------|
| `DATABASE_URL` | all | From Postgres plugin |
| `REDIS_URL` | api, worker | From Redis plugin |
| `API_URL` | api, web, admin | `https://${{api.RAILWAY_PUBLIC_DOMAIN}}` |
| `WEB_URL` | api | CORS + OIDC redirects |
| `ADMIN_URL` | api | CORS |
| `NEXT_PUBLIC_API_URL` | **web, admin (build)** | Must be set before build |
| `SESSION_SECRET`, `JWT_ACCESS_SECRET`, `ENCRYPTION_KEY` | api, worker | 32+ chars, unique |
| `DEMO_AUTH_ENABLED` | api | `false` when `APP_ENV=production` |
| `APP_ENV` | all | `staging` for demo, `production` for live |

**Production safety:** `APP_ENV=production` with `DEMO_AUTH_ENABLED=true` **fails startup**. Use `APP_ENV=staging` for a hosted demo.

### 4. Service wiring example

```
API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
WEB_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
ADMIN_URL=https://${{admin.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/v1
MOCK_PROVIDERS_URL=https://${{mocks.RAILWAY_PUBLIC_DOMAIN}}
OIDC_ISSUER_URL=https://${{mocks.RAILWAY_PUBLIC_DOMAIN}}/oidc
OIDC_WEB_REDIRECT_URI=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/v1/auth/oidc/callback
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

Set `NEXT_PUBLIC_API_URL` on **web** and **admin** services so Next.js embeds the API URL at build time.

### 5. Deploy order

1. **mocks** (if using OIDC demo)
2. **api** (runs `pnpm railway:release` → migrations before deploy)
3. **worker**
4. **web** and **admin**

After first deploy, seed demo data once:

```bash
railway run --service api pnpm db:seed
```

### 6. Verify

| URL | Expected |
|-----|----------|
| `https://<api>/health` | `status: ok`, database + redis ok |
| `https://<web>/login` | Demo persona login |
| `https://<admin>/login` | Demo admin login (staging only) |

## Build & start commands (reference)

Defined in root `package.json` and per-app `railway.json`:

```bash
pnpm railway:build:api      # install + bootstrap + build api
pnpm start:railway:api      # node dist/main.js (PORT from Railway)
pnpm railway:release        # prisma migrate deploy
```

## PORT binding

Railway sets `PORT`. All HTTP services bind `0.0.0.0` and use `resolveListenPort()` from `@applyflow/config`.

## Storage

- **Staging/demo:** mount a volume at `/data`, set `LOCAL_STORAGE_PATH=/data/uploads`.
- **Production:** configure S3-compatible storage (`S3_*` variables). MinIO is not required on Railway.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API fails on boot: demo auth | Set `DEMO_AUTH_ENABLED=false` or `APP_ENV=staging` |
| API fails: default secrets | Set unique `SESSION_SECRET`, `JWT_ACCESS_SECRET`, `ENCRYPTION_KEY` |
| Web can't reach API | Set `NEXT_PUBLIC_API_URL` and **redeploy** web/admin |
| CORS errors | `WEB_URL` / `ADMIN_URL` must match browser origins exactly (https) |
| Migrations not applied | Check api `preDeployCommand` logs; run `railway run pnpm db:migrate` |
| Uploads lost on redeploy | Use volume or external S3 |

## Local parity

Local development still uses Docker Compose and `pnpm dev`. Railway configuration does not replace local `.env` — see root [README.md](../../README.md).
