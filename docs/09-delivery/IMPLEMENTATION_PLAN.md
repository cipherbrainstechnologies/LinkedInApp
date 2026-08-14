# Implementation and Delivery Plan

## 1. Delivery strategy

Build a production-shaped, credential-free demo first. Real providers are then enabled one at a time through contract/legal review, sandbox tests, canary, and kill-switch-controlled rollout.

“Cursor completed the code” is not a production launch gate. Human product, UX, security, legal, finance, and provider validation remain necessary.

## 2. Milestone 0 — Foundation

### Deliver

- pnpm/Turborepo workspace and package boundaries.
- Web/admin/mobile/API/worker/browser-worker/mock-provider shells.
- Docker Compose for PostgreSQL, Redis, MinIO, Mailpit, mocks.
- Typed config, structured redacted logging, OpenTelemetry skeleton.
- Prisma base schema/migration/seed framework.
- CI, lint, type, unit, boundary, build commands.
- Design tokens and initial accessible web/mobile primitives.
- `docs/BUILD_STATUS.md` and ADR workflow.

### Exit

- Clean bootstrap from empty local state.
- Health checks pass.
- Production config rejects demo adapters/secrets missing.
- `pnpm verify` runs foundation checks.

## 3. Milestone 1 — Identity, onboarding, and profile

### Deliver

- API-owned LinkedIn OIDC port + deterministic local OIDC fixture.
- Web/mobile sessions and refresh rotation.
- Experienced/fresher path, resumable steps, contact verification mock.
- Profile, experience/education/projects/skills/targets/preferences/work authorisation.
- User web onboarding/home shell and mobile core onboarding shell.
- Audit/consent baseline.

### Exit

- AUTH/ONB P0 criteria pass.
- Cross-user/authorisation matrix starts.
- Missing LinkedIn email and interrupted onboarding demonstrated.

## 4. Milestone 2 — Secure resume/document and AI foundation

### Deliver

- Signed quarantine upload, scan/MIME/hash/promotion pipeline.
- PDF/DOCX deterministic text extraction and OCR/manual fallback port.
- Resume records/immutable versions/one-active invariant.
- AI gateway, route/prompt/schema/run data model.
- Mock AI adapter plus OpenAI/Anthropic disabled production adapters.
- Resume extraction review/source evidence UI.
- Admin AI provider/route/prompt/eval skeleton.

### Exit

- RES/AI P0 criteria pass.
- Unsafe file and hostile prompt fixtures pass.
- No real provider key required.

## 5. Milestone 3 — Job catalogue, URL import, and matching

### Deliver

- Job/source/snapshot/search/import models.
- Safe URL fetcher with SSRF/redirect/content controls.
- Schema.org/known mock ATS/bounded AI extraction chain.
- PostgreSQL FTS/trigram search, save/hide/deduplicate.
- Deterministic eligibility plus evidence-backed match explanation.
- Discover/import/job detail UX web/mobile.
- LinkedIn assisted-path guardrail.

### Exit

- JOB P0 criteria pass.
- No request to real LinkedIn in test/demo.
- Search/filter/deep-link states accessible/responsive.

## 6. Milestone 4 — Applications and connector engine

### Deliver

- Application snapshots/answers/events/evidence/state machine.
- Review/confirmation/consent UI.
- Domain policy, connector/version/run models and admin screens.
- Queues, outbox, worker leases, checkpoints, retry/uncertain logic.
- Mock connector with all success/pause/failure scenarios.
- Assisted/manual proof and tracker/timeline.
- Global/domain/version kill switches.

### Exit

- APP/TRK P0 criteria pass.
- Duplicate/uncertain/kill-switch tests prove no repeated side effect.
- Full first mock application without billing works against free quota stub, ready for ledger integration.

## 7. Milestone 5 — Billing, entitlement, and quota

### Deliver

- Products/plans/immutable versions/provider mappings.
- Mock/Stripe/Razorpay billing ports.
- Canonical subscription and append-only quota ledger.
- Checkout/change preview/confirm/cancel/reactivate.
- Raw webhook verification ports, idempotency, reconciliation.
- Plan/billing UX and admin finance operations/reports.
- Property/concurrency tests.

### Exit

- BILL P0 criteria pass.
- 50 -> 100 proration/quota demo and failed-payment rollback pass.
- No quota granted from client redirect.

