# Admin Panel Product and Technical Specification

## 1. Purpose

The admin panel is the operating system for customers, plans, money, quota, connectors, AI, support, reports, privacy, and security. It is not a thin CRUD layer over tables. All actions call audited domain commands and respect least privilege.

## 2. Roles and permissions

Seed roles are composable permission bundles, not hard-coded UI checks.

| Role | Typical access |
| --- | --- |
| `SUPER_ADMIN` | Role/config administration and emergency controls; not routinely used. |
| `SUPPORT` | Customer metadata, cases, safe application status, positive quota adjustments within limit. |
| `SUPPORT_LEAD` | Elevated customer actions, JIT content access approval, suspensions. |
| `FINANCE` | Plans, invoices, payments, refunds, reconciliation, revenue reports. |
| `OPS` | Connector health/runs, domain policies, queues, notifications, kill switches. |
| `AI_ADMIN` | AI providers, routes, prompts, evals, cost controls. |
| `PRIVACY` | Data exports/deletion/retention cases and access logs. |
| `SECURITY` | Sessions, incidents, risk/suspension, audit/security events. |
| `AUDITOR` | Read-only reports/audit with controlled exports. |

Sensitive actions require named permissions such as `refund.create`, `quota.adjust`, `connector.enable_submit`, `ai.secret.rotate`, `support.private_data_access`, `customer.suspend`, `audit.export`.

## 3. Authentication and assurance

- Separate admin identity/session from candidate app.
- MFA-ready; production requires MFA for privileged roles.
- Short idle/absolute expiry and fresh authentication for sensitive actions.
- Device/session list and immediate revocation.
- Optional IP/network policy without making it the sole control.
- Server checks role/permission/assurance for every request.
- High-value refund, global submit enable, or secret rotation can require dual control based on policy.

## 4. Navigation

- Overview
- Customers
- Applications
- Billing
  - Plans/products
  - Subscriptions
  - Payments/invoices
  - Refunds
  - Webhooks/reconciliation
- Operations
  - Connectors
  - Domain policies
  - Queue/dead letters
  - Notifications
- AI control centre
- Reports
- Support
- Privacy
- Audit & security
- Settings

Navigation items and route access derive from permissions. Hidden navigation is not an authorisation boundary.

## 5. Overview dashboard

### KPIs

- MRR, new/expansion/contraction/churned MRR.
- Active paid/free users and conversion.
- Payment failure/past-due count.
- Verified applications and active-user rate.
- Connector submission success/uncertain/user-action rates.
- AI cost and latency per task/application.
- Open support/privacy/security cases.
- Queue age/dead-letter and provider incidents.

Every KPI has definition, source, refresh time, comparison period, and currency treatment.

### Action queue

Prioritised, permission-aware cards:

- Payment reconciliation conflicts.
- Connector canary/failure threshold.
- Stuck/uncertain submissions.
- AI route cost/eval breach.
- Refund/privacy/support approvals.
- Expiring domain policy/legal review.

## 6. Customer operations

### List

Search by internal ID or exact verified email/phone with audited access. Filters: status, plan, billing state, onboarding, active resume, quota band, application activity, support/risk state, created date.

No fuzzy search over resumes or screening answers.

### Customer detail

Tabs:

- Summary and safe contact metadata.
- Profile completeness metadata (not content by default).
- Resumes/documents metadata.
- Applications/timeline.
- Subscription/payments/invoices/refunds.
- Quota projection and immutable ledger.
- Consents and automation domains.
- Notifications.
- Support cases/access grants.
- Sessions/security events.
- Audit.

### Actions

- Resend verification/security link.
- Add support note/case.
- Grant compensating quota with preview/reason/case.
- Suspend/unsuspend with scope and user notification.
- Start approved refund workflow.
- Start privacy export/deletion workflow.
- Grant time-limited private-data access.

Admin cannot edit a candidate's resume, work history, or application answer as if they were the user.

## 7. Just-in-time support access

Private resume content, job answers, and evidence are masked by default.

Access requires:

- Active support case.
- Exact data scope and purpose.
- Requested duration.
- Fresh authentication.
- Approver if role/policy requires.
- Persistent banner while access is active.
- Audit for grant, view, download, and revoke.
- Automatic expiry.

Downloads should be disabled unless specifically permitted. Analytics/logs never receive viewed content.

## 8. Applications operations

List by state, connector/domain/version, evidence level, age, retry/user-action reason, plan, and geography. Detail shows only operational metadata by default.

Actions:

- Cancel safe queued execution.
- Trigger verification for an uncertain attempt.
- Replay explicitly replayable non-side-effect job.
- Release expired reservation through domain command.
- Mark connector incident link.
- Return quota with reason after evidence.

Never provide an admin `force submitted` button without evidence and an exceptional audited reconciliation permission.

## 9. Plan/product management

### Plan editor

Draft fields:

- Stable plan/name/copy/order/visibility.
- Currency, recurring minor-unit price, interval.
- Successful-application quota and feature entitlements.
- Trial/referral/promotion compatibility.
- Stripe price ID and Razorpay plan ID per environment.
- Effective/retire dates.

Publishing validates mappings, currency/interval, quota, copy, and effective overlap. Published version is immutable.

### Change safety

