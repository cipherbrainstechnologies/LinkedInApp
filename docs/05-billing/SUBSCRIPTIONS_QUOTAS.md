# Subscriptions, Proration, Refunds, and Quota Ledger

## 1. Product promise

Users pay for a monthly entitlement period with a defined successful-application limit. An upgrade during the period credits the unused paid time on the old plan against the remaining-time cost of the new plan where the provider/payment method supports it. The user sees an exact preview before confirming.

ApplyFlow distinguishes:

- **Proration credit:** value of unused old-plan time applied to a billing change.
- **Cash refund:** money returned through the payment provider.
- **Quota reversal:** application unit returned because a submission was not valid/confirmed.
- **Admin quota adjustment:** a compensating non-cash entitlement change.

Never label one as another.

## 2. Canonical plan design

- `product`: stable ApplyFlow Applications product.
- `plan`: stable marketing identity (`FREE`, `LAUNCH`, `POWER`).
- `plan_version`: immutable price/currency/interval/quota/features and provider mappings.
- A published plan version cannot be edited. Create/publish a successor.
- Existing subscriptions remain on their referenced version until an explicit migration/change.
- Provider price/plan IDs are per environment and currency.

Seed defaults:

| Plan | Interval | Applications | Example price |
| --- | --- | ---: | ---: |
| Free | Monthly entitlement period | 5 | ₹0 |
| Launch | Monthly | 50 | ₹299 |
| Power | Monthly | 100 | ₹499 |

Prices are examples and must be editable before production.

## 3. Sources of truth

- Stripe/Razorpay owns payment, invoice, refund, and provider subscription facts.
- ApplyFlow canonical subscription is a reconciled projection.
- ApplyFlow entitlement period and quota ledger own product access.
- Client redirects and browser success screens own nothing; they show pending until webhook/provider retrieval confirms.

## 4. Quota ledger convention

Use append-only entries with signed units:

| Entry | Signed units | Meaning |
| --- | ---: | --- |
| `GRANT` | `+limit` | Creates capacity for entitlement period. |
| `RESERVE` | `-1` available | Holds capacity for a queued application. |
| `RELEASE` | `+1` available | Releases a reservation. |
| `CONSUME` | Converts reserved to used | Recorded as paired accounting entries or a canonical event/projection without double-decrement. |
| `REVERSE` | Returns consumed unit | Compensates a proven invalid submission. |
| `EXPIRE` | Removes unused capacity | Closes period. |
| `ADMIN_ADJUSTMENT` | `+/-n` | Compensating support action with reason and permission. |
| `REFERRAL_GRANT` | `+n` | Capped promotional capacity. |

Choose one precise double-entry-like implementation and document it in code/ADR. Exposed projection must always satisfy:

```text
available = granted + bonuses + reversals + releases
            - reservations - consumed - expirations - negative adjustments
```

The database transaction prevents `available < 0`. Every entry has a unique operation key; no row is edited/deleted.

## 5. Periods and reset

- Paid period follows provider current billing period.
- Free period is a monthly entitlement anchored to signup/activation in UTC, not a vague calendar reset; show exact local reset time.
- On renewal confirmation, create the next entitlement period and `GRANT` its limit.
- If renewal is pending/past due, follow grace policy; do not silently grant a full paid period indefinitely.
- Unused quota does not roll over in MVP unless a future plan explicitly says so.
- Expiry never changes historical consumed metrics.

## 6. Reservation and consumption

1. `submit` command locks active entitlement projection.
2. If available < 1, return `QUOTA_EXHAUSTED`.
3. Append reservation and link it to application/operation key.
4. Worker executes.
5. On confirmed submission, atomically mark application submitted and convert reservation to consumption.
6. On final failure/cancel, release.
7. On waiting-user expiry, release but preserve application; resume must reserve again.
8. On uncertain submission, hold for a bounded verification window, then operator/policy resolution.

No quota is consumed for match generation, preparation, failed submit, or a blocked/expired job.

## 7. Upgrade quota semantics

Upgrade does not reset usage. It increases the entitlement limit for the same current period.

Example:

- Current plan limit 50.
- 20 consumed, 2 reserved, 28 available.
- Upgrade to limit 100 confirmed.
- Append an additional `GRANT +50` associated with plan change.
- New state: 20 consumed, 2 reserved, 78 available.

The UI may simplify to `80 of 100 remaining` only if it clearly accounts for reservations; preferred display is available now plus a small `2 in progress` label.

If new plan limit is below consumed+reserved, schedule downgrade at period end; never create negative availability.

## 8. Proration model

Provider preview is authoritative. Internal calculation is used only for display cross-check/testing and must not override provider amount.

Illustrative same-currency/time-based formula:

```text
period_seconds = period_end - period_start
remaining_seconds = period_end - effective_change_time
unused_old_credit = round(old_price_minor * remaining_seconds / period_seconds)
remaining_new_charge = round(new_price_minor * remaining_seconds / period_seconds)
subtotal_due = remaining_new_charge - unused_old_credit
tax_due = provider_or_tax_engine_result
due_now = max(0, subtotal_due + tax_due + adjustments)
```

Calendar/provider rules, discounts, taxes, coupons, billing modes, rounding, unpaid invoices, payment method, and regional regulations may change the result. Display the provider quote ID/expiry and exact line items.

### Required upgrade preview fields

- Current/new plan and quotas.
- Effective date: now.
- Period start/end and next renewal.
- Old-plan unused credit.
- New-plan remaining-period charge.
- Discounts/credits.
- Tax.
- Due now or credit outcome.
- Next full renewal amount.
- Used/reserved/new available quota.
- Provider and quote expiry.

## 9. Upgrade flow

1. Validate active subscription and target plan/currency/provider mapping.
2. Block/reconcile if current invoice/payment is unpaid or subscription state ambiguous.
3. Ask owning provider for preview; store short-lived quote snapshot/hash.
4. Show preview.
5. Confirm with idempotency key + quote ID/hash.
6. Revalidate quote and execute explicit immediate change/payment flow.
7. Mark local change `PENDING_PROVIDER`.
8. On verified provider event/retrieval, transactionally update canonical subscription, grant delta, audit, and notify.
9. On failure, retain old plan/quota and show safe recovery.

Never grant quota between steps 6 and 8 solely because a client returned from checkout.

## 10. Downgrade flow

- Default effective time: current period end.
- Record scheduled target plan and provider scheduled change/cancel-new plan mechanism.
- Existing quota remains until period ends.
- On renewal/change confirmation, close old period and create new plan period/limit.
- User can cancel scheduled downgrade before provider cutoff.
- If provider cannot schedule change safely, record internal schedule and perform via reconciliation worker with explicit idempotency/audit.

## 11. Stripe implementation

- Use immutable Stripe Price IDs per plan version.
- Set proration behaviour explicitly on subscription changes.
- Preview the upcoming invoice/change using the same effective proration timestamp passed to update where supported.
- Immediate paid upgrade should invoice/collect according to selected product rule; handle required payment action.
- If latest invoice is unpaid, do not grant a credit for unpaid time. Disable automatic proration/change, collect safely, or require payment recovery first.
- Use webhook signature verification/raw body and deduplicate event ID.
- Reconcile subscription/invoice/payment objects after ambiguous events.
- Use test clocks where appropriate for period-boundary tests.

## 12. Razorpay implementation

- Use immutable Razorpay Plan ID per plan version.
- Update an eligible subscription with explicit `schedule_change_at: now` for approved immediate upgrade or `cycle_end` for scheduled change.
- Account for provider restrictions by payment method/state (for example, an update may be unsupported for some mandate flows).
- A concurrent update/cancel/pause conflict is retryable only after fetching current state.
- Verify webhook HMAC from raw body; deduplicate `x-razorpay-event-id`.
- Immediate-change credit/charge/refund behaviour must be verified for the actual India merchant product/payment method in test mode before enabling the product promise.
- If provider behaviour cannot safely implement immediate proration, use cycle-end change or a reviewed alternate flow; UI must state timing accurately.

## 13. Payment-provider abstraction