## 8. Milestone 6 — Admin, support, reports, privacy

### Deliver

- Separate admin identity and RBAC/permission matrix.
- Overview/customer/application/billing/connector/AI/report pages.
- JIT support access, cases, quota adjustments, refund workflow mock.
- Audit/security event explorer.
- Notification centre/email/push mocks.
- Data export/deletion state machines and retention jobs.

### Exit

- ADM/PRIV P0/P1 criteria targeted for beta pass.
- Private content masked, secret unreadable, every privileged action audited.
- Seeded reports reconcile to source fixtures.

## 9. Milestone 7 — Mobile completeness

### Deliver

- Native shells/navigation/design tokens.
- Auth callback/session, onboarding, resume management/upload, discover/job detail, review/action-required, tracker, quota/plan, notifications/profile/settings.
- Deep links, push mock, offline/stale states, accessibility/large text.

### Exit

- Mobile P0 Maestro/manual flows pass on Android; iOS where build environment permits.
- Web/native domain status/copy/schema parity tests pass.

## 10. Milestone 8 — Hardening and demo handoff

### Deliver

- Full acceptance traceability and regression suite.
- Accessibility/visual/performance/security checks.
- E2E demo reset/seed/smoke.
- Backups/restore/reference deployment/runbooks.
- OpenAPI/client and architecture/docs updated.
- `docs/DEMO_RESULTS.md` with commands/evidence/limitations.

### Exit

- Every P0 is passing or a clearly approved blocker; demo cannot claim completion otherwise.
- `pnpm verify`, production builds, and manual demo runbook pass.
- No real credentials/data/side effects.

## 11. Controlled beta after demo

1. Select one licensed discovery source and one contracted/supported application connector.
2. Complete contract/legal/data-flow/retention review.
3. Implement against sandbox/official fixtures.
4. Security and provider certification/testing.
5. Internal users only.
6. Canary with strict volume and confirm-each mode.
7. Monitor accuracy, user-action, uncertain, duplicate, support, and provider/site feedback.
8. Promote or revert to assisted.

LinkedIn stays assisted until written partner/API authorisation explicitly supports desired functionality.

## 12. Team and effort model

For a real production beta, recommended ownership:

- 1 technical/product lead.
- 1–2 senior full-stack/backend engineers.
- 1 frontend/web engineer.
- 1 React Native engineer (may overlap after web foundation).
- 1 QA automation engineer.
- Part-time product designer/research, DevOps/SRE, security/privacy/legal, finance/payment operations.

Rough engineering scale—not a calendar promise:

- Credential-free production-shaped demo: approximately 18–30 engineer-weeks depending on reuse and fidelity.
- First controlled beta with one discovery and one application provider: additional 12–24 engineer-weeks plus unpredictable partner/legal lead time.
- Production hardening, broader connectors, app-store release, security/compliance: additional 12–24 engineer-weeks.

Cursor can compress implementation work but cannot eliminate provider approval, real-device QA, security review, or product/legal decisions.

## 13. Release and branching

- Trunk-based or short-lived feature branches.
- Protected main; checks required.
- Preview per PR where affordable.
- Database expand/migrate/contract.
- Feature flags for providers/capabilities/UI release.
- Staging uses test providers; production has separate secrets/resources.
- Connector/AI/policy/plan versions deploy independently as data but publish through audited workflows.

## 14. Rollback

- Code/image rollback for stateless services.
- Forward-fix migrations; never destructive down migration in production without backup/plan.
- Kill switch for AI/provider/connector/domain/capability/payment change.
- Roll back connector/route/prompt to last published version.
- Preserve queued drafts; verify uncertain side effects before retry.
- Reconcile payment/quota after incident with compensating entries.

## 15. Production dependencies that Cursor must mark TODO

- Final brand, domain, legal entity, pricing/tax/refund policy.
- LinkedIn developer credentials/approval and any partner contract.
- Licensed job discovery and ATS/application contracts.
- Stripe/Razorpay merchant/test/production products and webhook endpoints.
- OpenAI/Anthropic production projects, data policy, models, spend limits.
- Email/SMS/push/domain reputation and app-store accounts.
- Cloud region/vendor, KMS/secret manager, monitoring/on-call.
- Legal/privacy/accessibility/security/penetration review.

These do not block mock demo completion.
