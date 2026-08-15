# ApplyFlow Demo Presentation Guide

Use this guide for a **10–15 minute** stakeholder demo. All steps reference implemented routes and deterministic seed data.

## Prerequisites

- Node.js 22+, pnpm (Corepack), Docker (for Compose infra)
- Git clone of ApplyFlow at repository root

## Startup (verified sequence)

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

### Corepack signing-key recovery (if install fails)

```bash
corepack prepare pnpm@9.15.4 --activate
```

Do not disable package integrity checks.

## Service URLs

| Service | URL |
|---------|-----|
| Candidate web | http://localhost:3000 |
| Admin web | http://localhost:3001 |
| API health | http://localhost:4000/health |
| Mock providers | http://localhost:4100 |
| Mailpit | http://localhost:8025 |
| MinIO console | http://localhost:9001 |

PostgreSQL (Compose): `127.0.0.1:55432` → container `5432`

## Demo personas (candidate)

Sign in at http://localhost:3000/login — no password.

| Persona ID | Use in demo |
|------------|-------------|
| `experienced-launch` | Paid Launch 50 — **20 used, 30 available** (resets on seed) |
| `fresher-free` | Fresher onboarding and education-led guidance |
| `experienced-free` | Incomplete onboarding |
| `quota-exhausted` | Quota blocked state |
| `waiting-action` | Manual action required on applications |

## Admin login

1. Open http://localhost:3001/login
2. Click **Continue as Demo Admin (Support)**
3. Session cookie `applyflow_admin_session` is issued by the API (not a header dropdown)

Other seeded admins exist for permission demos (`finance@`, `ops@`, `auditor@`) via API only.

## Candidate presentation script (~8 minutes)

1. **Home** (`/home`) — pipeline hero, quota KPIs, next action.
2. **Help & demo** (`/help`) — checklist; mention demo mode badge.
3. **Fresher or experienced** — sign in as `fresher-free` or stay on launch persona; note onboarding path messaging on home.
4. **Resumes** (`/resumes`) — active resume, extraction review = draft until confirmed.
5. **Find jobs** (`/discover`) — search/filter; open **Software Engineer** (stable fixture).
6. **Job detail** — match explanation, assisted boundary (mock ATS, not LinkedIn auto-submit).
7. **Prepare application** — screening questions; confirm drafts before submit.
8. **Applications** (`/applications`) — status pipeline and detail timeline.
9. **Plan** (`/plan`) — quota, upgrade preview, processing until webhook; simulate webhook in demo.

## Admin presentation script (~7 minutes)

1. **Login** — demo admin session.
2. **Dashboard** — KPIs from `/admin/overview` (users, MRR demo, applications, provider health).
3. **Users** — search; open **experienced.launch@** profile; quota ledger append-only; +1 adjustment with reason.
4. **Applications** — operational list with states.
5. **Plans & quotas** — published plan versions and allowances.
6. **AI providers** — masked fingerprint; store demo key; mock test connection.
7. **Reports** — text summaries for accessibility.
8. **Audit log** — login, quota, AI events.
9. **Demo center** — restart tour; `pnpm demo:reset` instructions.
10. **Logout** — end session.

## Expected seeded values

- Launch persona: 20 consumed, 50 limit, 30 available (after `db:seed`)
- Plans: Free 5, Launch 50 (₹999 example), Power 100 (₹1,499 example)
- Jobs: 9+ fixtures including OTP/CAPTCHA scenarios

## Mocked / disabled in local demo

- Stripe, Razorpay, OpenAI, Anthropic (env flags default `false`)
- Billing: `POST /v1/billing/webhooks/mock` simulates provider webhook
- LinkedIn: assisted/track-only; no scraping
- AI extraction: mock deterministic pipeline

## Verification commands

```bash
pnpm verify          # lint, typecheck, test, build, integration
pnpm demo:smoke       # API health + domain + integration (API must be up)
pnpm test:e2e         # Playwright (API + web running)
```

## Reset

| Goal | Command |
|------|---------|
| Reseed demo data | `pnpm demo:reset` |
| Full infra + DB | `docker compose -f infra/compose.yaml down` then setup from startup |

## Production prerequisites (not implemented)

- Real payment provider certification and webhook signatures
- LinkedIn OIDC production approval
- KMS-backed secrets, MFA for admin
- Licensed job connectors beyond mock fixtures

## Troubleshooting

| Issue | Action |
|-------|--------|
| `DATABASE_URL` missing on migrate | Ensure `.env` exists; `pnpm bootstrap` copies from example |
| Port 55432 in use | Stop other Postgres or change Compose mapping consistently in `.env` |
| Package `dist` missing | Run `pnpm bootstrap` before `pnpm dev` |
| Admin redirect loop | Clear cookies; use `/login` |
| Provider disabled | Expected — use mock test connection in admin |
