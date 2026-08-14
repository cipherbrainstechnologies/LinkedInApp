# Screen Specifications

Each screen definition includes objective, primary action, content hierarchy, states, responsive behaviour, and critical acceptance notes.

## U-01 Sign in

**Objective:** Create or access an ApplyFlow account with minimal friction and clear trust.

**Primary action:** Continue with LinkedIn.

**Hierarchy:** product value line; LinkedIn button; privacy/terms consent; email fallback; security/support links.

**States:** default, OAuth redirecting, callback pending, consent denied, missing email, account conflict, suspended account, offline.

**Responsive:** centred card up to 480px; no split marketing panel on mobile; optional restrained value panel on desktop.

**Notes:** use official LinkedIn button assets. Copy must say sign-in provides lite identity details and does not import full employment history.

## U-02 Onboarding path choice

**Objective:** Select the correct information order.

**Primary action:** `I have work experience` or `I'm starting my career`.

**Content:** two cards with what will be asked; `You can change this later` note.

**States:** saved prior choice, resume detected, returning user.

## U-03 Contact and basics

**Fields:** name, verified email, mobile with country code, current location, time zone inferred but editable, date availability/notice period.

**Validation:** E.164 phone normalisation; country-aware examples; never assume email exists from LinkedIn.

**Actions:** Save & continue, Save & exit.

**States:** verification sent, rate limited, code expired, duplicate contact conflict.

## U-04 Resume upload and extraction

**Objective:** Turn an uploaded resume into a reviewable profile.

**Components:** upload zone/file picker; supported format/limit text; scan progress; extraction progress; manual entry fallback.

**Review:** source document viewer on desktop beside extracted fields; mobile opens source snippets per field. Each field displays confidence and source page/section when available.

**States:** scanning, unsafe file, unsupported/too large, queued, extracting, partial extraction, low confidence, provider unavailable, complete.

**Actions:** Accept field, edit, remove, accept all high-confidence, save reviewed profile.

## U-05 Fresher education and projects

**Sections:** education; projects; internships/volunteering; certifications; skills/tools; languages.

**Interaction:** repeatable cards; current/completed state; date validation; project evidence links optional.

**Empty help:** examples that do not imply required paid experience.

## U-06 Job-title selector

**Objective:** Select multiple realistic targets.

**Components:** recommended role-family groups; searchable title combobox; selected chips/list; remote/location and internship toggle.

Each recommendation includes evidence such as `Suggested from Java + database coursework`, not opaque AI language.

**Constraints:** at least one; configurable maximum; show warning for unrelated/senior title but allow deliberate choice unless clearly impossible.

## U-07 Home

**Objective:** Show the most useful next action.

**Priority order:** blocking action; profile readiness; ready matches; in-progress applications; quota; follow-ups.

**Widgets:** `Action required`, `Ready for you`, application funnel, quota ring/bar with numeric text, upcoming follow-ups.

**Empty:** onboarding or import/search CTA.

**Mobile:** single column, action-required first. **Desktop:** 12-column grid; no more than three KPI cards in first row.

## U-08 Discover/search

**Objective:** Find relevant jobs and compare quickly.

**Web URL state:** `q`, `titles`, `locations`, `remote`, `employmentType`, `source`, `salaryMin`, `postedWithin`, `sort`, `page`.

**Components:** search field; filter drawer/sidebar; result count; sort; cards/rows; save/hide; import URL entry.

**Result card:** title, company, location/work mode, source/date, fit label, top strengths/gap, application mode, save action.

**States:** no query suggestions, loading, partial provider failure, no results, stale results, quota does not block discovery.

**Mobile:** filter bottom sheet and card list. **Desktop:** optional compact row mode with sticky filter summary.

## U-09 Import URL

**Objective:** Add a job or supported careers page from one user-provided URL.

**Components:** URL field, safety/privacy note, recent imports, supported-mode explanation.

**Outcomes:** job extracted; multiple jobs found; login required; LinkedIn assisted; unsafe/blocked URL; unsupported but trackable.

Never display internal SSRF or policy details that aid bypass; give a plain reason and safe option.

## U-10 Job detail

**Objective:** Decide whether to apply.

**Header:** title, company, location, source, captured/posted date, save/share link, `Apply`/`Prepare` action.

**Sections:** fit summary; eligibility; role description; requirements; benefits; company/source metadata; application mode; report/correct data.

**Sticky action:** desktop right rail; mobile bottom action bar that does not hide content or keyboard.

**Hard disqualifier:** prominent banner with source evidence and `Update profile if incorrect` option; auto apply unavailable.

## U-11 Application review

**Objective:** Confirm exactly what will be sent.

**Desktop:** job context left, structured review right. **Mobile:** stepped single column.

**Sections:** as defined in UX blueprint. Each answer has source/status. Sensitive answers require direct interaction.

**Footer:** quota effect, submission mode, consent summary, primary submit/continue externally action.

