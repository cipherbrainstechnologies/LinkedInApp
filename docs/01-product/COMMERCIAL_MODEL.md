# Commercial Model and Product-Led Growth

## 1. Positioning

ApplyFlow should not compete as a reckless mass-apply bot. Its defensible position is a trusted application operating system: one verified candidate profile, evidence-based job fit, policy-aware application assistance, accurate quotas, and a searchable career pipeline.

Working tagline: **Your applications, organised and moving.**

## 2. Initial market

- India-first, English-first.
- Students, new graduates, and professionals with up to five years of experience.
- Mobile is the daily surface; desktop is the deep-review surface.
- Launch in a narrow set of supported ATS domains plus manual/assisted tracking everywhere else.

## 3. Plan model

Seed plans are assumptions and remain editable in admin.

| Plan | Monthly quota | Example INR price | Purpose |
| --- | ---: | ---: | --- |
| Free | 5 | ₹0 | Trust and activation. |
| Launch | 50 | ₹299 | Active job seeker. |
| Power | 100 | ₹499 | High-intent job seeker. |

Do not promise that every quota unit can be auto-submitted. A unit represents one confirmed application submission, regardless of `AUTO`, `CONFIRM_EACH`, assisted confirmation, or user-recorded provider receipt according to configured policy.

Plan features may also differ by:

- Saved jobs and history retention.
- Number of resume records (while one remains active).
- AI match explanations per period.
- Priority queueing.
- Export/report features.

Avoid paywalling accuracy, privacy controls, security, or the ability to correct AI output.

## 4. Upgrade/downgrade promise

- Before confirmation, show the exact provider-backed proration preview.
- Credit unused paid time on the old plan against the same remaining period on the new plan where the billing provider supports it.
- Apply an upgrade only after payment is confirmed.
- Preserve consumed quota; the new limit increases available capacity rather than resetting usage.
- Schedule downgrades at renewal to avoid clawing back already-granted capacity.
- Describe credits separately from cash refunds. A proration credit is not automatically a withdrawal to the original payment method.

## 5. Refund policy design

Final copy requires legal review. Product behaviour should support:

- Duplicate or confirmed false submission: automatically return quota; payment refund not normally required.
- Service outage or connector failure causing material non-delivery: admin-granted quota credit or prorated monetary refund with reason.
- Statutory cancellation/refund rights by jurisdiction.
- Refund to original payment method only through the owning payment provider.
- Immutable refund/credit ledger and customer-visible receipt.

## 6. Low-marketing growth loops

### Activation loop

Resume upload -> immediate verified profile preview -> three explainable job matches -> first free assisted/verified application. The user should experience value before seeing a paid gate.

### Referral loop

- Give the inviter and verified new user a small quota bonus only after the new user completes onboarding and one legitimate application.
- Cap bonuses per period and detect self-referrals/device/payment overlap.
- Never require social posting or contact-book upload.

### Outcome loop

- Let users mark interviews/offers and see private funnel insights.
- Offer an optional, privacy-safe share card such as “12 focused applications, 3 interviews” with no company/job/private data.
- Do not fabricate success or pressure public sharing.

### Campus/bootcamp loop

- Provide a cohort code with limited bonus quota and aggregated, anonymised activation reporting.
- Do not expose individual application history to the institution without a separate, explicit user consent model.

### Organic discovery

- Public, indexable guides for job-title selection, resume readiness, and application tracking.
- Free interactive job-title explorer based on education/skills without forcing sign-up before results.
- Useful templates and checklists that deep-link into onboarding.

## 7. Retention

Job searching is episodic. Optimise for trust and successful reactivation, not artificial daily engagement.

- Pause/cancel cleanly.
- Preserve user-owned tracker data under the retention policy.
- Offer reminders for user-set follow-up dates and saved jobs expiring.
- Let users return with profile/resume review rather than rebuilding everything.
- Consider a low-cost dormant plan only after product evidence supports it.

## 8. Unit economics controls

Track by task, model, plan, and successful application:

- AI input/output tokens and provider cost.
- Job-source licensing cost.
- Browser/worker minutes.
- File storage and scanning.
- Email/SMS/push cost.
- Payment fees, tax, refunds, and chargebacks.
- Support time and connector maintenance.

Initial operating targets:

- AI/provider variable cost below 10% of net revenue.
- Gross margin above 70% at steady-state supported-domain mix.
- P95 end-to-end supported application preparation below 3 minutes, excluding user action.
- Supported connector confirmed-submission success above 95% before wider rollout.

These are targets, not user-facing guarantees.

## 9. Experiments

Run only one variable at a time and predefine success/guardrail metrics.

- Resume-first vs goal-first onboarding.
- Three vs five initial title recommendations.
- Quota counter framing: remaining units vs used/limit.
- Confirmation summary compact vs detailed.
- Upgrade prompt at 80% vs 100% quota.

Guardrails include correction rate, irrelevant-application rate, support contacts, refund rate, and trust survey—not conversion alone.

## 10. Business reports

- MRR/ARR, new MRR, expansion, contraction, churn, reactivation.
- Active free/paid users and cohort conversion.
- Gross/net revenue by provider/currency after refunds.
- Quota granted, reserved, consumed, reversed, expired.
- AI and connector cost per confirmed application.
- Funnel: registered -> profile complete -> first job -> first application -> paid -> interview marked.
- Connector coverage, success, failure, pause rate, and maintenance cost.
- Customer support reasons and resolution time.

## 11. Decisions before public launch

- Final brand/domain/trademark.
- Final prices, taxes, invoice entity, and refund terms.
- Exact markets and age eligibility.
- Licensed discovery sources and contracted ATS/application connectors.
- App-store billing implications for subscription purchase paths.
- Customer support operating hours and escalation SLA.
