# Product Requirements Document

## 1. Product summary

ApplyFlow is a paid career application assistant for students, freshers, and experienced candidates. It converts candidate-provided information into a verified reusable profile, discovers or imports jobs, prepares accurate applications, submits only through permitted connectors, and gives the candidate one searchable source of truth for every application.

The product promise is: **Apply faster without losing control or accuracy.**

## 2. Problem

Candidates repeatedly enter the same identity, education, work history, contact, preference, and screening information across different job sites. They lose track of where they applied, submit inconsistent answers, miss follow-ups, and spend time on irrelevant roles. Existing automation can also create risk by applying indiscriminately, inventing answers, or violating job-site rules.

ApplyFlow must remove repetition while keeping facts, consent, relevance, and site policy visible.

## 3. Target users

### Persona A: fresher

- Age 18–24, mobile-first, limited or no work history.
- Starts from education, projects, internships, certifications, and skills.
- Needs help selecting multiple realistic job titles.
- Needs confidence and plain-language explanations.
- Often uses free tier before paying.

### Persona B: early-career professional

- 1–5 years of experience.
- Applies to several adjacent roles and locations.
- Has one or more resumes for different role families.
- Values speed, match explanation, and a reliable tracker.

### Persona C: experienced professional

- Has detailed work history and higher sensitivity to privacy and accuracy.
- Wants controlled applications, seniority/salary filters, and audit evidence.
- May maintain specialised resumes but only one is active at a time in MVP.

### Persona D: operations/admin user

- Supports customers, monitors connector health, manages plans and quotas, reviews revenue, configures AI, handles refunds, and audits privileged actions.

## 4. Jobs to be done

1. When I start applying, help me create one accurate profile from information I provide so I do not repeat it everywhere.
2. When I am a fresher, translate my education and skills into suitable job-title choices without pretending I have experience.
3. When I find a job, tell me why it matches and what is missing before I spend quota.
4. When an application can be submitted safely, prepare it and ask for confirmation of material answers.
5. When automation cannot continue, show exactly what I need to do without losing progress.
6. When I have applied, let me search, filter, and understand the evidence and current status.
7. When I upgrade, charge only the correct remaining-period difference and immediately show my new usable quota after payment is confirmed.
8. When I run operations, let me manage the product without direct database changes or exposed secrets.

## 5. Product principles

- **Truth over volume:** never invent candidate facts or hide uncertainty.
- **User in control:** material answers and submissions require informed consent.
- **Proof over claims:** application status is backed by connector evidence or marked unverified.
- **Policy-aware by design:** capability is granted per domain, not assumed globally.
- **Mobile-first, not mobile-only:** core tasks are reachable on one hand; desktop optimises review and data density.
- **Progressive disclosure:** ask for information when it becomes useful.
- **Transparent AI:** show extracted facts, source, confidence, and editable confirmation.
- **No credential harvesting:** do not store third-party passwords.

## 6. Functional scope

### 6.1 Authentication and account

- Primary sign-in with LinkedIn OpenID Connect using `openid profile email`.
- Validate issuer, audience, signature, nonce, state, PKCE, issued/expiry time.
- Handle missing LinkedIn email and request a verified email inside ApplyFlow.
- Provide local developer/test identity and optional email magic-link fallback for recovery.
- Mobile uses system browser OAuth, universal/app links, and secure OS credential storage.
- Profile deletion, data export, session/device management, and consent history.

### 6.2 Candidate onboarding

Common one-time information:

- Legal/preferred name.
- Email and country-code-aware mobile number.
- Current location and preferred locations.
- Work authorisation and sponsorship requirement.
- Employment type, remote/hybrid/on-site preference.
- Salary expectation with currency and period.
- Notice period or availability date.
- Languages.
- Links: portfolio, GitHub, personal site, and optional LinkedIn profile URL.
- Reusable screening answers, each requiring explicit user confirmation.

Experienced path:

- Resume upload first.
- AI extracts roles, employers, dates, responsibilities, achievements, education, skills, and certifications.
- User reviews a source-linked diff before saving.
- Current role and past roles are represented separately.

Fresher path:

- Education, graduation year, field, grades only when voluntarily supplied, projects, internships, certifications, tools, and skills.
- System suggests job-title groups with an evidence explanation.
- User selects multiple titles, removes unsuitable titles, and may add custom titles.
- User selects entry-level only by default; internships may be included separately.

Onboarding completion requires identity/contact, at least one target title, location preference, active resume, required consent, and reviewed extracted facts.

### 6.3 Resume management

- Upload PDF or DOCX; configurable size and page limits.
- Multiple resume records per user.
- Exactly one active resume enforced by a transactional unique constraint/domain invariant.
- Upload creates immutable version and extraction record.
- Activate, rename, download, replace with new version, archive, and delete subject to application evidence retention.
- Application stores the exact resume version used; changing the active resume never mutates past applications.
- File scan, MIME inspection, text extraction, optional OCR fallback, and encrypted object storage.
- User may upload a LinkedIn-provided data export or profile PDF as candidate-provided input; it is not fetched by scraping.

### 6.4 Job discovery and import

- Search licensed/official job sources with title, skill, location, remote, employment type, freshness, company, and salary filters where supplied.
- User can paste one job or careers-site URL.
- URL importer validates scheme/domain, blocks private-network and unsafe targets, follows a limited redirect policy, and extracts schema.org JSON-LD or supported ATS data.
- AI normalises title, company, description, requirements, benefits, location, salary, application questions, and source URL into a strict schema.
- Deduplicate on canonical source ID/URL plus fuzzy title-company-location fingerprint.
- Display source, captured time, expiry, automation support, and policy mode.
- LinkedIn discovery is limited to user-provided links, authorised partner data, or a user-controlled deep link. Do not scrape LinkedIn search.

