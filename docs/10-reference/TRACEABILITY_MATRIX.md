# Requirement Traceability Matrix

| Requirement | Product/UX | Architecture/API | Quality IDs |
| --- | --- | --- | --- |
| LinkedIn sign-in | PRD 6.1; U-01 | System Architecture 6; Integrations 2 | AUTH-01..05 |
| One-time candidate context | PRD 6.2; U-02..06 | Data Model 3; API profile/onboarding | ONB-01..06 |
| No-work-history fresher path | PRD 6.2; UX journey 3.2 | Candidate profile modules | ONB-02, DEMO-02 |
| Multiple resumes, one active | PRD 6.3; U-04/U-16 | Data Model 4; API resumes | RES-01..05 |
| Search jobs | PRD 6.4; U-08 | Search/system; API jobs; integrations | JOB-04/07, TRK-01 |
| Import user URL | PRD 6.4; U-09 | URL importer/SSRF; API job imports | JOB-01..04 |
| LinkedIn profile/search/apply boundary | Scope Guardrails 2 | ADR-001; Integrations 2; automation gate | JOB-02, APP-04, SEC-04 |
| Match evidence | PRD 6.5; U-10 | Matching model/AI task | JOB-05/06, AI-03 |
| Accurate application review | PRD 6.6; U-11 | API applications; AI/automation | APP-01..04 |
| Account creation/OTP/CAPTCHA | Guardrails 7; U-12 | Automation 7/12; ADR-011 | APP-08/14 |
| Submission idempotency/evidence | PRD 6.6/6.7; U-14 | System flow; Automation 5; states | APP-05..13, REL-01 |
| Searchable applied jobs | PRD 6.7; U-13/U-14 | API applications/search | TRK-01..03 |
| Free 5/month | PRD 6.8; U-17 | Billing periods/ledger | BILL-01, DEMO-01 |
| Paid 50/100 | Commercial 3 | Plan versions/quota | BILL-02/07 |
| Remaining-period upgrade credit | Commercial 4; U-17 | Billing proration/providers | BILL-02..06/09 |
| Razorpay + Stripe | PRD 6.8 | Integrations 6/7; Billing 11/12 | BILL-03..10 |
| Admin customers/support | Admin 6/7 | Admin APIs/RBAC | ADM-01..03/07 |
| Admin subscriptions/revenue/reports | Admin 9/10/14 | Billing/admin APIs | ADM-04/08, BILL-* |
| Admin connectors/policy | Admin 11/12 | Domain policy/automation | ADM-05, APP-13 |
| Admin OpenAI/Claude keys/routes | Admin 13 | AI Gateway | AI-02/05/06, ADM-06 |
| Professional responsive user UX | UX/Screen/Design docs | Web/mobile architecture | A11Y-01/02, DEMO-02 |
| Mobile native app | UX cross-device; screen specs | Repository/mobile architecture | Mobile E2E plan, DEMO-02 |
| Security/privacy | Scope/Trust docs | Auth, file, URL, connector, billing | SEC-01..04, PRIV-01/02 |
| Cursor autonomous demo | Start Here; Delivery plan | Repository/build contracts | DEMO-01/02, OBS-01 |

Cursor expands this matrix with code/test file paths in `docs/BUILD_STATUS.md`; do not replace the source criteria here.
