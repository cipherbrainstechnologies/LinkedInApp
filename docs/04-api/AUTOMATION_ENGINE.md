# Policy-Aware Application Automation Engine

## 1. Goal

Prepare and, where explicitly permitted, submit a truthful job application through a reliable, auditable workflow. The engine is not a general-purpose autonomous browser and cannot choose to expand its own permissions.

## 2. Connector contract

```ts
type ConnectorCapability =
  | "DISCOVER"
  | "IMPORT_PUBLIC_JOB"
  | "EXTRACT_PUBLIC_JOB"
  | "PREFILL"
  | "CREATE_ACCOUNT"
  | "UPLOAD_RESUME"
  | "ANSWER_SCREENING"
  | "SUBMIT"
  | "VERIFY"
  | "STATUS_SYNC";

interface ApplicationConnector {
  readonly metadata: ConnectorMetadata;
  probe(input: ProbeInput, ctx: ConnectorContext): Promise<ProbeResult>;
  prepare(input: PrepareInput, ctx: ConnectorContext): Promise<PrepareResult>;
  submit(input: SubmitInput, ctx: ConnectorContext): Promise<SubmitResult>;
  verify(input: VerifyInput, ctx: ConnectorContext): Promise<VerifyResult>;
  healthCheck(): Promise<ConnectorHealth>;
}
```

Results are discriminated unions. No connector throws an unclassified raw provider error across the boundary.

```ts
type SubmitResult =
  | { kind: "SUBMITTED"; receipt: SubmissionReceipt }
  | { kind: "USER_ACTION_REQUIRED"; action: UserActionDescriptor }
  | { kind: "RETRYABLE_FAILURE"; code: string; retryAfterMs?: number }
  | { kind: "FINAL_FAILURE"; code: string; safeDetail: string }
  | { kind: "SUBMISSION_UNCERTAIN"; verificationRef: string };
```

## 3. Decision gate

Before preparation and again immediately before side effect, evaluate:

```text
global kill switch is off
AND user/account is active
AND application is in allowed state/version
AND job is not expired/blocked
AND no hard eligibility blocker exists
AND required candidate facts are confirmed
AND exact resume/profile/job snapshots exist
AND quota reservation is valid
AND user consent covers domain + capability + mode + version
AND domain policy is enabled, unexpired, and allows capability/mode/geography
AND connector version is enabled/healthy/canary-eligible
AND rate/concurrency limits allow execution
AND no duplicate submission/evidence exists
```

Any false predicate produces an explicit safe state; it never gets “worked around.”

## 4. Orchestration steps

1. Create draft and immutable preparation inputs.
2. Classify exact connector/mode from source and effective domain policy.
3. Probe job/application state with no side effect.
4. Build required field/question plan.
5. Resolve confirmed facts; generate drafts for review; mark unknown/sensitive.
6. User confirms answers and consent.
7. Reserve one quota unit and enqueue operation key.
8. Worker leases job, rechecks gates, and records `SIDE_EFFECT_PENDING`.
9. Connector fills/creates account/submits only allowed steps.
10. On OTP/CAPTCHA/login/new terms/unknown: persist `WAITING_FOR_USER` with resumable checkpoint.
11. On provider submit response, verify receipt/status when supported.
12. Persist evidence, consume quota, emit event, notify user.
13. On final failure/cancel, release reservation; on uncertain result, verify before retry.

## 5. Idempotency and uncertain submission

Submission is the highest-risk retry point.

- Generate a stable operation key from application ID + attempt generation.
- Persist key before external submit.
- Pass provider idempotency key when supported.
- After timeout/network loss, do not immediately submit again.
- Query provider, inspect safe receipt state, or enter `SUBMISSION_UNCERTAIN`.
- Only a verification policy can authorise retry.
- A receipt/evidence fingerprint prevents duplicate consumption and submission.

## 6. Question resolution

Resolution priority:

1. Application-only user-confirmed answer.
2. Domain-scoped user-confirmed saved answer still valid.
3. Candidate profile fact suitable for question.
4. AI draft using only confirmed fact references.
5. Ask user.

Always ask user for:

- Sensitive/protected data.
- Voluntary demographic self-identification.
- Unknown work authorisation/sponsorship.
- Legal attestations, background declarations, or certification of truth.
- Salary/history where law/policy or user preference demands caution.
- Free-text question requiring opinion/motivation if no approved draft exists.
- Any answer with conflicting sources.

## 7. External account creation

Possible outcomes:

- Existing authorised OAuth/session -> continue.
- Provider supports magic link -> trigger, pause for user verification if required.
- Provider requires user-created password -> open secure external flow and pause.
- Account may already exist -> do not create another; ask user to sign in/recover externally.
- Terms/privacy changed -> show links/copy, request new consent, pause.

No password generation/storage, cookie copying, or credential capture.

## 8. Browser execution

Browser adapter is allowed only for domain policies that explicitly permit it.

