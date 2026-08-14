# Architecture Decision Records

This file contains initial accepted decisions. Cursor appends dated ADRs for material implementation deviations; it does not rewrite accepted decisions merely to fit a library.

## ADR-001 — LinkedIn is sign-in and assisted application by default

**Status:** Accepted  
**Context:** Product asks to scrape a member profile and auto-search/apply on LinkedIn. Standard LinkedIn OIDC returns lite identity data, while LinkedIn's User Agreement prohibits unauthorised scraping/bots.  
**Options:** Browser scraping/bot; OIDC + partner API; OIDC + candidate-provided resume/export and assisted flow.  
**Decision:** Use OIDC for sign-in. Build profile from resume/manual/user-uploaded LinkedIn export. Keep LinkedIn application assisted unless written partner/API approval exists.  
**Consequences:** Safer accounts/business; less “fully automatic” LinkedIn marketing. Connector architecture leaves an approved future adapter seam.  
**Validation:** Network tests ensure demo/production-default has no LinkedIn scraping/submission path.

## ADR-002 — Modular monolith plus worker

**Status:** Accepted  
**Context:** Many domains exist, but initial team/volume does not justify microservices. Asynchronous connectors/payments/AI do require isolation/retries.  
**Decision:** One modular API, separate general worker and browser-worker deployments, shared framework-free domain packages.  
**Consequences:** Lower delivery/operations cost; boundaries must be enforced in code. Browser-worker is first extraction candidate at scale.  
**Validation:** Dependency checks and module-owned repositories/ports.

## ADR-003 — TypeScript monorepo with separate web/admin/mobile apps

**Status:** Accepted  
**Decision:** pnpm/Turborepo; Next.js user web; separate Next.js admin; Expo React Native mobile; shared schemas/domain/tokens/copy, separate web/native component implementations.  
**Why:** Strong contracts and reuse without forcing DOM abstractions into native. Admin separation reduces user bundle and strengthens release/security boundary.  
**Validation:** Package exports/import-boundary tests and cross-platform schema fixtures.

## ADR-004 — PostgreSQL is authoritative; Redis is disposable

**Status:** Accepted  
**Decision:** All user, application, policy, subscription, ledger, audit, and outbox truth lives in PostgreSQL. Redis coordinates jobs/rate/cache only.  
**Consequences:** Worker recovery/rebuild must work from database; no business state solely in queue/cache.  
**Validation:** Restart/Redis-loss tests and outbox replay.

## ADR-005 — Append-only quota ledger

**Status:** Accepted  
**Decision:** Grants/reservations/releases/consumption/reversals/expiry/adjustments are immutable idempotent entries with transactional projection.  
**Why:** Auditability, concurrency safety, support reconciliation, no silent balance edits.  
**Validation:** Property and last-unit concurrency tests.

## ADR-006 — One billing provider owns a subscription lifecycle

**Status:** Accepted  
**Decision:** Stripe or Razorpay owns a subscription. Ordinary upgrades do not switch providers. Provider migration is explicit cancel/entitlement/new-subscription state machine.  
**Why:** Avoid double charge, incompatible prorations, webhook ambiguity.  
**Validation:** Provider ownership constraint and migration-only test.

## ADR-007 — Provider proration preview is authoritative

**Status:** Accepted  
**Decision:** Show stored short-lived provider-backed quote; internal formula is cross-check/test only. Grant quota after verified payment/subscription event.  
**Consequences:** Pending UI is first-class; provider/payment-method restrictions may require cycle-end change.  
**Validation:** Delayed/failed/duplicate webhook tests.

## ADR-008 — Admin-owned task-based AI gateway

**Status:** Accepted  
**Decision:** Users do not supply keys/models/prompts. Admin publishes task route/prompt/schema; clients request product tasks. Use native OpenAI Responses and native Anthropic Messages/Structured Outputs adapters plus local validation.  
**Why:** Security, cost control, audit, eval/rollback, consistent UX.  
**Validation:** Secret unreadability, schema/refusal/fallback/eval gates.

## ADR-009 — AI cannot decide side effects or authoritative facts

**Status:** Accepted  
**Decision:** AI extracts/drafts/advises. Deterministic code owns eligibility blockers, permissions, consent, payments, quotas, connector capabilities, transitions. Candidate confirms material facts/answers.  
**Validation:** AI output cannot call commands; hostile prompt and fabrication suites.

## ADR-010 — Default-deny domain capability policy

**Status:** Accepted  
**Decision:** Every external site action requires active versioned policy + capability + mode + geography + consent + connector health. Expiry/uncertainty falls back to assisted/track-only.  
**Why:** Terms and site capabilities differ and change.  
**Validation:** Pre-side-effect gate and kill-switch tests.

## ADR-011 — No third-party passwords; user action is a real state

**Status:** Accepted  
**Decision:** OAuth/magic-link/user-controlled browser only. Password/OTP/CAPTCHA/new terms pause as `WAITING_FOR_USER`; never bypass.  
**Validation:** Mock account/OTP/CAPTCHA flows and database/log secret scan.

## ADR-012 — Immutable submission snapshots

**Status:** Accepted  
**Decision:** Application references exact job/profile/resume/answer/prompt/policy/connector versions. Future profile/resume changes do not rewrite history.  
**Why:** Truth, debugging, evidence, support.  
**Validation:** Snapshot mutation/regression tests.

## ADR-013 — Credential-free mock providers are first-class

**Status:** Accepted  
**Decision:** Local OIDC, job/ATS, AI, billing, email/push providers implement the same ports and all critical failure scenarios. Production rejects mock adapters.  
**Why:** Cursor/local CI can finish and prove the product without secrets or real side effects.  
**Validation:** Egress assertion and production configuration fail-fast.

## ADR-014 — PostgreSQL search before separate search service

**Status:** Accepted  
**Decision:** Full-text search + trigram indexes for MVP. Extract a search service only when volume/relevance/latency measurements justify it.  
**Validation:** Representative volume/query performance test.

## ADR template

```markdown
## ADR-NNN — Title

**Status:** Proposed | Accepted | Superseded
**Date:** YYYY-MM-DD
**Context:**
**Options considered:**
**Decision:**
**Why:**
**Consequences:**
**Validation:**
**Supersedes / superseded by:**
```