### 6.5 Match and recommendation

- Hard eligibility checks run before AI scoring: location/work authorisation, required experience, required licence/certification, salary constraints when explicit, and user exclusions.
- Match result includes a 0–100 presentation score, but the UI must show evidence categories rather than imply objective truth.
- Explain strengths, gaps, unknowns, and disqualifiers with links to candidate/job source fields.
- Never auto-apply to a job with a hard disqualifier.
- User can mark interested, not interested, save, hide company, or correct a job field.

### 6.6 Application preparation and submission

- Snapshot the job, active resume version, profile version, plan/quota state, prompt version, and connector version.
- Generate only truthful drafts for cover notes and screening answers.
- Show a review checklist for identity, contact, resume, work authorisation, salary, relocation, notice period, and custom answers.
- Require user confirmation before first submission to a domain and whenever a material answer is new or changed.
- Modes:
  - `AUTO`: connector and domain policy allow submission; user opted in.
  - `CONFIRM_EACH`: everything prepared, user taps submit.
  - `ASSISTED`: user completes the final action on the external site.
  - `TRACK_ONLY`: ApplyFlow records a manual application.
- CAPTCHA, OTP, email link, unexpected account creation, new terms, or ambiguous question moves to `WAITING_FOR_USER`.
- Store submission receipt ID, final URL, timestamp, and sanitised evidence where available.
- Prevent duplicate application to the same canonical job unless the user explicitly records an allowed reapplication.

### 6.7 Application tracker

- Search by company, job title, source, location, and free text.
- Filter by status, date range, submission mode, resume, and source.
- Sort by recent activity, applied date, company, and status.
- Status timeline with actor, event, timestamp, and evidence level.
- User notes, follow-up date, interview stages, offer/rejection/withdrawn outcome.
- CSV export of the user's own tracker.
- Past application details remain stable even if the job or profile later changes.

### 6.8 Subscription and quota

- Free plan with 5 successful submissions per entitlement period.
- Paid monthly plan examples with 50 and 100 successful submissions.
- Admin-configurable plan versions, price, currency, quota, trial, visibility, and provider price/plan IDs.
- Stripe and Razorpay provider adapters; one billing provider owns a subscription for its lifetime unless migrated through an explicit workflow.
- Upgrade preview displays unused-period credit, new-plan charge, tax, amount due now, next renewal amount/date, and resulting quota.
- Upgrade becomes effective only after authoritative payment/webhook confirmation.
- Downgrade normally schedules at period end; no reduction below already-consumed quota.
- Cancel at period end, reactivate, failed-payment recovery, invoice/receipt list, and refund records.

### 6.9 Notifications

- In-app notification centre.
- Email for account verification, application action required, submission confirmation, payment outcome, quota thresholds, renewal/cancellation, and security events.
- Push notifications on mobile after explicit opt-in.
- User-configurable non-essential notifications; transactional/security messages remain enabled as legally permitted.

### 6.10 Admin console

- Defined in `docs/06-admin/ADMIN_PANEL.md`.
- Requires separate admin identity/role, MFA-ready architecture, server-side authorisation, and immutable audit events.

## 7. Out of scope for demo/MVP

- Unauthorised LinkedIn scraping, search automation, or Easy Apply bots.
- Bypassing CAPTCHA, OTP, email verification, rate limits, or access controls.
- Storing third-party website passwords.
- Auto-answering protected/sensitive demographic questions without an explicit user response.
- Fabricating or optimising facts beyond the candidate's evidence.
- Automated recruiter messaging, mass outreach, or fake engagement.
- Tax filing, employment/legal advice, or guarantees of interviews/jobs.
- Production app-store publication, partner contracts, legal sign-off, and real payment settlement.
- Enterprise multi-tenant employer/recruiter product.

## 8. Success metrics

### North-star metric

Verified, relevant applications submitted per activated candidate per entitlement period.

### Activation

- Onboarding completion rate.
- Time to first saved job and first verified application.
- Resume extraction confirmation rate and correction rate.

### Quality and trust

- Duplicate application prevention rate.
- Percentage of submissions with evidence.
- User-reported inaccurate answer rate.
- Hard-disqualifier override rate.
- Connector success rate by version and domain.
- Support contacts per 100 submissions.

### Commercial

- Free-to-paid conversion.
- MRR, net revenue retention, churn, payment recovery.
- Gross margin and AI cost per verified application.
- Quota utilisation distribution by plan.

### Reliability

- P95 API latency excluding external providers.
- Queue age, submission completion time, webhook delay.
- Crash-free mobile sessions and web core-vitals pass rate.

## 9. Launch gates

- All P0 acceptance criteria pass.
- Legal review of product terms, privacy notice, consent copy, candidate data retention, and every enabled domain policy.
- LinkedIn functionality matches OIDC and User Agreement constraints.
- Penetration test findings at high/critical resolved.
- Payment webhook replay/idempotency and proration reconciliation verified in test mode.
- AI eval thresholds pass on extraction truthfulness and answer non-fabrication.
- Support/admin access controls and audit export verified.
- Production backups, restore drill, alerts, kill switches, and incident runbooks validated.
