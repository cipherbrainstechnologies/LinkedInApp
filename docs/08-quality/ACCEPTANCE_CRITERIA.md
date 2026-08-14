# Acceptance Criteria

Priority:

- `P0`: required for the autonomous demo and MVP foundation.
- `P1`: required before controlled public beta unless explicitly deferred in an ADR.
- `P2`: later enhancement.

Cursor must copy these IDs into `docs/BUILD_STATUS.md` and link each to implementation/tests.

## Authentication

### AUTH-01 — P0

Given a valid local OIDC fixture, when a new candidate completes the authorisation callback, then one user and one provider-subject identity are created and a secure session starts without storing a provider password.

### AUTH-02 — P0

Given an OIDC response with invalid state, nonce, issuer, audience, expiry, or signature, when callback validation runs, then authentication fails safely, no identity/session is created, and a redacted security event is recorded.

### AUTH-03 — P0

Given LinkedIn does not return email, when sign-in completes, then the user is asked to verify an email inside ApplyFlow and may resume onboarding afterward.

### AUTH-04 — P0

Given a mobile refresh token is used, when refresh succeeds, then the old token is unusable and a new token is stored; reuse revokes the family.

### AUTH-05 — P1

Given a user has multiple sessions, when one is revoked, then that device loses access without revoking other valid sessions.

## Onboarding and candidate profile

### ONB-01 — P0

Given an experienced candidate, when they upload/review a resume and complete required contact, targets, preferences, authorisation, and active resume steps, then onboarding completes and profile versions/sources are stored.

### ONB-02 — P0

Given a fresher selects the education-first path, when they provide education plus projects/skills and select multiple recommended/custom titles, then onboarding completes without requiring work experience.

### ONB-03 — P0

Given an AI-extracted field is unconfirmed, when onboarding completion is attempted, then any required field remains a named blocker and is not silently accepted.

### ONB-04 — P0

Given onboarding is interrupted, when the user returns on another device, then saved steps and entered server-backed data resume without restarting.

### ONB-05 — P1

Given a profile fact used by an active draft changes, when saved, then affected drafts are marked for revalidation while submitted snapshots remain unchanged.

### ONB-06 — P0

Given a sensitive/protected question, when no direct user answer exists, then the system never infers or preselects an answer.

## Resumes and documents

### RES-01 — P0

Given valid PDF/DOCX upload, when upload completes, then the file remains quarantined until MIME/magic/size/scan checks pass and only then is extraction queued.

### RES-02 — P0

Given unsafe/unsupported/oversized content, when scanned, then it is rejected, never used by AI/connector, and the user receives a safe manual/retry path.

### RES-03 — P0

Given a user has several resumes, when a different one is activated, then exactly one active resume exists after a transactional command, including concurrent attempts.

### RES-04 — P0

Given an application was submitted with resume version A, when the user activates or uploads version B, then the past application still references and can identify version A.

### RES-05 — P1

Given a resume is referenced by retained application evidence, when deletion is requested, then the system explains the retention/deletion result and never leaves an inaccessible broken snapshot.

## Jobs and match

### JOB-01 — P0

Given a safe supported mock job URL, when imported, then one normalised job is created with source, capture time, policy mode, and deduplication fingerprint.

### JOB-02 — P0

Given a LinkedIn URL, when imported without partner capability, then the result is assisted/trackable and no LinkedIn page/profile/search scraping or automated submission occurs.

### JOB-03 — P0

Given a URL resolving/redirecting to private, loopback, metadata, or unsafe destination, when imported, then the request is blocked before content is returned.

### JOB-04 — P0

Given duplicate source ID/URL or equivalent fingerprint, when imported again, then the existing canonical job is reused/updated by policy rather than creating uncontrolled duplicates.

### JOB-05 — P0

Given a hard eligibility blocker, when match is assessed, then the job is marked not eligible and application automation cannot proceed regardless of AI score.

### JOB-06 — P0

Given a match explanation, when shown, then strengths, gaps, unknowns, and eligibility evidence reference supplied candidate/job facts and the UI does not claim a guaranteed outcome.

### JOB-07 — P1

Given one discovery provider fails while another succeeds, when search returns, then available results render with a partial-source warning and filters/context are preserved.

## Application preparation and execution

### APP-01 — P0

