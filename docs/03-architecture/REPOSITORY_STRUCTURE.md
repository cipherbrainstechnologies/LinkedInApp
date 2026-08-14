# Repository Structure and Build Contracts

## 1. Target tree

Cursor should create this structure, adding implementation files inside the named boundaries without moving domain rules into apps.

```text
applyflow/
├── .cursor/rules/
├── .github/workflows/
├── apps/
│   ├── web/                       # Candidate responsive Next.js app
│   │   └── src/
│   │       ├── app/
│   │       ├── features/
│   │       ├── shared/
│   │       └── instrumentation.ts
│   ├── admin/                     # Admin Next.js app
│   │   └── src/
│   │       ├── app/
│   │       ├── features/
│   │       └── shared/
│   ├── mobile/                    # Expo React Native app
│   │   └── src/
│   │       ├── app/
│   │       ├── features/
│   │       └── shared/
│   ├── api/                       # NestJS/Fastify HTTP API
│   │   └── src/
│   │       ├── modules/
│   │       ├── platform/
│   │       └── main.ts
│   ├── worker/                    # BullMQ/outbox and non-browser jobs
│   ├── browser-worker/            # Isolated approved connector execution
│   └── mock-providers/            # Local job/payment/AI/ATS simulators
├── packages/
│   ├── domain/                    # Framework-free aggregates and policies
│   ├── schemas/                   # Zod DTOs, event and AI schemas
│   ├── api-client/                # Generated typed clients
│   ├── db/                        # Prisma schema, migrations, repositories
│   ├── auth/                      # OIDC/session adapters
│   ├── ai/                        # AI gateway and provider adapters
│   ├── billing/                   # Stripe/Razorpay/mock adapters
│   ├── connectors/                # Connector SDK, policies, approved adapters
│   ├── storage/                   # S3/MinIO, scanning, extraction ports
│   ├── notifications/             # Email/push/in-app adapters
│   ├── observability/             # Logging, metrics, tracing, redaction
│   ├── design-tokens/             # Shared semantic tokens
│   ├── ui-web/                    # Accessible web primitives/composites
│   ├── ui-mobile/                 # Native primitives/composites
│   ├── config/                    # Typed environment configuration
│   ├── test-kit/                  # Fixtures, clocks, provider simulators
│   ├── eslint-config/
│   └── typescript-config/
├── docs/
│   ├── BUILD_STATUS.md
│   ├── DEMO_RESULTS.md
│   └── ...source specifications
├── infra/
│   ├── docker/
│   ├── compose.yaml
│   ├── railway/                   # Optional staging descriptors
│   └── terraform/                 # Production reference, not demo blocker
├── scripts/
│   ├── bootstrap.mjs
│   ├── seed.mjs
│   ├── wait-for-services.mjs
│   ├── smoke.mjs
│   └── verify-boundaries.mjs
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 2. Feature structure

Within each app, organise by capability:

```text
features/applications/
├── api/
├── components/
├── model/
├── routes-or-screens/
├── tests/
└── index.ts
```

Avoid global folders called only `components`, `services`, or `utils` that accumulate feature rules. Shared code must be genuinely cross-feature and dependency-safe.

## 3. Domain package

Expected modules:

```text
packages/domain/src/
├── identity/
├── candidate/
├── resume/
├── job/
├── matching/
├── application/
├── connector-policy/
├── subscription/
├── quota/
├── ai-routing/
├── consent/
├── audit/
└── shared/
```

Domain code contains:

- Value objects and typed IDs.
- Aggregate commands and invariants.
- Pure calculation policies.
- Domain events.
- Port interfaces only when owned by the domain.

It does not import NestJS, Prisma, Redis, React, payment SDKs, AI SDKs, or HTTP types.

## 4. Package public APIs

- Every package exports through its root `index.ts`/declared exports.
- Apps must not deep-import another package's internals.
- Browser-safe packages are explicitly marked and contain no Node-only dependency.
- Server-only packages declare server-only entry points and are excluded from client bundles.
- Generated API client depends on `schemas`, never on database types.

## 5. Database migrations

- Prisma schema in `packages/db/prisma/schema.prisma`.
- Timestamped migrations committed to source.
- Migration checks run on a disposable database in CI.
- Destructive schema changes require expand/migrate/contract phases and an ADR.
- Seeds are idempotent and environment-labelled.
- Demo seed uses fictitious data only.

## 6. Configuration

`packages/config` parses environment variables once at process start. Invalid production configuration fails fast with a redacted message.

Groups:

- Runtime/environment and public URLs.
- Database/Redis/object storage.
- Auth/OIDC and encryption key references.
- Payment providers and webhook secrets.
- AI provider secret references and defaults.
- Email/push.
- Observability.
- Feature flags and kill-switch backend.
- Demo adapters.

Only variables explicitly prefixed as public may enter web/mobile builds. `.env.example` contains descriptions and placeholders, never real values.

## 7. Root commands

Cursor must implement these stable commands:

| Command | Contract |
| --- | --- |
| `pnpm bootstrap` | Validate tooling, install/setup local config without secrets. |
| `pnpm dev:infra` | Start local dependencies and mock providers. |
| `pnpm dev` | Run web, admin, API, workers, and mocks. |
| `pnpm dev:mobile` | Run Expo with local API instructions. |
| `pnpm db:migrate` | Apply migrations to configured non-production DB. |
| `pnpm db:seed` | Idempotently seed demo data. |
| `pnpm lint` | Lint all workspaces. |
| `pnpm typecheck` | Type-check all workspaces. |
| `pnpm test` | Unit/component tests. |
| `pnpm test:integration` | API/database/provider-contract tests. |
| `pnpm test:e2e` | Web/admin Playwright tests. |
| `pnpm test:mobile` | Maestro smoke flows where environment supports it. |
| `pnpm test:a11y` | Automated accessibility checks. |
| `pnpm test:visual` | Representative visual snapshots. |
| `pnpm build` | Production builds for all packages/apps. |
| `pnpm verify` | Full local/CI quality gate. |
| `pnpm demo:reset` | Reset and seed deterministic demo state. |
| `pnpm demo:smoke` | Run the documented end-to-end demo validation. |

## 8. CI pipeline

Stages:

1. Dependency lock/integrity and secret scan.
2. Format/lint/import boundaries.
3. Type-check.
4. Unit/component tests.
5. Disposable DB migration and integration tests.
6. Build packages/apps and generate/check OpenAPI/API client.
7. Playwright web/admin P0 flows and accessibility.
8. Container image scan/SBOM.
9. Preview deployment smoke test where infrastructure exists.

Fail when generated OpenAPI/client or migrations differ from committed output.

## 9. Commit plan

Suggested atomic commits:

1. `chore: scaffold monorepo and local infrastructure`
2. `feat: add identity sessions and candidate onboarding`
3. `feat: add secure resume pipeline and profile extraction`
4. `feat: add job catalogue discovery and url import`
5. `feat: add matching and application review`
6. `feat: add policy-aware connector execution`
7. `feat: add subscriptions entitlements and quota ledger`
8. `feat: add admin operations and reporting`
9. `feat: add native mobile core journeys`
10. `test: complete p0 end-to-end demo and hardening`

Do not combine unrelated work merely to match this list; preserve bisectable milestones.
