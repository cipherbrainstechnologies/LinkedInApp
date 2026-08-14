# ApplyFlow Repository Instructions

These rules apply to every agent and every file in the repository.

## Product truth

- The product optimises for verified, relevant applications, not indiscriminate volume.
- Never fabricate candidate facts, qualifications, salary history, work authorisation, identity, or screening answers.
- AI output is a draft until the user confirms it.
- LinkedIn is `ASSISTED` by default. Do not scrape or bot LinkedIn.
- A connector may auto-submit only when its domain policy explicitly allows the exact capability.
- CAPTCHA, OTP, email verification, unexpected consent, or material new legal terms transition the application to `WAITING_FOR_USER`.
- Never bypass access controls, anti-bot systems, rate limits, or website security.

## Architecture rules

- Use a pnpm + Turborepo TypeScript monorepo.
- Keep product capabilities in feature modules. Do not build a layer-first dumping ground.
- Dependency direction is `apps -> features/domain -> shared infrastructure`.
- Domain packages must not import framework, database, HTTP, payment, or AI SDKs.
- All external systems are accessed through typed adapters.
- Validate every external payload at runtime with Zod.
- PostgreSQL is the source of truth. Redis is disposable coordination/cache state only.
- Use an append-only ledger for quotas and financial entitlement adjustments.
- Use outbox events for reliable asynchronous work.
- Require idempotency for submission, checkout, upgrade, webhook, and admin mutation endpoints.

## Security rules

- Enforce authorisation in the API, not only in clients.
- Never expose provider secrets to web or mobile clients.
- Store production secrets only by secret reference/KMS-backed encrypted envelope; local development uses environment variables.
- Hash sensitive lookup values where plaintext is unnecessary.
- Redact resume content, contact details, access tokens, application answers, and provider payloads from logs.
- Verify payment webhooks using the raw request body before parsing.
- Scan uploaded files, verify MIME by content, enforce size/page limits, and store outside the public web root.
- No third-party passwords in the database. Use OAuth, user-controlled browser sessions, or `WAITING_FOR_USER`.

## Frontend rules

- Responsive web and native mobile share schemas, domain rules, API client, design tokens, and copy—not DOM components.
- Use URL state for shareable search/filter/sort/pagination on web.
- Treat loading, empty, partial, stale, offline, permission, quota, and failure states as first-class.
- Meet WCAG 2.2 AA for the web and equivalent platform accessibility practices on mobile.
- Do not use colour alone for status. Maintain visible focus and keyboard operation.
- Keep the primary action and next required step obvious.
- Preserve form data across recoverable failures.

## Quality rules

- No `any` without an inline justification and an issue reference.
- No skipped tests in mainline code.
- Tests assert behaviour and business outcomes, not implementation details.
- All bugs require a regression test.
- External adapters require contract fixtures and failure-path tests.
- Every user-visible P0 flow requires an end-to-end test.
- The demo must run with mock adapters and no third-party credentials.

## Working discipline

- Maintain `docs/BUILD_STATUS.md` as work progresses.
- Record material decisions and deviations in ADR format.
- Do not delete or weaken an acceptance criterion to make a test pass.
- If a requirement cannot be implemented safely, feature-flag it off, implement the safe state and admin explanation, and document the production dependency.
- Run the full quality gate before claiming a milestone complete.