Given an eligible job and complete profile, when a draft is created, then exact job/profile/resume/prompt/policy/connector versions are snapshotted.

### APP-02 — P0

Given a new/material screening answer, when preparation completes, then it remains `needs user confirmation` and cannot be submitted until confirmed.

### APP-03 — P0

Given an unknown required answer, when preparation runs, then the user is asked and no likely/default answer is invented.

### APP-04 — P0

Given a domain policy lacks `SUBMIT`, when the user prepares an application, then the product selects assisted/track-only mode and worker cannot perform final submit.

### APP-05 — P0

Given valid consent/policy/connector/quota and user confirmation, when submit is called twice with the same idempotency key/body, then one application operation and one reservation/result exist.

### APP-06 — P0

Given two attempts compete for the final quota unit, when submitted concurrently, then exactly one reserves and the other receives `QUOTA_EXHAUSTED`.

### APP-07 — P0

Given mock connector returns a receipt, when verified, then application becomes `SUBMITTED`, evidence/timeline are stored, reservation is consumed once, and the user is notified.

### APP-08 — P0

Given the connector encounters OTP/CAPTCHA/login/new consent/ambiguous question, when execution reaches it, then application becomes `WAITING_FOR_USER`, no bypass occurs, and exact safe next action is displayed.

### APP-09 — P0

Given a retryable failure before side effect, when retry policy runs, then it uses bounded backoff and no duplicate side effect/quota consumption occurs.

### APP-10 — P0

Given a timeout after possible submit, when result is unknown, then application becomes `SUBMISSION_UNCERTAIN`/checking and is verified before any retry.

### APP-11 — P0

Given final failure/cancel before confirmed submission, when processed, then reservation is released and no successful application unit is consumed.

### APP-12 — P0

Given the same user/job already has a confirmed application, when another ordinary submit is requested, then duplicate prevention blocks it and shows existing application.

### APP-13 — P1

Given a global/domain/version kill switch activates before side effect, when worker rechecks, then no new external submit occurs and the application receives a recoverable safe state.

### APP-14 — P1

Given a waiting-user reservation expires, when user resumes later, then the draft is preserved and prerequisites/quota are revalidated before a new reservation.

## Tracker

### TRK-01 — P0

Given multiple applications, when user searches/filters/sorts, then only their records appear, URL state is shareable on web, and opening/back preserves context.

### TRK-02 — P0

Given application detail, when displayed, then current status, next action, timeline, snapshot, resume version, answer source/status, and evidence level are understandable without raw provider payload.

### TRK-03 — P1

Given a user records interview/rejection/offer/withdrawal, when saved, then source/actor/time appear in timeline and original submission remains unchanged.

## Billing and quota

### BILL-01 — P0

Given a new free user, when entitlement activates, then exactly 5 units are granted for a clearly displayed period/reset time.

### BILL-02 — P0

Given a paid user with 20 consumed on a 50 plan, when a 100-plan upgrade is confirmed by mock provider, then usage remains 20 and available limit increases to 80 minus any active reservations; it does not reset to 100.

### BILL-03 — P0

Given an upgrade request, when previewed, then credit, remaining-period charge, tax, due now, next renewal, expiry, and resulting quota come from a server/provider quote and are shown before confirmation.

### BILL-04 — P0

Given payment redirect says success but webhook is pending, when user returns, then plan remains processing/old entitlement until verified; no paid quota is prematurely granted.

### BILL-05 — P0

Given upgrade payment fails, when processed, then old plan/quota remain and no partial plan state exists.

### BILL-06 — P0

Given duplicate/out-of-order payment webhooks, when processed, then signature/idempotency/reconciliation produce one canonical state and one entitlement change.

### BILL-07 — P0

Given a downgrade, when requested, then it is scheduled for period end and current quota is not reduced mid-period.

### BILL-08 — P0

Given a submission is proven false after consumption, when reversed, then an append-only compensating quota entry returns one unit; original ledger row is unchanged.

### BILL-09 — P1

Given an unpaid Stripe invoice or unsupported Razorpay update state/payment method, when upgrade is requested, then the system blocks/schedules/uses the reviewed safe provider path and does not grant unsupported credit.

### BILL-10 — P1

Given a monetary refund, when completed, then provider refund and immutable finance/audit record exist; quota change occurs only through a separate explicit decision.

