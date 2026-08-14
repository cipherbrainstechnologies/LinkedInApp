# API Contracts and Domain Events

## 1. Contract rules

- Base path: `/v1`.
- JSON over HTTPS; uploads use signed object-storage intents, not large API multipart bodies where avoidable.
- OpenAPI is generated from code and committed; the TypeScript client is generated and checked for drift.
- Use ISO 8601 UTC timestamps and string UUIDs.
- Money fields use `{ amountMinor, currency }`.
- Never return database/Prisma entities directly.
- Runtime-validate request, response, webhook, event, AI, and connector data.
- Mutating requests accept `Idempotency-Key`; high-contention resources also use a version/`If-Match` contract.
- Errors use `application/problem+json` with stable code, trace ID, field errors, and safe detail.
- List endpoints use opaque cursor pagination unless specifically documented.

### Error example

```json
{
  "type": "https://docs.applyflow.example/problems/quota-exhausted",
  "title": "Application quota used",
  "status": 409,
  "code": "QUOTA_EXHAUSTED",
  "detail": "Your current period has no available application units.",
  "traceId": "01J...",
  "fieldErrors": [],
  "meta": {
    "resetAt": "2026-09-01T00:00:00Z"
  }
}
```

Do not place PII, provider payloads, secrets, or stack traces in error responses.

## 2. Authentication

| Method/path | Purpose |
| --- | --- |
| `GET /auth/linkedin/start` | Create OIDC state/nonce/PKCE and redirect. Supports web/mobile return intent allowlist. |
| `GET /auth/linkedin/callback` | Validate callback, link/create identity, establish safe session. |
| `POST /auth/email/start` | Optional magic-link/verification start with enumeration-safe response. |
| `POST /auth/email/verify` | Verify owned email token/code. |
| `POST /auth/token/refresh` | Rotate mobile refresh token; detect reuse. |
| `POST /auth/logout` | Revoke current session/token family. |
| `GET /sessions` | List safe device/session metadata. |
| `DELETE /sessions/{id}` | Revoke another session. |

Demo-only endpoints live behind a non-production build/runtime guard and never compile/enable in production.

## 3. Current user and onboarding

| Method/path | Purpose |
| --- | --- |
| `GET /me` | Identity, onboarding state, plan summary, permissions. |
| `PATCH /me/preferences` | Locale/time zone/notification preferences. |
| `GET /onboarding` | Resumable step state and blockers. |
| `PUT /onboarding/path` | Experienced/fresher path. |
| `PUT /onboarding/contact` | Contact draft/verified references. |
| `PUT /onboarding/targets` | Multiple role/location/work-mode targets. |
| `POST /onboarding/complete` | Server validates all completion invariants. |

`POST /onboarding/complete` returns stable blockers rather than a boolean-only failure.

## 4. Candidate profile

| Method/path | Purpose |
| --- | --- |
| `GET /profile` | Current user-confirmed profile with field source/confirmation metadata. |
| `PATCH /profile` | Versioned partial update; material draft conflicts returned. |
| `POST /profile/experiences` | Add experience. |
| `PATCH /profile/experiences/{id}` | Edit owned experience. |
| `DELETE /profile/experiences/{id}` | Remove when snapshot constraints permit. |
| Equivalent collections | Education, projects, certifications, skills, languages, work authorisations. |
| `GET/PUT /profile/targets` | Manage target titles/preferences. |
| `GET/POST/PATCH/DELETE /profile/saved-answers` | Manage confirmed reusable answers with sensitivity rules. |

Sensitive answer endpoints require fresh authentication and never echo masked values unless explicitly revealed through an authorised flow.

## 5. Resumes and documents

| Method/path | Purpose |
| --- | --- |
| `POST /documents/upload-intents` | Create short-lived quarantine upload intent for declared file. |
| `POST /documents/{id}/complete` | Confirm client upload; queues scan/extract. |
| `GET /documents/{id}/status` | Scan/extraction state. |
| `GET /resumes` | List resume records and immutable versions. |
| `POST /resumes` | Create resume from clean document. |
| `GET /resumes/{id}` | Resume metadata, versions, extraction review state. |
| `POST /resumes/{id}/versions` | Add new immutable version. |
| `POST /resumes/{id}/activate` | Atomic active-resume switch. |
| `PATCH /resumes/{id}` | Rename/archive. |
| `DELETE /resumes/{id}` | Deletion workflow with retention blockers. |
| `GET /resume-versions/{id}/extraction` | Proposed structured facts and source evidence. |
| `POST /resume-versions/{id}/review` | Accept/edit/reject extracted facts and create profile proposal. |
| `POST /documents/{id}/download-intent` | Short-lived authorised download. |

## 6. Jobs

