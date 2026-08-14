# Security, Privacy, Compliance, and Abuse Controls

## 1. Status of this document

This is an engineering control baseline, not legal advice. Before production, qualified counsel and finance/security owners must validate the exact markets, business entity, terms, privacy notice, consent, retention, processor agreements, payment/tax obligations, accessibility, and job-site contracts.

India launch review must include the Digital Personal Data Protection Act, 2023 and current notified rules/commencement requirements. Expansion may also bring GDPR/UK GDPR, state privacy laws, consumer/subscription rules, employment discrimination law, and app-store requirements into scope.

## 2. Security objectives

- Protect candidate identity, contact, resumes, employment/education, work authorisation, saved answers, application history, and payment metadata.
- Prevent unauthorised applications, duplicate submissions, plan/quota fraud, and account takeover.
- Contain browser connectors and untrusted job/document content.
- Keep payment and AI secrets server-side and least privilege.
- Make high-impact actions provable, idempotent, reversible where possible, and auditable.
- Minimise data and preserve user rights without deleting required financial/security records incorrectly.

## 3. Threat model

Primary threats:

- Credential/session theft and OAuth account-linking attack.
- Cross-user data access/BOLA/IDOR.
- Malicious resume, zip bomb, macro, PDF parser exploit, or malware.
- SSRF through user-provided URL/import or image/job URLs.
- Prompt injection/data exfiltration through job page or document.
- Connector compromise, selector drift, duplicate/unauthorised submission.
- CAPTCHA/rate-limit/access-control bypass pressure.
- Webhook forgery, replay, out-of-order state, or amount tampering.
- Quota race/negative balance and referral/payment fraud.
- Admin privilege misuse or exposed AI/payment secrets.
- PII leakage through logs, analytics, error monitoring, screenshots, exports, URLs, or push/email.
- Dependency/supply-chain or CI secret compromise.
- Data retention beyond purpose or incomplete deletion.

Maintain a living threat model and data-flow diagram per release; high-risk connector/payment/AI changes require review.

## 4. Data classification

| Class | Examples | Controls |
| --- | --- | --- |
| Public | Published plan copy, public job listing within licensed terms | Integrity, source/TTL, normal access. |
| Internal | Feature flags, connector metrics, non-secret configuration | Authenticated staff, logging allowed with care. |
| Candidate private | Name, contact, resume, history, applications, notes | Encryption, strict owner access, redacted logs, retention. |
| Sensitive restricted | Work authorisation evidence, voluntary demographics, background/health/disability answers, access tokens | Explicit purpose/consent, field encryption/token vault, JIT admin access, no analytics/AI by default. |
| Secret | API keys, webhook secrets, encryption keys, session/refresh tokens | Secret manager/KMS, write-only admin flow, rotation, no logs/UI. |
| Financial record | Provider customer/subscription/payment/invoice/refund IDs and amounts | Finance RBAC, integrity/audit, statutory retention, minimise payment instrument data. |

## 5. Privacy by design

- Collect only data needed for the user-selected job search/application purpose.
- Separate required, optional, and sensitive questions.
- Explain purpose before collection and preserve versioned notice/consent evidence.
- Use user-confirmed facts; AI proposals do not silently become authoritative.
- Do not purchase/enrich candidate data from brokers in MVP.
- Do not upload contact books.
- Do not use application/profile data for advertising or model training without a separate reviewed basis and explicit opt-in.
- Provide access/export, correction, consent/automation revocation, grievance/support, and deletion flows.
- Maintain processor/subprocessor inventory and data-transfer review.
- Design for users 18+. If minors are later supported, implement jurisdiction-specific age/parental controls before collection; do not rely on a checkbox alone.

## 6. Authentication and account linking

- OIDC authorisation code + PKCE, state, nonce, exact redirect allowlist.
- Validate issuer, audience, signature, algorithm, expiry, nonce.
- Use provider subject as identity key; email claim alone cannot silently link accounts.
- Account-linking requires an authenticated session plus proof/control of both identities.
- Enumeration-safe email verification/recovery.
- Rate limit by account, IP/risk signals, and operation with false-positive-aware controls.
- Web cookie is Secure/HttpOnly/SameSite; CSRF protection for mutations.
- Mobile rotating refresh tokens stored in SecureStore; server stores hash only.
- Token-family reuse detection and global session revoke.
- Passwords are not required for LinkedIn/magic-link MVP; if added, Argon2id and breached-password controls.
- Admin MFA and fresh-auth for high-risk actions.

## 7. Authorisation