## AI gateway

### AI-01 — P0

Given no real AI key, when demo runs, then deterministic mock tasks complete every P0 flow.

### AI-02 — P0

Given configured OpenAI or Anthropic adapter, when a task runs, then it uses the server-side secret, published route/prompt/schema, structured output, local validation, and stores safe usage/request metadata.

### AI-03 — P0

Given hostile instructions inside a resume/job, when extraction runs, then they are treated as data, do not trigger tools/actions, and output remains bounded to schema.

### AI-04 — P0

Given invalid/refused/unavailable AI output, when handling completes, then raw error is hidden, manual fallback remains, and no unconfirmed facts are written.

### AI-05 — P1

Given a route/prompt/model change fails required eval threshold, when admin attempts publish, then publication is blocked and current route remains active.

### AI-06 — P1

Given an admin stores an API key, when later viewing provider, then only status/fingerprint metadata is visible and plaintext can never be read back.

## Admin

### ADM-01 — P0

Given each seeded admin role, when routes/actions are requested, then server permissions allow only the documented capabilities regardless of hidden UI.

### ADM-02 — P0

Given support opens a customer, when no JIT grant exists, then resume/answer/private evidence content is masked and access attempts are denied/audited.

### ADM-03 — P0

Given support grants allowed quota, when confirmed, then a compensating ledger entry and audit event with reason/case exist; no balance row is directly edited.

### ADM-04 — P0

Given finance creates and publishes a plan version, when published, then it is immutable and only successor versions can change price/quota/mapping.

### ADM-05 — P0

Given ops disables a connector/domain/global submit capability, when saved, then in-flight workers recheck and no new side effect crosses the gate.

### ADM-06 — P0

Given AI admin creates/tests a provider secret and publishes a passing mock route, when used, then action is audited and the secret is never returned/logged.

### ADM-07 — P1

Given a JIT private-data access grant, when its scope/time expires, then access is automatically denied and all grant/view/revoke events remain auditable.

### ADM-08 — P1

Given a large report export, when requested, then it runs asynchronously, applies requester permission/scope at creation and download, expires, and is audited.

## Security, privacy, accessibility, reliability

### SEC-01 — P0

Given any user-owned resource ID belonging to another user, when requested through any user API, then no protected data is returned and the response does not leak unnecessary existence.

### SEC-02 — P0

Given logs/analytics/error events from P0 flows, when inspected by automated redaction tests, then secrets, tokens, contact data, resume/job text, and answers are absent.

### SEC-03 — P0

Given forged/replayed webhook or altered client price/amount, when processed, then it cannot change subscription, entitlement, refund, or quota.

### SEC-04 — P0

Given no production secrets/approvals, when demo starts, then only local providers/domains are reachable for side effects.

### PRIV-01 — P1

Given an authenticated user requests export, when completed, then an authorised short-lived package contains their supported data and is deleted after expiry.

### PRIV-02 — P1

Given a deletion request passes grace/retention checks, when completed, then sessions/automation are revoked and personal data is deleted/anonymised across stores/providers with completion evidence.

### A11Y-01 — P0

Given a keyboard-only user, when completing the core web onboarding/search/review/application flow, then every action is reachable, focus is visible/logical, errors are announced, and dialogs restore focus.

### A11Y-02 — P0

Given P0 screens at 320px/200% zoom/large text and reduced motion, when rendered, then content/actions remain usable without unintended horizontal scrolling or motion dependence.

### REL-01 — P0

Given API/worker restart after durable command/outbox, when services recover, then jobs resume idempotently and no confirmed state/ledger event is lost or duplicated.

### OBS-01 — P0

Given any P0 application/payment/AI/connector operation, when it runs, then trace/correlation/operation IDs connect safe logs, metrics, events, and admin diagnostics.

## Demo completion

### DEMO-01 — P0

Given a clean local machine with documented prerequisites, when the documented bootstrap, infrastructure, migration, seed, dev/build, verify, and demo-smoke commands run, then all required services become healthy and every P0 automated acceptance test passes without paid credentials.

### DEMO-02 — P0

Given the demo personas, when the manual demo runbook is followed, then experienced, fresher, supported mock submission, waiting action, quota upgrade, tracker search, and admin operations can be demonstrated end to end with deterministic data.