| Method/path | Purpose |
| --- | --- |
| `GET /jobs` | Search licensed catalogue with cursor and URL-compatible filters. |
| `GET /jobs/{id}` | Normalised job, current snapshot, source/policy mode. |
| `POST /job-imports` | Import one user-provided URL. |
| `GET /job-imports/{id}` | Progress/result; may return one/multiple jobs or assisted state. |
| `POST /jobs/{id}/save` / `DELETE` | Save/unsave. |
| `POST /jobs/{id}/hide` / `DELETE` | Hide/unhide with optional reason. |
| `POST /jobs/{id}/report` | Flag stale/incorrect/unsafe content. |
| `GET /jobs/{id}/match` | Current match or queued assessment state. |
| `POST /jobs/{id}/match` | Recompute against specified profile/resume version. |

### Import request

```json
{
  "url": "https://careers.example.com/jobs/123",
  "intent": "SINGLE_JOB"
}
```

### Import result modes

- `EXTRACTED`
- `MULTIPLE_JOBS_FOUND`
- `ASSISTED_LINKEDIN`
- `AUTH_REQUIRED`
- `TRACKABLE_UNSUPPORTED`
- `BLOCKED_BY_POLICY`
- `UNSAFE_URL`
- `FAILED`

## 7. Applications

| Method/path | Purpose |
| --- | --- |
| `POST /applications` | Create draft from job snapshot, profile and active resume. |
| `GET /applications` | Search/filter tracker. |
| `GET /applications/{id}` | Detail, immutable snapshot, answer status, timeline, evidence. |
| `PATCH /applications/{id}/draft` | Update application-only draft values under version control. |
| `POST /applications/{id}/prepare` | Generate/validate required answer set and submission mode. |
| `POST /applications/{id}/confirm` | Confirm material values/consent; transition to ready. |
| `POST /applications/{id}/submit` | Reserve quota and queue idempotent execution. |
| `POST /applications/{id}/resume` | Resume after user completes external action; revalidate. |
| `POST /applications/{id}/cancel` | Cancel where current state permits. |
| `POST /applications/{id}/manual-proof` | User records allowed receipt/evidence for assisted/manual flow. |
| `POST /applications/{id}/outcome` | Record interview/rejection/offer/withdrawn with source. |
| `POST /applications/{id}/notes` | Add user note/follow-up. |
| `GET /applications/export` | Async CSV export request/status. |

### Submit request

Headers include `Idempotency-Key` and current application version.

```json
{
  "mode": "CONFIRM_EACH",
  "consentId": "01J...",
  "acknowledgedSnapshotHash": "sha256:..."
}
```

### Submit response

```json
{
  "applicationId": "01J...",
  "state": "QUEUED",
  "quota": {
    "reserved": 1,
    "remainingAfterReservation": 14,
    "periodEndsAt": "2026-09-10T08:30:00Z"
  },
  "pollAfterMs": 2000
}
```

Use server-sent events or bounded polling for progress; do not require WebSockets for MVP.

## 8. Plans, subscriptions, and quota

| Method/path | Purpose |
| --- | --- |
| `GET /plans` | Public/current-user eligible published plan versions. |
| `GET /subscription` | Canonical subscription, scheduled change, payment status. |
| `GET /quota` | Limit, granted, reserved, consumed, reversed, available, period. |
| `POST /billing/checkout` | Create provider checkout/subscription intent. |
| `POST /billing/change-preview` | Authoritative provider/local preview. |
| `POST /billing/change-confirm` | Confirm preview and initiate change. |
| `POST /billing/cancel` | Cancel at period end by default. |
| `POST /billing/reactivate` | Remove eligible scheduled cancellation. |
| `GET /billing/invoices` | Safe invoice/receipt list. |
| `POST /billing/portal` | Optional provider portal session where supported. |
| `POST /webhooks/stripe` | Raw-body verified Stripe events. |
| `POST /webhooks/razorpay` | Raw-body verified Razorpay events. |

### Change preview response

```json
{
  "quoteId": "01J...",
  "expiresAt": "2026-08-14T11:10:00Z",
  "currency": "INR",
  "creditMinor": 15900,
  "chargeMinor": 26600,
  "taxMinor": 1926,
  "dueNowMinor": 12626,
  "nextRenewalMinor": 49900,
  "nextRenewalAt": "2026-09-01T00:00:00Z",
  "newQuotaLimit": 100,
  "used": 20,
  "availableAfterChange": 80,
  "provider": "RAZORPAY",
  "status": "REQUIRES_CONFIRMATION"
}
```

Values are examples only. The server/provider owns calculation.

## 9. Notifications and privacy

| Method/path | Purpose |
| --- | --- |
| `GET /notifications` | Cursor list; safe previews only. |
| `POST /notifications/{id}/read` | Mark read idempotently. |
| `POST /devices/push-tokens` | Register/revoke token with platform. |
| `POST /privacy/exports` | Start user data export. |
| `GET /privacy/exports/{id}` | Status/short-lived download. |
| `POST /privacy/deletion-requests` | Start deletion workflow. |
| `POST /privacy/deletion-requests/{id}/cancel` | Cancel within allowed window. |

## 10. Admin APIs

All under `/v1/admin`, separate admin auth and permission checks.

### Overview/reports

- `GET /overview`
- `POST /reports/queries`
- `POST /reports/exports`
- `GET /reports/exports/{id}`

### Customers/support