- Playwright with a fresh isolated context.
- Strict domain/redirect/egress allowlist.
- Page/action timeout and bounded navigation count.
- Stable semantic selectors preferred; selector version pinned.
- Detect form/page version mismatch and fail safely.
- File upload only from authorised immutable resume path.
- Do not inject stealth, evade fingerprinting, solve CAPTCHA, or hide automation.
- Do not scrape unrelated page data.
- Evidence screenshot crops/redacts where feasible and has short retention.

## 9. API connector execution

Preferred over browser where an authorised official API exists.

- Provider schema/version pinned.
- Least-privilege auth and endpoint allowlist.
- Idempotency header/key.
- Provider request/receipt ID stored.
- Rate limits respected; no bypass through multiple keys.
- Contract tests from sandbox/fixtures.

## 10. Queue design

Queues:

- `document.scan`
- `document.extract`
- `ai.task`
- `job.import`
- `match.assess`
- `application.prepare`
- `application.submit`
- `application.verify`
- `application.status-sync`
- `billing.webhook`
- `billing.reconcile`
- `notification.deliver`
- `privacy.export`
- `privacy.delete`

Each job contains IDs and version references, not full resume/job/answer payloads. Worker reloads authorised data.

## 11. Retry policy

| Failure | Retry? | Behaviour |
| --- | --- | --- |
| Network timeout before side effect | Yes, bounded | Backoff/jitter. |
| Timeout after possible submit | Not until verified | `SUBMISSION_UNCERTAIN`. |
| 429/provider capacity | Yes | Respect `Retry-After`, circuit breaker. |
| 5xx transient | Yes, bounded | Backoff and alert threshold. |
| Invalid candidate answer | No | Return to review. |
| Selector/schema mismatch | No automatic submit retry | Degrade connector; alert/canary stop. |
| CAPTCHA/OTP/login | No | `WAITING_FOR_USER`. |
| Policy/consent expired | No | Assisted or re-consent. |
| Job expired/duplicate | No | Final safe result; release quota. |
| Kill switch | No | Cancel/requeue according to operator choice without side effect. |

## 12. Checkpoint/resume

Checkpoint stores only safe connector step ID, page/provider reference, field completion map, expiry, and encrypted session reference where a documented user-controlled session is allowed. It never stores a password/OTP.

On resume:

- Verify user/session and action completed.
- Re-probe provider state.
- Revalidate job, application version, consent, policy, connector, and quota.
- Resume from the earliest provably safe step, not blindly from last UI action.

## 13. Quota interaction

- Reserve on queueing a ready application.
- Failed preparation before external side effect releases immediately.
- Waiting-for-user holds reservation for a configurable short window; then releases while preserving draft.
- Confirmed submitted consumes reservation.
- Uncertain holds until verification timeout; operator/user sees pending, not charged twice.
- Proven false positive creates `REVERSE`, never edits ledger.
- Assisted/manual application consumes only when acceptable proof/user confirmation rule is met.

## 14. Connector health and rollout

Metrics by connector version/domain:

- Probe/prepare/submit/verify counts and success.
- User-action rate by reason.
- Retry/final/uncertain rate.
- P50/P95 duration.
- Selector/schema mismatch.
- Duplicate prevention.
- Evidence completeness.
- Support complaints.

Rollout states:

`DISABLED -> INTERNAL -> CANARY -> ACTIVE -> DEGRADED -> DISABLED/ROLLED_BACK`.

Automatically stop canary/promote-to-degraded on configured error/duplicate/uncertain thresholds.

## 15. Mock connector for autonomous demo

`apps/mock-providers` exposes fictitious ATS domains and deterministic scenarios:

- Supported simple form -> receipt success.
- Existing external account.
- Account creation with magic-link pause.
- OTP pause.
- CAPTCHA pause.
- Sensitive question pause.
- Job expired.
- Duplicate application.
- Rate limit then success.
- Timeout before submit.
- Timeout after submit with later verify success.
- Schema/selector change final failure.

The mock connector implements the same port and writes signed-looking but clearly test-only receipts. Tests assert no real domains are contacted.

## 16. Operational runbook

### Sudden connector failure

1. Auto-degrade/kill affected version.
2. Stop new side effects; keep user drafts.
3. Classify in-flight state; verify uncertain attempts.
4. Release quota for final failures.
5. Roll back connector or change mode to assisted.
6. Notify affected users with accurate status.
7. Add regression fixture/test before re-enable.

### Suspected duplicate submissions

1. Global/domain submit kill switch.
2. Preserve logs/evidence under incident retention.
3. Reconcile operation/receipt fingerprints.
4. Return quota where appropriate.
5. Notify and support affected users.
6. Root-cause idempotency/verification gap; require canary before reactivation.

### Site terms/policy concern

1. Disable affected capabilities immediately.
2. Fall back to assisted/track-only.
3. Record policy review incident and owner.
4. Do not re-enable solely because the connector technically works.
