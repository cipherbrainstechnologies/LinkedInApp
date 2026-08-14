# External Integration Runbook

## 1. Adapter principle

Every provider implements an internal port and maps provider-specific states/errors into canonical ApplyFlow schemas. Provider SDK objects never cross into domain or client contracts.

All adapters have:

- `mock` implementation for local/demo.
- Health check that does not cause a billable/destructive action.
- Typed configuration and secret reference.
- Timeouts, retry classification, rate/concurrency limits.
- Idempotency and request ID capture.
- Contract fixtures with sanitised provider examples.
- Feature flag/kill switch.

## 2. LinkedIn OIDC

### Purpose

Authentication and lite identity claims only.

### Requested scopes

`openid profile email`

The profile scope returns lite claims such as ID/subject, name, and profile picture. Email may be absent. It does not provide complete employment history.

### Server flow

1. Create state, nonce, PKCE verifier/challenge, intended safe return route, and short expiry.
2. Redirect to LinkedIn authorisation endpoint.
3. Receive code, verify state, exchange server-side.
4. Validate ID token with discovery/JWKS, issuer, audience, expiry, nonce, and algorithm.
5. Map `sub` to `user_identities`; handle account linking only through verified flow.
6. Propose name/picture/email; do not overwrite user-confirmed values silently.
7. Establish web/mobile session.

### Production configuration

- LinkedIn developer application/product approval.
- Exact HTTPS redirect URIs for web and mobile intermediary.
- Client ID and secret in secret manager.
- Privacy policy/terms URLs and approved brand assets.
- No broad redirect wildcards.

### Tests

Nonce/state mismatch, expired code, bad audience/issuer/signature, missing email, duplicate identity, account-link conflict, denied consent, key rotation/JWKS cache.

## 3. Job discovery providers

Implement `JobDiscoveryProvider`:

```ts
interface JobDiscoveryProvider {
  search(input: ProviderSearchInput, context: RequestContext): Promise<ProviderSearchPage>;
  getJob(input: ProviderJobRef, context: RequestContext): Promise<ProviderJobResult>;
  healthCheck(): Promise<ProviderHealth>;
}
```

Only enable providers with a licence/API/terms basis that covers the intended search, display, caching, and commercial use.

Adapter maps:

- Provider/source ID and canonical URL.
- Job/company/title/location/work mode/employment type.
- Description/requirements/benefits.
- Salary with explicit unknown/source currency.
- Posted/expiry time.
- Apply method/capabilities.
- Attribution and deletion/refresh obligations.

Never present source data as current after its provider-defined TTL. Remove or refresh deleted/expired jobs.

## 4. User-supplied URL importer

### Network safety

- Accept only `https` by default; allow `http` only for local mock provider.
- Parse with a strict URL library and canonicalise hostname.
- DNS resolve and block loopback, link-local, private, metadata, multicast, and reserved ranges for every redirect.
- Limit redirects and revalidate each destination.
- Egress proxy/allowlist where possible.
- Set connect/read/total timeouts and byte limit.
- Do not send internal headers/cookies.
- Reject embedded credentials and unsafe ports.
- Limit HTML/content types and decompression ratio.

### Extraction order

1. Known official API/provider endpoint where approved.
2. Schema.org `JobPosting` JSON-LD from a public page.
3. Supported ATS public structured endpoint/HTML under domain policy.
4. Bounded visible-text extraction plus AI normalisation.
5. Assisted/track-only result.

Never use browser login or cookies to turn a public import into private scraping.

## 5. ATS/application connectors

Candidate connectors should be prioritised by official/public documented integration and customer demand. Each connector supports only declared capabilities and domain policy.

Connector configuration contains provider API version, endpoint allowlist, auth secret reference if contracted, rate limit, field mappings, question schema, receipt mapping, and test fixtures.

For public job-board forms without a contractual API, legal/policy approval is required before prefill/account creation/submit is enabled. Technical support alone is insufficient.

## 6. Stripe Billing

### Use

International/card subscription option and authoritative proration preview/change where available.

### Pattern

- Create customer/subscription/checkout server-side.
- Persist provider customer/subscription/price IDs mapped to immutable plan version.
- Use provider preview/upcoming invoice capability for upgrade quote.
- For immediate upgrade, select explicit proration behaviour; do not rely on an SDK default.
- Do not credit unpaid time: inspect latest invoice/payment and choose safe behaviour/reconciliation.
- Grant entitlement only from verified webhook/provider retrieval.
- Use provider-hosted portal only for supported actions and reconcile every resulting event.

### Webhooks

At minimum map checkout completion, invoice/payment success/failure, subscription created/updated/deleted, refund/credit events relevant to configured flow. Verify the provider signature against raw body and deduplicate event ID.

