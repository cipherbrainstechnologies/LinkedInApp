# Scope, Policy, and Automation Guardrails

## 1. Why this document exists

Job sites do not expose one universal automation contract. A technically possible browser action may still be prohibited by the site's terms, unsafe for the user's account, or unreliable. ApplyFlow therefore grants automation capability per domain and connector version instead of treating the browser as an unrestricted robot.

## 2. LinkedIn decision

### Allowed without a separate partner agreement

- Sign in with LinkedIn OpenID Connect.
- Receive the lite OIDC claims granted by the user: subject identifier, name, picture, locale, and optional email.
- Accept a LinkedIn job URL pasted by the user and store it as a user-provided reference.
- Open a LinkedIn job/application page for the user.
- Generate a private application checklist or truthful draft from candidate-provided information.
- Let the user manually record and track an application.
- Accept a user-downloaded LinkedIn data export or profile PDF as an upload.

### Disabled by default

- Scraping a LinkedIn profile, work history, job search result, or application page.
- Using a browser extension/overlay to extract or alter LinkedIn pages.
- Automated LinkedIn search, Easy Apply, submit, messaging, connection, or engagement.
- Reusing cookies, copying sessions, or collecting LinkedIn passwords.

These capabilities remain disabled unless written LinkedIn authorisation and an approved API/partner product explicitly cover them. Admin configuration cannot override this legal dependency by itself.

## 3. Capability model

Every domain policy exposes a subset of:

| Capability | Meaning |
| --- | --- |
| `DISCOVER` | Search/list jobs through a licensed or explicitly allowed source. |
| `IMPORT_PUBLIC_JOB` | Read a user-supplied public job URL. |
| `EXTRACT_PUBLIC_JOB` | Normalise public job content. |
| `PREFILL` | Prepare values for fields without submission. |
| `CREATE_ACCOUNT` | Create a candidate account only when terms allow and no password is retained. |
| `UPLOAD_RESUME` | Upload the user-approved immutable resume version. |
| `ANSWER_SCREENING` | Fill confirmed factual answers. |
| `SUBMIT` | Perform the final application action. |
| `VERIFY` | Read a receipt or provider response that proves submission. |
| `STATUS_SYNC` | Fetch later status through an authorised API. |

Default is deny. Capability is allowed only when the domain policy, connector version, execution mode, user consent, and current health all permit it.

## 4. Execution modes

| Mode | Use | Final action |
| --- | --- | --- |
| `AUTO` | Official/contracted connector; stable questions; explicit opt-in. | Worker submits. |
| `CONFIRM_EACH` | Supported connector; candidate wants per-job control. | User confirms in ApplyFlow, worker submits. |
| `ASSISTED` | LinkedIn, unsupported site, CAPTCHA/OTP, ambiguous question, or terms uncertainty. | User completes external action. |
| `TRACK_ONLY` | Manual application or source cannot be integrated. | User records outcome. |

`AUTO` is never inferred from the plan tier. Paying more does not bypass policy or consent.

## 5. Domain policy record

Each policy must contain:

- Canonical domain and approved subdomains.
- Owner and legal-review reference.
- Terms URL and date reviewed.
- Robots/API/partner basis and evidence reference.
- Allowed capabilities and modes.
- Geographic constraints.
- Rate limit and concurrency limit.
- Required user consent version.
- Account-creation rule.
- Data retention limit.
- Connector/version allowlist.
- `enabled`, `canary`, `degraded`, `blocked`, and expiry state.
- Next review date.
- Emergency kill switch reason and actor.

An expired or blocked policy yields `ASSISTED` or `TRACK_ONLY`, never silent execution.

## 6. User consent

Consent is specific, versioned, and revocable. Capture:

- Candidate identity and account.
- Domain/policy and requested capability.
- Mode (`AUTO` or `CONFIRM_EACH`).
- Exact resume/profile version scope.
- Whether account creation is permitted.
- Timestamp, locale, copy version, IP/user-agent risk metadata, and revocation.

Materially changed terms or a new data category require fresh consent.

## 7. Account creation on external sites

- Prefer OAuth, magic link, or a user-controlled browser session.
- Never generate and retain a third-party password for the user.
- If a site requires password creation, pause and let the user create/store it in their password manager.
- Email or mobile OTP always pauses for the user.
- Do not create duplicate accounts when an account may already exist.
- Display the site's terms/privacy links before confirmation when account creation is requested.
- Store only the external account identifier/status required for the application, not credentials.

## 8. Sensitive and protected questions

Questions about disability, health, race, caste, religion, sex, gender identity, sexual orientation, pregnancy, age/date of birth, criminal history, veteran status, political opinion, union membership, or other locally protected data:

- Are never inferred from resume/profile text.
- Are never answered by default.
- Require a direct user choice with `prefer not to say` where the site permits.
- Are encrypted and retained only when necessary.
- Are excluded from match scoring, analytics segmentation, and AI prompts unless a documented lawful purpose and explicit consent exist.

## 9. Prompt-injection and hostile page content

Treat every job page and uploaded document as untrusted data.

- Extract content into bounded fields before sending to AI.
- Instruct the model that document/page text is data, never an instruction.
- Do not give an extraction model tools, secrets, network access, or the ability to submit.
- Strip scripts, hidden elements, comments, trackers, and unexpected binary content.
- Cap input size and page count.
- Validate AI output against schema and business rules.
- Require deterministic domain checks outside the model.

## 10. Anti-spam and quality controls

- Daily and hourly rate caps independent of paid quota.
- Per-company and per-role duplicate detection.
- Minimum match/eligibility threshold configurable by user within a safe range.
- Exclusion list for companies, locations, titles, employment types, and keywords.
- No application when a required fact is unknown.
- Cooldown after repeated failure or user correction.
- Anomaly detection for rapid account creation, referral abuse, or impossible application volume.

## 11. Kill switches

Operators can disable:

- All submissions globally.
- A source, domain, connector, connector version, capability, geography, or user.
- External account creation.
- An AI provider/model/task route.
- A payment provider operation.

In-flight jobs check the effective kill-switch state immediately before each external side effect.

## 12. Production approval checklist per connector

- Terms/legal review current.
- Data-flow and retention documented.
- Sandbox/contract test fixtures passing.
- Happy path and all pause/recovery paths passing.
- Rate/concurrency limits configured.
- Selectors/API version pinned and health checks live.
- Idempotent submission and duplicate prevention verified.
- Evidence capture verified without prohibited data.
- Canary users and rollback plan defined.
- Support playbook and owner assigned.
