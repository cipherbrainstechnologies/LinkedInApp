# ApplyFlow Product and Execution Pack

ApplyFlow is a working codename for a paid job-search and application management product for students, freshers, and experienced professionals. This pack is the implementation source of truth for a responsive web app, native mobile app, backend, automation workers, subscriptions, AI extraction, and an operations/admin console.

The pack is designed to be placed in an empty Git repository and handed to Cursor Agent. Cursor must first read `00-START-HERE.md`, then follow `AGENTS.md` and the documents in numbered order.

## What this pack delivers

- Product scope, target users, monetisation, quotas, and measurable outcomes.
- Complete onboarding for experienced candidates and education-first onboarding for freshers.
- Multiple resume uploads with exactly one active resume.
- LinkedIn OIDC sign-in, with a compliant alternative to prohibited LinkedIn profile scraping.
- Job discovery through licensed/official providers and job import from a user-supplied URL.
- A policy-aware application engine for supported external sites.
- Assisted mode for LinkedIn and unsupported sites, with explicit user confirmation.
- Searchable application history and evidence-backed status tracking.
- Stripe and Razorpay subscriptions, webhook handling, upgrades, downgrades, credits, and quotas.
- Admin operations for users, plans, revenue, connectors, AI providers, reports, support, and audit logs.
- OpenAI and Anthropic provider adapters controlled entirely from the admin plane.
- Responsive web UX, native iOS/Android UX, accessibility rules, and a design system.
- Architecture, data model, API contracts, event catalogue, security, testing, observability, and release guidance.
- One autonomous Cursor execution prompt and an offline-capable demo path.

## Important product boundary

LinkedIn sign-in is supported through OpenID Connect, but its normal sign-in scopes provide only a lite identity profile, not a member's full work history. LinkedIn's current User Agreement prohibits unauthorised scraping and bots. Therefore:

- Do not scrape LinkedIn profiles, search results, or application pages.
- Do not automate LinkedIn job submissions without a written partner agreement and an approved API.
- Use resume parsing, user-confirmed onboarding, and an optional user-uploaded LinkedIn data export/PDF to build the candidate profile.
- Treat LinkedIn jobs as `ASSISTED` unless an approved integration is later obtained.

This boundary is an intentional commercial risk control, not a missing feature.

## Recommended reading order

1. `00-START-HERE.md`
2. `AGENTS.md`
3. `docs/01-product/PRD.md`
4. `docs/01-product/SCOPE_GUARDRAILS.md`
5. `docs/01-product/COMMERCIAL_MODEL.md`
6. `docs/02-experience/UX_BLUEPRINT.md`
7. `docs/02-experience/SCREEN_SPECIFICATIONS.md`
8. `docs/02-experience/DESIGN_SYSTEM.md`
9. `docs/03-architecture/SYSTEM_ARCHITECTURE.md`
10. `docs/03-architecture/REPOSITORY_STRUCTURE.md`
11. `docs/03-architecture/DATA_MODEL_AND_STATES.md`
12. `docs/04-api/API_AND_EVENTS.md`
13. `docs/04-api/INTEGRATIONS.md`
14. `docs/04-api/AI_GATEWAY.md`
15. `docs/04-api/AUTOMATION_ENGINE.md`
16. `docs/05-billing/SUBSCRIPTIONS_QUOTAS.md`
17. `docs/06-admin/ADMIN_PANEL.md`
18. `docs/07-trust/SECURITY_PRIVACY_COMPLIANCE.md`
19. `docs/08-quality/TEST_PLAN.md`
20. `docs/08-quality/ACCEPTANCE_CRITERIA.md`
21. `docs/09-delivery/IMPLEMENTATION_PLAN.md`
22. `docs/09-delivery/DEMO_RUNBOOK.md`
23. `docs/10-reference/ADRS.md`
24. `docs/10-reference/TRACEABILITY_MATRIX.md`

## Demo definition

The demo is complete only when a new user can sign in with a local test identity, complete either candidate onboarding path, upload and activate a resume, discover seeded jobs, import a mock external URL, review an AI-extracted job, prepare and submit through a mock supported connector, see quota consumption, upgrade a mocked subscription, search application history, and when an admin can manage the user, plan, connector, AI route, and reports.

Real payment, LinkedIn, email, and AI credentials are not required for demo completion. Every provider must have a deterministic local adapter.

## Naming

`ApplyFlow` is a codename only. Complete a trademark, domain, app-store, and social-handle check before production branding.
