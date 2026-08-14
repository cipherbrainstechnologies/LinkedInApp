# Assumptions, Open Decisions, and Production TODOs

## 1. Working assumptions used to unblock demo

- Codename is ApplyFlow; no trademark/domain check has been performed.
- India is initial market, English-first, INR examples, 18+ users.
- LinkedIn is primary sign-in but not an identity-verification service or work-history import.
- Email fallback exists for recovery/missing email.
- Free quota is 5 confirmed applications per signup-anchored monthly entitlement period.
- Paid examples are 50 and 100 monthly; prices ₹299/₹499 are placeholders.
- Exactly one active resume, though multiple stored resumes/versions are allowed.
- Upgrade immediate after confirmed provider result; downgrade at period end.
- Quota counts confirmed submissions, not preparation attempts.
- No rollover in MVP.
- Application modes include auto, confirm-each, assisted, track-only; mode is policy-driven.
- Demo uses deterministic providers and fictitious data.

## 2. Product decisions required before beta

- Final product name, brand, domain, app-store names, design assets.
- Final age eligibility and markets/languages.
- Exact plan prices, features, quota reset, rollover, trial/referral, taxes.
- Which assisted/manual proof qualifies as quota consumption.
- Resume count/retention per plan.
- Minimum match/eligibility configuration and user overrides.
- Notification defaults and support SLA.
- Refund/cancellation/grace/chargeback policy.
- Dormant/canceled user data retention.

## 3. Provider/business dependencies

- LinkedIn developer app and OIDC approval/credentials.
- Written LinkedIn partner/API authorisation before any non-assisted search/apply capability.
- Licensed job discovery provider contract and attribution/cache/delete rules.
- Approved ATS/application connector contracts/domain reviews.
- Stripe merchant, products/prices, supported countries/currencies/taxes.
- Razorpay merchant, subscription/mandate/payment-method eligibility and verified update/proration/refund behaviour.
- OpenAI/Anthropic projects, data retention/residency choice, spend/rate limits, approved model strings.
- Email domain/provider, push credentials, optional SMS/OTP vendor.
- Cloud, secret manager/KMS, monitoring/error provider, object storage/CDN/WAF.

## 4. Legal/privacy/security TODOs

- Entity-specific terms/privacy/cookie/AI/automation consent copy.
- India DPDP Act and current rules/commencement assessment.
- Other target-market privacy/consumer/subscription/employment laws.
- Processor/subprocessor agreements, transfers, retention, rights/grievance process.
- Job-site terms/domain policy legal reviews and review cadence.
- Payment recurring mandate, GST/VAT/invoice/accounting review.
- App-store billing/privacy/subscription policy review.
- Accessibility audit.
- Threat model, DPIA where appropriate, security architecture review, pen test, incident/breach plan.
- Trademark/domain and claims review; no LinkedIn affiliation or job guarantee claim.

## 5. Engineering TODOs for production

- Pin versions after compatibility spike and lockfile.
- Choose deployment region/topology and infrastructure-as-code target.
- KMS/field encryption key hierarchy, rotation, backup/restore.
- Production OIDC/mobile universal/app links.
- Real provider contract/sandbox adapters and canary.
- Email/push deliverability and templates/localisation.
- Rate/fraud thresholds from beta data.
- Observability SLOs/on-call/incident tooling.
- Load/soak/restore/DR testing.
- Native store builds/signing/privacy labels and real-device matrix.
- Data lifecycle deletion propagation and backup expiry verification.

## 6. Questions that do not block demo

- Exact cloud vendor.
- Exact production model IDs.
- Exact job-source/ATS providers.
- Real company address/tax identifiers.
- Final marketing copy/logo.
- Whether annual plans launch.
- Whether iOS allows in-app purchase or external purchase under final market/store rules.

Mock ports and admin configuration must preserve these decisions as replaceable inputs.