- Preview affected new/existing subscriptions.
- Price change does not mutate existing provider prices.
- Retiring a plan prevents new purchase but preserves existing subscriptions until migration.
- Bulk migration is a separate approved workflow with dry run and customer communication.

## 10. Billing operations

### Subscription detail

Canonical and provider states, plan version, period, scheduled change/cancel, payment method summary, invoices, entitlement periods, reconciliation history.

### Payments/invoices/refunds

Search provider IDs, status, date, currency, plan, user. Show gross, tax, discounts, refunds, and provider fee only if reliably available.

Refund workflow includes maximum refundable amount, reason, related case, due quota decision as a separate step, confirmation, provider result, and audit.

### Webhooks/reconciliation

- Received/verified/processing/completed/failed/dead-letter.
- Payload remains redacted/masked.
- Reprocess only with idempotent handler and permission.
- Diff view for provider vs local canonical state.
- Correct through named reconciliation command; no table editor.

## 11. Connector operations

### Connector list

Version, target domain/source, status/rollout, capabilities, run volume, success, uncertain, user-action, errors, P95, last deploy/incident.

### Connector detail

- Metadata and release notes.
- Domain policies and exact allowed capabilities.
- API/selector/schema version.
- Contract fixture results.
- Canary cohort and thresholds.
- Run explorer with trace IDs and safe error categories.
- Health/alerts/incidents.
- Promote, degrade, rollback, disable, kill switch.

Promotion requires passing tests, active domain policy, approval reason, and typed confirmation when `SUBMIT` is enabled.

## 12. Domain policy management

Versioned editor fields from `SCOPE_GUARDRAILS.md`. Published policy immutable; new review creates new version.

Dashboard highlights:

- Expiring/expired reviews.
- Terms URL changed/fetch warning.
- Capabilities without matching healthy connector.
- Connector capabilities not covered by policy.
- Geography/consent mismatch.

Policy expiry automatically removes active capabilities according to safe fallback; it cannot silently extend itself.

## 13. AI control centre

### Providers

- OpenAI/Anthropic/mock metadata.
- Credential state/fingerprint, last rotation/test.
- Requests/tokens/cost/latency/error/refusal.
- Provider disable/kill switch.

Secret write flow is write-only. Never reveal/export a configured key.

### Task routes

Task -> environment -> provider/model -> prompt/schema -> fallback -> timeout/retries -> token/cost limits -> status.

Draft/publish/rollback model with immutable versions. Publishing blocked when required evals fail or provider secret/health is invalid.

### Prompts/evals

Version diff, fixtures, expected assertions, regression comparison, cost/latency. Evaluation data must be fictitious or specifically approved/redacted.

### Run explorer

Search by run/task/status/model/time/correlation. Show hashes, token/cost/latency, refusal/error, schema outcome, and resource IDs. Do not show raw resume/job/answer content by default.

## 14. Reports

### Commercial

- MRR movement, subscriptions, conversion, churn/reactivation.
- Gross/tax/refund/net by original currency/provider.
- Plan/quota utilisation and upgrade/downgrade.

### Product

- Activation funnel and time to first application.
- Matches saved/prepared/submitted.
- Outcomes entered by users.
- Fresher vs experienced flow only as user-selected onboarding segment.

### Operations

- Connector success/failure/action/uncertain and version cohorts.
- AI task accuracy proxy/corrections, cost, latency, failure.
- Queue/SLO and notification delivery.

### Support/trust

- Cases by reason/SLA.
- Quota reversals/adjustments/refunds.
- Data/privacy requests and access grants.
- User-reported inaccurate answers/duplicate submissions.

Large exports run asynchronously, are permission-checked at request and download, use short-lived signed files, and are audited.

## 15. Privacy operations

- Data export queue/status/identity verification/delivery/expiry.
- Deletion requests with billing cancellation, grace/recovery, retention exceptions, processor propagation, and completion proof.
- Consent history and revocation.
- Retention job status and legal hold where lawfully configured.
- Access report for private-data/JIT views.

Do not allow arbitrary “forget user” SQL or irreversible deletion without resolved dependencies and confirmation.

## 16. Audit and security

Searchable immutable audit fields:

- Actor/admin/service, effective role/permission.
- Action and target type/ID.
- Reason/case/approval.
- Safe before/after summary.
- Request/trace/session IDs and safe risk metadata.
- Outcome and timestamp.

Security page covers admin/customer session anomalies, refresh reuse, failed auth/rate limits, suspicious quota/referral behaviour, secret/config changes, global kill-switch history, and incidents.

## 17. UI safety

- Risky actions use a review page/dialog with impact, exact target, and typed confirmation where proportionate.
- Bulk actions show filtered/selected scope and affected count.
- No irreversible action from row overflow menu without confirmation.
- Preserve table filter/page context after details/action.
- Always show environment badge; production uses distinct visual indicator.
- Secrets and sensitive values are masked and excluded from copy/download.
- Permission/assurance errors state the required process, not merely `403`.

## 18. Admin acceptance baseline

- Every route has server-side permission tests.
- Every privileged mutation emits audit on success/failure.
- Published immutable resources cannot be edited.
- Direct balance/ledger/audit editing is impossible through UI/API.
- Private data remains masked without active scoped grant.
- Provider keys can be added/rotated/tested but never read back.
- Reports reconcile to seeded ledger/payment fixtures.
- Global and scoped kill switches stop new side effects immediately.
