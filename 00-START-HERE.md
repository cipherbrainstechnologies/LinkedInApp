# Start Here: Autonomous Build Contract

This document is the execution contract for Cursor Agent.

## Objective

Build a demo-ready, production-shaped monorepo for ApplyFlow using the specifications in this pack. The result must run locally without paid services and expose clear feature flags for real providers.

## How Cursor must work

1. Read every document referenced by `README.md` before generating application code.
2. Create an implementation checklist in `docs/BUILD_STATUS.md` containing every milestone and acceptance criterion ID.
3. Use the stack and boundaries in `docs/03-architecture` unless a dependency is unavailable or incompatible. Record any justified deviation in `docs/10-reference/ADRS.md`.
4. Implement vertically: schema, domain rule, API, UI, tests, telemetry, and seed data for one capability before moving to the next.
5. Never wait for a third-party secret. Use the specified mock adapter and continue.
6. Never invent successful integration behaviour. Mark real adapters `disabled` until configured and verified.
7. Do not perform real external submissions or real charges in automated tests.
8. Run formatting, lint, type-check, unit, integration, end-to-end, accessibility, and build checks after every milestone.
9. Fix all failures caused by the implementation before moving on.
10. Continue until the demo definition and all `P0` acceptance criteria pass.

## Permitted assumptions

- Working product name: ApplyFlow.
- Default market: India, English-first, INR pricing, ages 18 and above.
- Default time storage: UTC; render in the user's IANA time zone.
- Free entitlement: 5 verified application submissions per entitlement period.
- Paid plan examples: 50 and 100 applications per monthly billing period. Prices are admin-configurable seed data, not hard-coded policy.
- Upgrades are immediate after successful payment confirmation; downgrades take effect at period end.
- A quota is consumed only by a confirmed submission and is reversed by a compensating ledger entry when a submission is later proven not to have occurred.
- All AI-extracted or AI-generated facts require user review before an application is submitted.

## Stop conditions

Cursor may stop only when one of the following is true:

- All `P0` acceptance criteria pass and the demo runbook succeeds.
- The local environment cannot install or run required open-source dependencies after two documented alternatives have been attempted.
- A specification conflict could create data loss, a security vulnerability, or an irreversible real-world action.

Missing credentials, branding, legal sign-off, store accounts, domains, and partner approval are not stop conditions. They are production TODOs.

## Required final output from Cursor

- Working monorepo with atomic commits by milestone.
- `README.md` containing one-command local setup.
- `.env.example` with descriptions and safe defaults.
- Database migrations and deterministic seed data.
- Generated OpenAPI document.
- Web, mobile, API, worker, and admin implementation.
- Test reports and a filled `docs/BUILD_STATUS.md`.
- `docs/DEMO_RESULTS.md` with exact commands, results, screenshots/recordings where supported, test identities, and known limitations.
- No plaintext secrets, no real candidate data, and no falsely completed production TODOs.

## First command to give Cursor

Open `docs/09-delivery/CURSOR_MASTER_PROMPT.md` and paste its entire contents into Cursor Agent while this folder is at the repository root.