**States:** missing answer, job expired, resume archived, quota changed, profile conflict, connector degraded, policy changed.

Conflict recovery revalidates without losing user edits.

## U-12 Action required

**Objective:** Help the user safely finish OTP, CAPTCHA, email verification, login, account creation, consent, or ambiguous question.

**Content:** one action title; why it is needed; trusted external domain; deadline/retry; `Open secure step`; `I've finished`; `Cancel application`; support.

Never ask the user to paste passwords or OTPs into support chat. OTP entry in ApplyFlow is allowed only for a specifically integrated provider with a documented secure flow; otherwise use the provider page.

## U-13 Applications list

**Objective:** Search and manage the application pipeline.

**Web URL state:** `q`, `status`, `source`, `resume`, `dateFrom`, `dateTo`, `sort`, `page`.

**Desktop:** accessible data table with sticky header only if useful; title/company, status, applied date, mode/source, resume, next action. **Mobile:** cards with status and next action first.

**Selection:** bulk export/tag only; never bulk submit or withdraw in MVP.

**Empty:** explain how manual tracking and imported jobs appear.

## U-14 Application detail

**Objective:** Establish truth and next step.

**Header:** job, current status, evidence badge, next action.

**Sections:** timeline; submitted snapshot; answers; resume version; evidence/receipt; notes/follow-up; outcome; support reference.

Sensitive answers are masked by default. External raw payload is never shown.

## U-15 Profile

**Objective:** Manage reusable candidate truth.

**Sections:** personal/contact; work history; education/projects; skills/certifications; preferences/targets; work authorisation; saved answers.

**Interaction:** field-level `Used in X active drafts`; warn before change that invalidates a draft. Past submitted snapshots do not change.

## U-16 Resumes

**Objective:** Manage several resumes with one active.

**Card:** name, version, uploaded date, extraction status, target hints, active badge, applications using it.

**Actions:** activate, view, rename, upload new version, archive, delete where allowed.

Activation dialog explains that existing drafts may need review; perform as atomic server command.

## U-17 Plan and billing

**Objective:** Understand quota and money before acting.

**Content:** current plan; used/reserved/remaining quota; reset/renewal date; plan cards; invoice/receipt history; payment method/provider; cancel/reactivate.

**Upgrade preview:** separate rows for old-plan credit, new-plan charge, tax, due now, next renewal, new quota. Use currency minor-unit-safe formatting.

**States:** loading preview, quote expired, payment action required, processing webhook, success, failed, past due, scheduled downgrade, cancellation scheduled.

## U-18 Notifications

Group by `Action required`, `Applications`, `Billing`, `Security`, and `Product`. Support mark read, deep link, preferences, and empty state. Never put sensitive answers or resume text in push/email preview.

## U-19 Settings/privacy

**Sections:** sessions/devices; sign-in methods; notification preferences; automation consent by domain; connected providers; data export; account deletion.

Deletion is a precise confirmation flow describing billing cancellation, retention/legal exceptions, and recovery window where applicable.

## A-01 Admin overview

**Objective:** Detect commercial, customer, and operational changes.

**Cards:** MRR, active paid, payment failures, verified applications, connector success, AI cost/application, action queue.

**Charts:** revenue trend, funnel, connector health; each has accessible table/summary and date/time-zone control.

No vanity KPI without definition/tooltips.

## A-02 Customer list/detail

Search/filter by ID, verified email, plan, status, onboarding, quota, and risk state. Detail shows profile metadata, subscription, quota ledger, applications, support cases, consent, sessions, and audit trail.

Resume/body viewing is hidden by default and requires just-in-time support access with reason, time limit, and audit.

Actions: grant compensating quota, suspend/unsuspend, trigger verification, refund through provider workflow, start data export/deletion. No direct ledger editing.

## A-03 Plans and billing operations

Versioned plan editor; provider mapping; currencies; quota; visibility; effective dates; promotion controls; invoice/refund lookup; webhook/reconciliation queue.

Published plan versions are immutable. Create a successor version.

## A-04 Connector and domain policy

List health, mode, version, success/failure/pause rates, last run, current legal review. Detail shows allowed capabilities, limits, canary, fixtures, selector/API version, incidents, and kill switches.

Enabling submit requires typed confirmation, reason, and appropriate role.

## A-05 AI control centre

Providers and secret status; task routes; models; fallbacks; prompt versions; eval score; cost/latency; rate/spend limits; kill switch.

Secret values are write-only and masked. Prompt publishing requires passing minimum evals and creates immutable version.

## A-06 Reports

Saved date range/time zone; filter definitions; asynchronous export for large reports; signed short-lived download. Every figure documents inclusion/exclusion and currency conversion method.

## A-07 Audit/security

Immutable searchable events with actor, role, action, target, reason, before/after safe summary, request ID, time, and outcome. Sensitive values are redacted. Export requires auditor permission.
