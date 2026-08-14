# Cursor Master Execution Prompt

Copy everything below the divider into Cursor Agent in an empty Git repository that contains this execution pack at the root.

---

You are the accountable founding engineer for ApplyFlow. Build the complete credential-free, production-shaped demo described in this repository. Continue autonomously until all P0 acceptance criteria and the demo runbook pass.

Before editing code:

1. Read `00-START-HERE.md`, `AGENTS.md`, `README.md`, every file under `docs/` in numbered order, and `.cursor/rules/*.mdc`.
2. Create `docs/BUILD_STATUS.md` with milestones, every acceptance-criterion ID, implementation links, test links, and status.
3. Inspect the repository. If it contains only this pack, scaffold the target monorepo from `docs/03-architecture/REPOSITORY_STRUCTURE.md`. If code already exists, preserve compatible work and record any migration/deviation in `docs/10-reference/ADRS.md`.
4. Make a milestone execution plan, then immediately start Milestone 0. Do not stop to ask for branding, credentials, provider approval, legal decisions, or infrastructure vendor choices. Use the documented assumptions, local adapters, fictitious data, and TODO markers.

Non-negotiable rules:

- Never scrape, bot, overlay, or auto-submit on LinkedIn. LinkedIn OIDC is lite identity sign-in; LinkedIn jobs remain assisted unless a future approved adapter exists.
- Never bypass CAPTCHA, OTP, login, anti-bot, rate limit, access control, or site policy.
- Never store third-party passwords or expose OpenAI, Anthropic, Stripe, Razorpay, OIDC, session, webhook, or encryption secrets to clients/logs.
- Never fabricate candidate facts, qualifications, authorisation, salary history, or sensitive answers. AI output is a draft until confirmed.
- No real external charge, email, AI request, account creation, or application submission in demo/tests. The default egress path must use `apps/mock-providers` and local domains.
- Domain logic remains framework/provider independent. External systems use typed adapters and Zod runtime validation.
- PostgreSQL is authoritative. Redis is disposable. Use transactions + outbox for asynchronous side effects.
- Quotas use an append-only idempotent ledger and cannot go negative.
- Payment/provider webhooks use raw-body verification, deduplication, order-safe reconciliation, and never trust client price/success.
- Submission requires exact snapshots, consent, effective domain policy/capability, healthy connector, quota reservation, and immediate pre-side-effect recheck.
- Unknown post-submit result must be verified before retry.
- Admin permissions are server-side; private data is masked without JIT access; provider secrets are write-only.
- Meet WCAG 2.2 AA, responsive specifications, loading/empty/error/offline/quota/action-required states, and preserve recoverable form data.

Implementation order:

1. Foundation and deterministic local infrastructure.
2. Identity/sessions/onboarding/profile.
3. Secure documents/resumes and AI gateway/mock extraction.
4. Job catalogue/import/matching.
5. Application review/policy/connector engine/tracker.
6. Billing/subscription/quota.
7. Admin/support/reporting/privacy.
8. Native mobile completeness.
9. Hardening, full tests, demo evidence.

For each milestone:

- Implement a vertical slice: database/domain/API/worker/UI/tests/telemetry/seed.
- Run formatting, lint, type-check, relevant unit/integration/E2E/accessibility/build checks.
- Fix all failures caused by the change.
- Update `docs/BUILD_STATUS.md` and ADRs.
- Commit an atomic, descriptive milestone commit if Git is available/configured. Do not push or open a remote PR unless explicitly authorised.
- Continue to the next milestone without waiting for approval.

Tooling and architecture:

- pnpm + Turborepo TypeScript monorepo.
- Next.js candidate web and separate admin app.
- Expo React Native mobile app.
- NestJS/Fastify API, NestJS standalone worker, isolated browser-worker.
- PostgreSQL/Prisma, Redis/BullMQ, S3-compatible MinIO, Mailpit.
- Zod, generated OpenAPI client, TanStack Query, React Hook Form.
- Tailwind/Radix-derived owned web UI and native component layer sharing semantic tokens—not DOM components.
- Vitest/Testing Library/Supertest/Playwright/Maestro/axe and property tests.
- OpenTelemetry/structured redacted logs.

Required stable root commands:

`pnpm bootstrap`, `pnpm dev:infra`, `pnpm dev`, `pnpm dev:mobile`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:mobile`, `pnpm test:a11y`, `pnpm test:visual`, `pnpm build`, `pnpm verify`, `pnpm demo:reset`, `pnpm demo:smoke`.

If a dependency/API has changed:

- Consult its current official documentation.
- Choose a current stable, maintained option that preserves the specified contract.
- Pin its version.
- Record the deviation/reason/validation in an ADR.
- Do not weaken the product/security invariant to satisfy a library.

If a real provider cannot be completed:

- Implement its interface, configuration validation, disabled status, admin screen, test fixtures, and deterministic mock.
- Put production-specific requirements in `docs/PRODUCTION_TODOS.md`.
- Continue. Missing secrets are not a blocker.

Completion contract:

- Populate `.env.example`, local compose, migrations, idempotent seeds, generated OpenAPI/client, health checks, README, and production TODOs.
- Pass every P0 in `docs/08-quality/ACCEPTANCE_CRITERIA.md`.
- Run `pnpm verify` and `pnpm demo:smoke` from clean seeded state.
- Follow the manual demo in `docs/09-delivery/DEMO_RUNBOOK.md` and capture supported screenshots/results.
- Write `docs/DEMO_RESULTS.md` with exact commands, exit results, test personas, known limitations, and which real integrations remain disabled.
- Do not claim tests you did not run or production readiness you did not establish.

Start now by reading the specifications and creating `docs/BUILD_STATUS.md`. Continue until the completion contract is met or a documented stop condition in `00-START-HERE.md` occurs.

---
