# Test Strategy and Quality Gates

## 1. Quality objective

Prove that ApplyFlow preserves candidate truth, consent, policy, money, quota, and submission evidence under normal, failure, retry, concurrency, and recovery conditions. Test count is not the goal; release confidence on high-impact journeys is.

## 2. Test pyramid

| Layer | Tools | Scope |
| --- | --- | --- |
| Static | TypeScript, ESLint, dependency boundary check, Zod/OpenAPI drift | Types, imports, unsafe patterns, generated contract consistency. |
| Unit/property | Vitest, fast-check | Domain policies, state machines, proration cross-checks, quota ledger, mappings, validation. |
| Component | Testing Library, axe | User-visible states, forms, accessibility, permissions, responsive component behaviour. |
| API integration | Vitest/Supertest + disposable PostgreSQL/Redis/MinIO | Auth, DB constraints/transactions, outbox, webhooks, files, RBAC. |
| Provider contract | Fixtures/mock provider/test mode | OIDC, payment, AI, job/ATS adapters and error mapping. |
| Web/admin E2E | Playwright | P0 journeys, keyboard/a11y, responsive, cross-app state. |
| Mobile E2E | Maestro + Expo test build | Sign-in callback mock, onboarding, jobs, review, tracker, action-required deep link. |
| Visual | Playwright screenshots/component stories | Critical screens/states across viewports/themes/text expansion. |
| Performance | k6/Autocannon + web/mobile profiling | API/queue/worker limits, Core Web Vitals, app startup. |
| Security | Automated scanners + targeted tests + independent pen test | Auth, BOLA, CSRF, SSRF, upload, webhooks, secrets, admin, connector isolation. |
| AI eval | Versioned eval runner | Schema, extraction accuracy, zero fabrication critical suite, prompt injection, sensitive data. |

## 3. Test environments

### Unit/component

No network, deterministic clock/random/UUID factories, in-memory fakes only at explicit ports.

### Integration

Ephemeral PostgreSQL, Redis, MinIO, Mailpit, and mock provider server. Apply real migrations from empty database. Parallel tests isolate schema/database/bucket keys.

### E2E/demo

Full built services with mock adapters and deterministic seed. No real domains, charges, AI calls, email, or applications.

### Provider test mode

Separate non-production keys/resources; manually/CI-triggered contract suite where provider terms allow. Never block local demo on provider availability.

## 4. Deterministic personas

All fictitious:

1. `experienced-free@example.test`: experienced onboarding incomplete, free quota 5.
2. `experienced-paid@example.test`: completed profile, two resumes/one active, Launch plan, 20 consumed/2 reserved scenario.
3. `fresher@example.test`: education/projects/skills, no experience, selected entry roles.
4. `quota-used@example.test`: free limit exhausted.
5. `action-required@example.test`: application waiting for OTP/CAPTCHA mock.
6. Admin identities for support, finance, ops, AI admin, auditor, and super admin with distinct permissions.

Fixtures cover multilingual names, long company/title, missing LinkedIn email, non-ASCII text, and varying time zones without using real people.

## 5. Domain/unit tests

### Candidate/resume

- Experienced/fresher completion invariants.
- Exactly one active resume under concurrent activation.
- Immutable resume/application snapshots.
- Confirmation/source rules and sensitive answer restrictions.

### Jobs/matching

- Canonical URL/source deduplication.
- Expiry/stale rules.
- Deterministic eligibility blockers override score/explanation.
- Exclusions and unknown handling.

### Applications

- Every legal/illegal state transition.
- Duplicate application/reapplication rule.
- Snapshot hash and version conflict.
- Cancellation before/after side-effect boundary.
- Waiting-user reservation expiry/resume.

### Quota/subscription

- Ledger operation sequences via property tests; available never negative.
- Last-unit concurrent submissions: exactly one reservation succeeds.
- Reserve/consume/release/reverse idempotency.
- Upgrade delta without usage reset.
- Downgrade schedule when lower than usage.
- Money rounding/period boundary cross-check.

### Policy/connector

- Default deny.
- Expired policy/consent/kill switch prevents side effect.
- Capability/geography/mode/version/canary evaluation.
- Uncertain submit never blindly retries.

## 6. API integration tests

- All endpoints require correct auth and resource ownership.
- Admin role/permission/assurance matrix.
- OIDC callback validation using local signed issuer fixture.
- Refresh rotation and reuse detection.
- Idempotency same-body repeat vs conflicting-body key.
- Optimistic concurrency/version conflict.
- Prisma/database unique/check constraints.
- Transaction + outbox atomicity and consumer deduplication.
- Raw-body webhook signature/duplicate/order/reconciliation.
- Upload intent, scan states, MIME/magic/size/zip-bomb/malware fixture.
- URL importer SSRF/redirect/DNS/content limit fixtures.
- Export/download authorisation and expiry.
- Audit event on privileged success/failure with redaction.

## 7. Provider contract tests

### LinkedIn OIDC simulator

Valid claims; missing email; expired token; issuer/audience/nonce/signature mismatch; denied consent; JWKS rotation; duplicate subject/account link.

### OpenAI/Anthropic mock and optional test mode

Valid structured output; unknown extra field; malformed/truncated; refusal; timeout; 429; 5xx; cost ceiling; provider disabled; fallback allowed/denied; secret redaction.

### Stripe/Razorpay simulators

Checkout, immediate upgrade, scheduled downgrade, payment action, failure, renewal, past due, cancel/reactivate, refund, duplicate/out-of-order/delayed events, subscription state conflict.