```ts
interface SubscriptionBillingProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
  previewChange(input: PreviewChangeInput): Promise<ChangeQuote>;
  confirmChange(input: ConfirmChangeInput): Promise<ChangeResult>;
  scheduleCancellation(input: CancelInput): Promise<CancelResult>;
  reactivate(input: ReactivateInput): Promise<ReactivateResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  fetchSubscription(ref: ProviderSubscriptionRef): Promise<ProviderSubscription>;
  verifyWebhook(rawBody: Buffer, headers: SafeHeaders): VerifiedWebhook;
}
```

Canonical quote fields are consistent, but preserve provider line-item references for reconciliation. Do not implement the same call through conditionals scattered across controllers.

## 14. Checkout and payment states

- `CREATED`
- `REQUIRES_CUSTOMER_ACTION`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `EXPIRED`
- `CANCELED`

UI can poll canonical state after provider return and receives webhook-driven refresh. A timeout is `PROCESSING/UNKNOWN`, not failure, until reconciled.

## 15. Refund workflow

1. Admin/support opens refund against a provider payment with reason/category and amount.
2. Server validates refundable amount/currency/provider ownership and permission/dual approval threshold.
3. Create pending refund command with idempotency key.
4. Call provider.
5. Confirm through response/webhook/retrieval.
6. Record immutable refund, audit, and user receipt.
7. Monetary refund and quota change are separate explicit operations; do not automatically grant both unless policy says so.

Partial/full refunds and provider fees/tax treatment require finance/legal configuration.

## 16. Admin adjustments

- Support cannot edit balances directly.
- Choose reason code, signed units, expiry/period, and case reference.
- Large/negative adjustments may require elevated/dual approval.
- Show projected before/after.
- Append ledger/audit; notify user for material changes.
- Reversal of an adjustment is a compensating entry.

## 17. Taxes and invoices

- Provider/tax configuration determines tax; never calculate GST/VAT from a UI constant.
- Store customer billing country/state and tax identifiers only when needed.
- Display price tax-inclusive/exclusive consistently and legally for market.
- Provider invoice/receipt ID/URL is mapped to a short-lived safe access flow.
- Finance reports preserve original currency and separate gross, tax, discounts, refunds, fees (where available), and net.
- Final India GST invoicing/accounting design requires a qualified finance/tax review.

## 18. Webhook/reconciliation

- Durable raw receipt before processing.
- Signature verified.
- Unique provider event ID.
- Out-of-order safe projection using provider resource version/timestamps and fetch.
- Retryable handler with dead-letter visibility.
- Scheduled reconciliation for active/past-due/pending subscriptions, recent payments/refunds, and stuck changes.
- Differences create an alert/case; never silently overwrite ledger without an audited reconciliation command.

## 19. Edge cases

- Upgrade seconds before renewal: quote may expire; re-preview.
- Subscription changed in provider portal during local preview: version conflict/re-preview.
- Duplicate confirm request: same idempotent result.
- Webhook before API response: projection handles either order.
- Payment succeeded but webhook delayed: pending UI and reconciliation.
- Currency change: new subscription/migration; not an ordinary plan change.
- Plan mapping removed: published versions retain immutable mapping; alert.
- User cancels with in-flight application: application reservation follows entitlement grace policy.
- Refund after quota consumed: refund policy decides subscription/entitlement; do not erase historical application.
- Chargeback: restrict new paid actions, reconcile, preserve evidence/audit, support appeal workflow.

## 20. Test matrix

At minimum automate:

- Free grant/reset/expiry.
- Reserve/consume/release/reverse and concurrent last-unit attempts.
- 50 -> 100 upgrade with zero/some/all quota used.
- Downgrade scheduled when consumption exceeds lower limit.
- Preview expiry and changed subscription version.
- Exact integer rounding and period boundary.
- Stripe paid/unpaid invoice proration cases.
- Razorpay immediate/cycle-end/restricted update cases using simulator/test mode.
- Payment action required, fail, delayed webhook, duplicate/out-of-order webhook.
- Cancel/reactivate/renewal/past due/recovery.
- Partial/full refund and quota adjustment separation.
- Reconciliation discrepancy.
- Authorisation/audit/secret redaction.

Property tests should assert ledger invariants and non-negative availability across generated command sequences.