### Test cases

Upgrade halfway through period; near-boundary upgrade; unpaid latest invoice; duplicate/out-of-order webhook; payment action required; downgrade at period end; cancel/reactivate; refund; plan mapping missing; currency mismatch.

## 7. Razorpay Subscriptions

### Use

India-first recurring payments where the merchant account/payment method supports the planned subscription change flow.

### Pattern

- Server creates customer/plan/subscription or approved checkout flow.
- Published ApplyFlow plan version maps to immutable Razorpay plan ID.
- Subscription update uses explicit `schedule_change_at` intent (`now` or `cycle_end`) and handles provider/payment-method restrictions.
- Treat immediate update response/webhook as provider-specific; entitlement changes only after confirmed outcome.
- Where provider-native proration/refund behaviour cannot meet the product promise for a payment method, schedule at cycle end or use an explicitly reviewed cancel/new-subscription/credit workflow.

### Webhooks

- Verify HMAC SHA-256 using the unparsed raw body.
- Deduplicate using `x-razorpay-event-id` plus provider event metadata.
- Reconcile subscription/payment/refund state through provider fetch when needed.

### Test cases

Immediate upgrade success/failure; cycle-end change; E-mandate/update restriction; concurrent operation conflict; duplicate event; delayed event; refund/credit; halted/pending subscription; currency/plan mapping error.

## 8. Billing-provider ownership

- User chooses/receives one provider at subscription creation based on market/configuration.
- Do not switch an active subscription between Stripe and Razorpay through an ordinary upgrade.
- Provider migration is an explicit state machine: schedule cancel, preserve entitlement through paid period, create new subscription with no overlap/double charge, reconcile, and audit.
- Reports normalise money by original currency. Any converted report uses stored daily FX reference and clearly labels it; accounting source remains original currency/provider.

## 9. OpenAI

- Use the official server-side SDK and Responses API.
- Structured extraction uses strict JSON Schema/SDK Zod support through `text.format`, followed by local Zod validation.
- Set `store: false` for candidate/job tasks unless a reviewed retention requirement says otherwise.
- Keep API keys in server secret manager; never send to browser/mobile.
- Capture provider request ID, model configured, token usage, latency, and safe error category.
- Use project/environment separation, spend/rate limits, and a model string configured from admin—not client input.

## 10. Anthropic

- Use the native official TypeScript SDK and Messages API, not the OpenAI compatibility layer for production.
- Structured extraction uses native Structured Outputs through `output_config.format` with JSON Schema, followed by local Zod validation.
- Handle stop/refusal/truncation reasons explicitly.
- Store API key in server secret manager and capture request ID/usage/latency.
- Provider/model-specific parameters are filtered; do not send unsupported generic sampling fields.

## 11. Object storage

- S3-compatible private buckets/prefixes: quarantine, clean source, derived text, evidence, exports.
- Server creates short-lived signed operations scoped to exact key/content constraints.
- Object keys are opaque; original filenames stored separately and sanitised on download.
- Server-side encryption/KMS, bucket public-access block, lifecycle/retention, and access logging.
- MinIO supplies the same port locally.

## 12. Email and push

Define `NotificationProvider` with email, push, and local in-app implementations. Templates are versioned and localised.

- Email links are single-use, short-lived, and origin-bound.
- Push payload contains safe title/body and opaque deep-link ID only.
- Unsubscribe/preferences apply to non-essential messages; security/transactional policy is separate.
- Mailpit and mock push inbox support deterministic demo/tests.

## 13. Secret administration

Admin UI may create/rotate/test secret references but never read secret plaintext after submission.

Production flow:

1. Admin submits secret over protected TLS/fresh-auth route.
2. API writes secret to managed secret store/KMS envelope and retains reference/version only.
3. Response returns last four/fingerprint, created/rotated time, status.
4. Test uses a non-destructive provider call and records audit/result.
5. Rotation supports overlap where provider permits; revoke old version after validation.

Local development reads named environment variables. Do not store encrypted secret blobs in the same database without an external key hierarchy and rotation plan.

## 14. Production integration checklist

- Contract/account and lawful/terms basis approved.
- Separate test and production resources/keys.
- Least-privilege secret/service account.
- Endpoint/redirect/egress allowlist.
- API/version pin and deprecation owner.
- Request/response schema fixtures.
- Timeouts, retry, idempotency, rate/concurrency limits.
- Webhook signature, duplicate, order, and replay tests.
- Data categories/retention/deletion mapped.
- Metrics, alerts, dashboard, runbook, kill switch.
- Canary and rollback exercised.