- Deny by default.
- User resource access always scopes by authenticated user before lookup/return.
- Admin uses permission + assurance + optional JIT grant; UI hiding is not security.
- Service identities have only needed queues/secrets/storage prefixes.
- Object downloads require short-lived authorised intent; bucket is private.
- Add automated object-level authorisation tests across every user/admin endpoint.

## 8. Application security baseline

- Follow OWASP ASVS/API Security principles and framework security guidance.
- Strong CSP, frame-ancestors, content-type/nosniff, referrer, permissions, and transport headers.
- Output encoding and safe rich-text rendering; do not render arbitrary job HTML.
- CSRF for cookie-authenticated mutations.
- CORS allowlist; no credentialed wildcard.
- Safe redirects/deep links with server allowlist.
- Parameterised database access and schema validation.
- Request/body/file/decompression limits.
- Dependency lock, vulnerability scanning, secret scanning, SBOM, signed/provenance-aware builds where practical.
- Separate production/staging accounts, projects, keys, databases, buckets, and webhook secrets.

## 9. User-supplied URL and SSRF controls

- Strict HTTPS URL parsing and normalisation.
- Reject username/password, unsafe ports/schemes.
- Resolve DNS and reject private/link-local/loopback/reserved/metadata ranges for initial and every redirected host.
- Limit redirects, bytes, content types, compression ratio, connections, and time.
- Egress proxy/network policy.
- Never forward user cookies, auth, internal headers, or cloud metadata tokens.
- Rebinding-safe resolution/connection strategy.
- Remote images/assets are not fetched blindly by clients/servers.
- Log safe hostname/outcome, not full query data if sensitive.

## 10. File upload controls

- Direct-to-quarantine signed upload with exact user/key/content constraints.
- Allow PDF/DOCX only for MVP; verify magic bytes/MIME and reject executables/polyglots.
- Size/page/entry/decompression limits and hash.
- Antivirus scan and parser isolation/patching.
- DOCX macros/active content not executed; sanitise derived content.
- Original outside public root, encrypted at rest, random key.
- Safe download filename/content disposition.
- OCR/parser failure falls back to manual; do not weaken scanning.
- Deletion/lifecycle covers original, derived text, thumbnails, and cached copies.

## 11. AI safety and privacy

- Provider keys never in clients.
- Minimum required fields; opaque references; storage disabled where supported by default.
- Page/document text is untrusted data and cannot grant instructions/tools.
- Extraction tasks have no tools/network/connector/payment access.
- Strict schema plus local validation and deterministic business rules.
- User review for facts/drafts; sensitive responses never inferred.
- Provider/task spend and rate caps, kill switches, request IDs, error categories.
- Evals for fabrication, prompt injection, protected-data handling, and regression.
- AI raw input/output not placed in ordinary logs/analytics.

## 12. Connector/browser isolation

- Separate low-privilege deployment/container with egress allowlist.
- Ephemeral browser context, bounded runtime/resources, no stealth/CAPTCHA solving/access-control bypass.
- Exact domain policy and user consent checked before each side effect.
- Idempotency and uncertain-submit verification.
- Connector cannot read payment/other-user secrets.
- Screenshot/evidence redaction and limited retention.
- Emergency global/domain/version capability kill switches.

## 13. Billing security

- Use provider-hosted/tokenised payment methods; do not handle/store PAN/CVV.
- Create amounts/plans server-side from published plan version; never trust client amount.
- Webhook signature from raw bytes; deduplicate and reconcile.
- Integer minor units/currency validation.
- Provider ownership/mapping and idempotency.
- Refund and high-value change permission/approval/audit.
- Client success page remains pending until verified.
- Chargeback/fraud controls and rate limits.

## 14. Secret and key management

- Production secret manager/KMS; application DB holds reference/fingerprint only.
- Envelope encryption for restricted fields with key version.
- Separate keys by environment/purpose and rotate.
- Admin create/rotate is write-only; never reveal plaintext.
- No secrets in repository, image, browser bundle, mobile bundle, logs, crash reports, test fixtures, or support tickets.
- CI uses short-lived OIDC/workload identities where possible.
- Emergency revoke/rotation runbook tested.

## 15. Logging, analytics, and observability privacy

Structured safe fields:

- Trace/request/event/operation IDs.
- User/resource opaque IDs where needed.
- Route/task/provider/connector/version/status/error category.
- Counts, timing, tokens, cost, queue age.

Redact/forbid:

- Names, email, phone, addresses.
- Resume/job full text and free-text answers/notes.
- Exact sensitive fields or salary where unnecessary.
- Cookies, tokens, signatures, keys, auth headers.
- Raw provider/webhook payloads in standard logs.
- Signed URLs.

Analytics uses approved enumerations and pseudonymous ID. Maintain automated log-redaction tests.

## 16. Suggested retention schedule

Final periods require legal/business validation.

| Data | Suggested baseline |
| --- | --- |
| OIDC transient state/nonce | Minutes; delete after use/expiry. |
| Active session metadata | Session life plus short security window. |
| Original active resume | While account/purpose active; delete on user action subject to snapshots/retention. |
| Derived resume text | Shortest useful period; recreate where practical. |
| Submitted application snapshot/evidence | User-visible history period, then delete/anonymise unless user retains or legal need. |
| Failed draft/import temporary HTML | Days, not indefinite. |
| Connector screenshots | Short incident/evidence period; redact and expire. |
| AI raw input/output | Default minimal/short or none; task metadata longer as needed. |
| Audit/security logs | Proportionate security/compliance period, access restricted. |
| Payment/invoice/refund records | Statutory/accounting period. |
| Data exports | Short-lived download then delete. |
| Deleted account tombstone | Minimal anti-fraud/legal identifiers only where justified. |

Implement policy-as-code lifecycle jobs and deletion verification across DB, object storage, cache, search, providers, analytics, and backups according to backup retention.

## 17. User rights and deletion

### Export

- Re-authenticate.
- Async package with structured JSON/CSV plus documents where appropriate.
- Short-lived encrypted/signed delivery and audit.
- Exclude internal security data that cannot lawfully/safely be disclosed; document basis.

### Correction

- User edits authoritative profile.
- Submitted snapshots remain historical but future use changes.
- Provide support path for incorrect immutable records/receipts.

### Deletion

1. Re-authenticate and explain effects/retention exceptions.
2. Cancel future billing/automation and revoke sessions/consents.
3. Grace/cancel window if policy allows.
4. Delete/anonymise profile, resumes, drafts, AI data, notifications, and provider data.
5. Retain only required financial/security records with access restriction.
6. Record completion proof without recreating deleted PII.

## 18. Abuse and fraud controls

- Hour/day submit caps independent of paid quota.
- Duplicate job/company/application controls.
- Referral bonus caps and self-referral signals.
- Checkout/refund/chargeback velocity.
- Disposable/duplicate account risk with review, not opaque permanent discrimination.
- Do not use protected characteristics or resume content for fraud scoring.
- Suspension is scoped, reasoned, appealable/supportable, and audited.
- Admin adjustments/refunds monitored for insider abuse.

## 19. Incident response

Severity/runbooks for:

- Candidate data exposure.
- Account takeover/session theft.
- Secret/API key leakage.
- Duplicate/unauthorised applications.
- Connector/site-policy violation.
- Payment/webhook/refund error.
- AI fabrication at scale.
- Malware/parser compromise.

Common steps: contain with kill switch/revoke, preserve evidence, assess scope, legal/notification decision, communicate accurately, recover/reconcile, regression control, post-incident review.

Run tabletop exercises and restoration drills before launch. Breach notification timing/content is jurisdiction-specific and must be validated by counsel.

## 20. Security testing

- SAST, dependency/secret/container/IaC scan.
- Dynamic auth, CSRF, XSS, SSRF, file upload, access control, rate limit, webhook replay.
- Tenant/cross-user matrix test.
- Ledger/payment concurrency/property tests.
- Connector sandbox/egress and duplicate-submit tests.
- AI prompt injection/fabrication/sensitive-answer evals.
- Mobile secure storage/deep-link/certificate/network checks.
- Admin privilege/JIT/audit tests.
- Independent penetration test before production and after major auth/payment/connector change.

## 21. Launch compliance checklist

- Legal entity, terms, privacy notice, cookie/analytics notice, refund/cancellation copy.
- Data inventory, purposes, lawful basis/consent, processor/subprocessor contracts, transfers.
- User rights/grievance contact and operational SLA.
- Retention/deletion schedule and tested jobs.
- India DPDP Act/rules/commencement assessment; other market laws as applicable.
- Site/API contracts and domain policy evidence.
- Payment provider terms, taxes/invoices, recurring mandate/subscription requirements.
- App-store privacy labels/subscription rules if native billing is offered.
- Accessibility review.
- Security review, pen test, incident/breach plan, backups/restore.
- No claims of LinkedIn affiliation/endorsement or guaranteed employment outcomes.
