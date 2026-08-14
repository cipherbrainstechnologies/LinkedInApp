# Demo and Testing Runbook

Cursor must make this runbook executable and update exact ports/commands only if an ADR records the deviation.

## 1. Prerequisites

- Supported current Node.js LTS.
- Corepack/pnpm pinned by repository.
- Docker with Compose.
- Git.
- For mobile: Android Studio/emulator or Expo-compatible physical test device; iOS requires appropriate macOS tooling.

No LinkedIn, OpenAI, Anthropic, Stripe, Razorpay, email, SMS, push, or cloud account is required for the local demo.

## 2. First setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm bootstrap
pnpm dev:infra
pnpm db:migrate
pnpm db:seed
```

Expected: PostgreSQL, Redis, MinIO, Mailpit, and mock providers healthy; migrations/seed idempotent.

## 3. Run

```bash
pnpm dev
```

Expected documented defaults (Cursor may choose adjacent ports and update this file):

- Candidate web: `http://localhost:3000`
- Admin web: `http://localhost:3001`
- API/OpenAPI: `http://localhost:4000`
- Mock provider scenario UI: `http://localhost:4100`
- Mailpit: `http://localhost:8025`
- MinIO console: local-only documented port

Mobile:

```bash
pnpm dev:mobile
```

The README must explain API host for emulator/physical device and deep-link callback.

## 4. Reset

```bash
pnpm demo:reset
```

Expected: only local demo data is reset; command refuses production-like environment/database host.

## 5. Demo identities

The implementation must print/document safe demo sign-in choices without passwords:

- Experienced free/incomplete.
- Experienced Launch paid.
- Fresher free.
- Quota exhausted.
- Waiting action.
- Support admin.
- Finance admin.
- Ops admin.
- AI admin.
- Auditor.

Local auth must be environment-gated and production-disabled.

## 6. Demo scenario A — Experienced candidate

1. Sign in through local LinkedIn OIDC simulator.
2. Demonstrate missing/optional LinkedIn email handling or use completed claim.
3. Choose experienced path.
4. Upload fictitious resume fixture.
5. Watch scan/extract states.
6. Review source-linked fields; edit one uncertain field; confirm.
7. Add two target titles and locations/work mode.
8. Activate resume and complete onboarding.
9. Home shows next action, matches, application activity, quota/reset.

Proof:

- No provider password/full LinkedIn history.
- Exactly one active resume.
- Profile fields show source/confirmation.

## 7. Demo scenario B — Fresher

1. Sign in as fresher fixture.
2. Choose starting-career path.
3. Add education, project, internship optional, skills/certification.
4. Review evidence-backed role groups and select multiple entry titles.
5. Upload/activate fresher resume.
6. Complete onboarding and view entry-level matches.

Proof: no work experience is required or fabricated.

## 8. Demo scenario C — Discover/import/match

1. Search jobs; adjust title/location/remote/source filters.
2. Open a job and review strengths/gaps/unknowns.
3. Open hard-disqualifier fixture and show automation blocked.
4. Import supported mock ATS URL and show extraction/deduplication.
5. Import mock LinkedIn URL and show assisted/track-only mode without scraping.
6. Attempt unsafe/private-network URL fixture and show safe block.

## 9. Demo scenario D — Successful application

1. Open eligible supported mock job.
2. Create/prepare application.
3. Review immutable resume, identity, eligibility, answers, cover note, mode, consent, quota.
4. Change one answer only for this application.
5. Confirm and submit.
6. Observe queued/running/submitted transitions.
7. Open tracker/detail and show receipt/evidence/timeline and exact resume version.
8. Show quota consumed once.
9. Submit same idempotency command/duplicate job path and show no duplicate.

## 10. Demo scenario E — Action required and uncertain

1. Use OTP/CAPTCHA mock scenario; show `WAITING_FOR_USER` and no bypass.
2. Complete mock external action and resume safely.
3. Use timeout-after-submit fixture; show checking/uncertain, later verify success, no resubmit/duplicate/quota double-use.
4. Use final-failure fixture; show quota release and preserved draft/context.

## 11. Demo scenario F — Subscription upgrade

1. Sign in as Launch user with 20 used (and optional reservations) of 50.
2. Open Plan and choose Power 100.
3. Show mock provider preview: credit, charge, tax, due now, renewal, resulting quota, quote expiry.
4. Confirm and keep UI pending until mock webhook.
5. On success, show 20 usage preserved and new available based on 100.
6. Reset/retry failure fixture and show old plan/quota preserved.
7. Schedule downgrade and show period-end timing.

## 12. Demo scenario G — Admin

1. Support admin searches a customer, opens case, sees private data masked, grants one quota unit with reason and audit.
2. Finance admin views revenue/subscription, plan version, mock refund; cannot access AI/connector controls.
3. Ops admin views connector health, degrades/kills mock submit, and queued attempt stops before side effect.
4. AI admin adds a mock secret (write-only), tests route, runs eval, publishes route; cannot read secret.
5. Auditor views audit report and cannot mutate.
6. Demonstrate immutable published plan/prompt/policy versions.

## 13. Automated validation

```bash
pnpm verify
pnpm demo:smoke
```

Cursor records exact output summary in `docs/DEMO_RESULTS.md`.

Optional targeted commands:

```bash
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm build
```

## 14. Failure evidence

If a check cannot run due to environment capability (for example iOS simulator), `DEMO_RESULTS.md` must state:

- Exact command attempted.
- Exact safe error summary.
- What equivalent check ran.
- What remains unverified and production gate.

Do not mark the criterion passed solely from code inspection.

## 15. Production handoff checklist

After demo—not part of autonomous local completion:

- Final branding/legal/pricing/tax/refund decisions.
- Real cloud/secret/KMS/monitoring/backup configuration.
- Provider accounts/contracts/keys and separate test/prod resources.
- LinkedIn OIDC approval; no scraping/auto-apply without partner agreement.
- Licensed job/ATS connectors and domain policies.
- Provider test-mode proration/webhook/reconciliation certification.
- Real-device/browser/accessibility/security/penetration testing.
- Legal/privacy/processor/retention/incident review.
- Canary/beta/support/on-call plan.