### ATS/mock connector

All scenarios in `AUTOMATION_ENGINE.md`, including timeout after side effect and later verify.

## 8. Web E2E journeys

- Experienced activation through first mock submitted application.
- Fresher education-first flow and multiple job-title selection.
- Resume upload/scan/extraction review/activation/switch.
- Search/filter/deep-link/back navigation and import URL.
- Hard disqualifier blocks application.
- Application review, missing/sensitive answer, confirm, submit, evidence/timeline.
- Waiting action and safe resume.
- Application list search/filter/export request.
- Free quota exhausted and upgrade preview/confirm/pending/success.
- Failed payment preserves plan/quota.
- Account/session/consent/privacy requests.
- Offline/stale/retry states for safe flows.

Run P0 flows with mouse and keyboard. Assert focus after validation/dialog/navigation and use axe at key pages.

## 9. Admin E2E journeys

- Role sees only authorised navigation/routes/actions.
- Support finds customer, opens case, grants allowed quota, cannot refund/read secret/private data.
- JIT private-data access request/approval/expiry/audit.
- Finance publishes valid plan version, previews/refunds, cannot manage AI/connector policy.
- Ops reviews connector, canary/degrade/kill switch with typed confirmation.
- AI admin writes secret, cannot read it, evaluates/publishes/rolls back route.
- Auditor reads/exports permitted audit and cannot mutate.
- Webhook/reconciliation conflict workflow.
- Global submit kill switch blocks queued side effect.

## 10. Mobile E2E

P0 mobile subset:

- Demo sign-in/OIDC callback route.
- Resume/photo-file permission-safe upload flow.
- Fresher/experienced onboarding resume.
- Discover/job detail/application review.
- Waiting-action deep link and return.
- Application tracker and plan/quota read.
- Session expiry/refresh/offline behaviour.

Use system browser/deep-link simulation. Test safe area, keyboard, large text, screen reader labels, reduced motion, light/dark.

## 11. Accessibility tests

- Automated axe has zero critical/serious violations on P0 screens.
- Semantic landmarks/headings/forms/tables.
- Keyboard-only complete P0 web journey.
- Focus visible, dialog containment/restoration, error focus/summary, status announcements.
- 200% zoom/reflow and 320px width.
- Contrast and non-colour status.
- Reduced motion.
- Mobile accessibility labels/hints/roles and large text truncation/reflow.
- Charts have summaries/tables.

Automated results do not replace manual screen-reader testing before launch.

## 12. Visual tests

Capture stable states at 320x568, 390x844, 768x1024, 1024x768, and 1440x900:

- Sign-in/onboarding.
- Home default/action-required/quota exhausted.
- Discover empty/loading/results/filter open.
- Job detail strong/hard disqualifier.
- Application review/missing/sensitive/waiting/submitted.
- Resume list/extraction review.
- Billing preview/pending/failure.
- Admin overview/customer/connector/AI route.

Disable nondeterministic timestamps/animations with fixture clock.

## 13. Performance tests

### API/worker initial targets

- P95 read API under 400ms and write API under 700ms under agreed demo/staging load, excluding external provider time.
- Queue dispatch P95 under 2s at expected initial throughput.
- No duplicate side effect under retry/concurrency suite.
- Search P95 under 800ms on representative seeded volume.
- Upload intent fast; scan/extract measured asynchronously.

### Web/mobile

Use budgets in design-system doc. Test representative mid-tier Android throttling and desktop. Fail CI on material regression beyond approved threshold rather than one noisy run.

## 14. Security tests

- Cross-user ID matrix for every resource type.
- Admin permission/assurance/JIT matrix.
- OAuth state/nonce/PKCE/linking and redirect attacks.
- CSRF/CORS/CSP/open redirect/XSS/job-rich-text.
- SSRF IPv4/IPv6/encoded/redirect/DNS/private metadata cases.
- File polyglot/magic mismatch/oversize/zip bomb/malware/parser timeout.
- Webhook forged/replayed/duplicated/out-of-order/large body.
- Rate limits/enumeration/refresh reuse.
- Signed URL/object-key scope and expiry.
- Secret scanning/log/analytics/crash payload redaction.
- Connector egress/kill-switch/side-effect gate.
- AI prompt injection and data-leak eval.

## 15. AI eval release gates

- 100% schema validity on critical suite.
- 0 fabricated critical candidate facts in release suite.
- 0 inferred protected/sensitive answers.
- 100% hard eligibility agreement with deterministic engine.
- Task-specific field F1/exact-match threshold documented in route/prompt ADR.
- No statistically/materially worse regression vs currently published route.
- Cost/latency within configured threshold.

Failed gate blocks publish but does not block manual product path.

## 16. Flake policy

- A test is not fixed by increasing arbitrary sleeps.
- Use condition/event wait, deterministic clock, isolated data, and trace/video.
- Quarantine requires owner, issue, reason, and expiry; P0 cannot be quarantined for release.
- Track flaky rate and remove expired quarantines automatically.

## 17. Quality gate

`pnpm verify` must run:

1. Format check.
2. Lint/import boundaries.
3. Type-check.
4. Unit/property/component.
5. Migration from empty DB and integration.
6. OpenAPI/client drift.
7. Build.
8. P0 Playwright + axe.
9. Secret scan and dependency/container checks available locally/CI.
10. Demo smoke.

Cursor records exact commands, exit codes, and meaningful summaries in `docs/DEMO_RESULTS.md`; it must not claim an unrun check passed.
