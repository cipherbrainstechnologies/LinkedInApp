# Official Source Links

Reviewed on 2026-08-14. Provider documentation and terms can change; re-check at implementation and every domain-policy/provider review. These links support architectural choices but do not replace contracts or legal advice.

## LinkedIn

- [Sign In with LinkedIn using OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) — OIDC scopes and lite claims; email may be absent; sign-in is not identity verification.
- [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement) — current restrictions include unauthorised scraping and bots/automated access.
- [LinkedIn Jobs Terms and Conditions](https://www.linkedin.com/legal/jobs-terms-conditions) — job-product-specific automation/scraping restrictions and contractual terms.

## OpenAI

- [Responses API overview/reference](https://developers.openai.com/api/reference/responses/overview/) — current primary API surface for model responses.
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — JSON Schema adherence and SDK type/schema guidance.
- [API overview and authentication](https://developers.openai.com/api/reference/overview/) — keep API keys secret and server-side; request/rate-limit IDs.
- [Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices) — separate projects, key security, limits, scaling, cost, and production considerations.

## Anthropic/Claude

- [Using the Messages API](https://platform.claude.com/docs/en/build-with-claude/working-with-messages) — native message flow and stop/refusal handling.
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — native JSON Schema output through `output_config.format`.
- [Official SDKs](https://platform.claude.com/docs/en/cli-sdks-libraries/overview) — native TypeScript and other clients.
- [OpenAI SDK compatibility limitations](https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk) — compatibility layer is not the preferred production path and does not honour generic strict/response format as native Structured Outputs does.

## Stripe

- [Subscription prorations](https://docs.stripe.com/billing/subscriptions/prorations) — proration uses current-period timing and requires care with unpaid invoices.
- [Change subscription price](https://docs.stripe.com/billing/subscriptions/change-price) — upgrade/downgrade price replacement and proration options.
- [Update a subscription API](https://docs.stripe.com/api/subscriptions/update) — explicit update/proration parameters and provider contract.

## Razorpay

- [Update a Subscription API](https://razorpay.com/docs/api/payments/subscriptions/update-subscription/) — immediate vs cycle-end subscription changes and state/payment-method restrictions.
- [Validate and Test Webhooks](https://razorpay.com/docs/webhooks/validate-test/) — HMAC over raw body and duplicate handling using event ID.
- [Fetch pending subscription update](https://razorpay.com/docs/api/payments/subscriptions/fetch-pending-update-details/) — scheduled change inspection.

## Cursor execution

- [Cursor Rules](https://cursor.com/docs/rules) — `.cursor/rules/*.mdc` and `AGENTS.md` behaviour.
- [Using Agent in CLI](https://cursor.com/docs/cli/using) — repository rules/`AGENTS.md`, modes, and local execution context.
- [Cloud Agent best practices](https://cursor.com/docs/cloud-agent/best-practices) — environment, rules, tools, and local testability guidance.

## India privacy

- [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/content/digital-personal-data-protection-act-2023) — official MeitY source.
- [Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025) — official MeitY source; counsel must verify current commencement/application.