- `GET /customers`, `GET /customers/{id}`
- `POST /customers/{id}/suspend`, `/unsuspend`
- `POST /customers/{id}/quota-adjustments`
- `POST /support-access-grants`, `DELETE /support-access-grants/{id}`
- `GET/POST/PATCH /support-cases`

### Plans/billing

- CRUD drafts for plans; `POST /plans/{id}/versions`, `POST /plan-versions/{id}/publish`
- `GET /payments`, `/invoices`, `/refunds`, `/webhook-events`, `/reconciliation`
- `POST /refunds` with provider command and dual-control threshold where configured.

### Connectors/policy

- `GET /domain-policies`, `POST /domain-policies/{id}/versions`, publish/disable/kill switch.
- `GET /connectors`, `POST /connector-versions/{id}/canary|promote|rollback|disable`.
- `GET /connector-runs`, safe replay only for explicitly replayable steps.

### AI

- Provider metadata and write-only credential create/rotate/test.
- Task route draft/publish/disable.
- Prompt version create/evaluate/publish/rollback.
- Eval cases/results, run metrics, cost/latency, kill switch.

### Audit/security

- `GET /audit-events`, `/security-events`, `/sessions`, `/admin-users`, `/roles` according to permission.

## 11. Stable error codes

Minimum catalogue:

- `AUTH_REQUIRED`, `AUTH_ASSURANCE_REQUIRED`, `FORBIDDEN`, `SESSION_REVOKED`
- `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `RATE_LIMITED`
- `ONBOARDING_INCOMPLETE`, `PROFILE_FACT_UNCONFIRMED`, `ACTIVE_RESUME_REQUIRED`
- `DOCUMENT_UNSAFE`, `DOCUMENT_UNSUPPORTED`, `EXTRACTION_FAILED`
- `JOB_EXPIRED`, `JOB_NOT_ELIGIBLE`, `JOB_DUPLICATE`, `SOURCE_UNAVAILABLE`
- `DOMAIN_POLICY_BLOCKED`, `CONNECTOR_DEGRADED`, `USER_ACTION_REQUIRED`
- `APPLICATION_DUPLICATE`, `APPLICATION_STATE_CONFLICT`, `SUBMISSION_UNCERTAIN`
- `QUOTA_EXHAUSTED`, `QUOTA_RESERVATION_EXPIRED`
- `PAYMENT_REQUIRED`, `PAYMENT_PENDING`, `PAYMENT_FAILED`, `QUOTE_EXPIRED`
- `PROVIDER_UNAVAILABLE`, `AI_REFUSED`, `AI_OUTPUT_INVALID`, `COST_LIMIT_EXCEEDED`
- `EXPORT_NOT_READY`, `DELETION_BLOCKED_BY_RETENTION`

## 12. Domain event catalogue

Events have `eventId`, `eventType`, `eventVersion`, `occurredAt`, `aggregateType`, `aggregateId`, `correlationId`, `causationId`, and minimal safe payload.

### Identity/profile

- `UserRegistered.v1`
- `EmailVerified.v1`
- `SessionReuseDetected.v1`
- `OnboardingCompleted.v1`
- `CandidateProfileUpdated.v1`
- `JobTargetsUpdated.v1`

### Documents/resumes

- `DocumentUploaded.v1`
- `DocumentScanCompleted.v1`
- `ResumeExtractionRequested.v1`
- `ResumeExtractionCompleted.v1`
- `ResumeActivated.v1`

### Jobs/applications

- `JobImported.v1`
- `MatchAssessmentRequested.v1`
- `ApplicationCreated.v1`
- `ApplicationReady.v1`
- `ApplicationSubmissionRequested.v1`
- `ApplicationWaitingForUser.v1`
- `ApplicationSubmitted.v1`
- `ApplicationSubmissionFailed.v1`
- `ApplicationOutcomeRecorded.v1`

### Billing/quota

- `CheckoutCreated.v1`
- `SubscriptionActivated.v1`
- `SubscriptionChangeScheduled.v1`
- `SubscriptionPlanChanged.v1`
- `SubscriptionPastDue.v1`
- `SubscriptionCanceled.v1`
- `QuotaReserved.v1`
- `QuotaConsumed.v1`
- `QuotaReleased.v1`
- `QuotaReversed.v1`
- `RefundCompleted.v1`

### Operations

- `DomainPolicyPublished.v1`
- `ConnectorVersionPromoted.v1`
- `ConnectorKillSwitchChanged.v1`
- `AITaskRoutePublished.v1`
- `AIProviderDisabled.v1`
- `SupportAccessGranted.v1`
- `CustomerSuspended.v1`

## 13. Webhook rules

- Preserve raw bytes for signature verification before JSON parsing.
- Deduplicate on provider event ID.
- Return success only after durable receipt; process asynchronously.
- Do not assume event order.
- Fetch/reconcile provider resource when event data is insufficient or stale.
- Store payload hash and encrypted/retention-limited body only if needed.
- Log provider request/event ID, never signature/secret.
- Replay uses existing event record and idempotent handlers.
