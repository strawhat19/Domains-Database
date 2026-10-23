# Private Payments And Subscription Reports

The Payments report is available to active Owners at `/payments`, under Dashboard navigation, and as compact panels on the Owner's Profile and Dashboard overview. `/admin/payments` redirects to the canonical page. Other roles do not receive business payment reports; their existing personal subscription flow remains separate.

## Data Boundary

`GET /api/admin/payments?days=7|30|90` authenticates the Firebase session and resolves the current account before accessing report data. The server reuses the existing private billing identity and restricted Stripe configuration. The report is read-only and does not create customers, change subscriptions, grant entitlements, refund payments, or initiate payouts.

The dataset is this app's approved USD Starter subscriptions, bound through private app billing records, their identity/customer mappings, exact subscription metadata, and the configured Starter price. Unrelated activity in the Stripe account, the public pricing catalog, Free accounts without Stripe subscriptions, and Owner access bypasses are not reported as paid subscriptions. No caller-selected Stripe account, customer, product, price, currency, or provider URL is accepted.

Responses contain aggregate amounts, counts, UTC buckets, status labels, coverage, freshness, and metric definitions. They exclude names, emails, addresses, card details, bank details, customer IDs, subscription IDs, invoice IDs, hosted invoice links, raw provider objects, and credentials. Protected responses and errors use private/no-store caching policy. No new Firestore collection or public projection is introduced.

## Metric Meanings

- **Paid Invoice Amount:** Stripe invoice `amount_paid`, summed in cents for invoices whose `status_transitions.paid_at` falls in the selected UTC range. This is not net revenue, a bank deposit, a payout, or a refund-adjusted total. Invoice payments can include credits or payments recorded outside Stripe; refunds, fees, and tax treatment require separate accounting data.
- **Paid Invoices:** The number of qualifying paid invoices in that range. A zero-value paid invoice is not evidence of a nonzero card payment.
- **New / Ended Subscriptions:** Subscription creation and actual end dates within the selected range. Scheduled cancellation does not count as an ended subscription while service continues.
- **Subscription Statuses:** The current Stripe status snapshot at the report's stated timestamp, independently of the selected historical chart range. An active status alone does not prove an invoice was settled.
- **Monthly Plan Value:** The approved monthly list price for qualifying active subscriptions before discounts, credits, tax, fees, refunds, and proration. It is not accounting MRR or collected cash.

Money is USD cents throughout the report contract. Other currencies or prices are not silently added to this dataset. The range includes the partial current UTC day. Successful, complete source reads can establish zero activity; permission failures, timeouts, missing setup, and incomplete scans cannot.

## Coverage And Availability

The server bounds account, subscription, and invoice reads, request duration, concurrency, and any short-lived report cache. Each report includes separate coverage for accounts, subscriptions, invoice history, and lifecycle data. Unknown totals and unconfirmed buckets remain null and display as unavailable. Charts preserve unavailable gaps rather than connecting across them or manufacturing zeroes. Warnings identify partial or unavailable coverage.

The browser/native client requests only the signed-in Owner's authorized report, aborts superseded requests, and clears data when account or role scope changes. Refresh revalidates the report; source and snapshot timestamps remain visible. Native requests use the fixed canonical server origin.

## Configuration And Release Status

The report uses the existing `STRIPE_SECRET_KEY`, `STRIPE_STARTER_PRICE_ID`, and `FIREBASE_SERVICE_ACCOUNT_JSON`. Existing invoice/subscription read permissions are intended to suffice. An actual Stripe denial remains an unavailable report; this implementation does not expand key permissions. Keep all private variables server-only.

This feature is being prepared in the local source. It has not been committed or deployed as part of this change. Focused authorization/aggregation checks, export verification, and live authenticated report readback are separate evidence levels and must be recorded when performed.

## Validation — October 23, 2026

- Focused server report tests: 20/20 passed, using isolated Stripe/Firestore fixtures without external requests.
- Focused client tests: 8/8 passed, including Owner/account boundaries, request cancellation, nullable metrics, response projection, and the canonical native endpoint.
- Production web export: passed with 81 static pages and 22 API routes. Exported-handler startup checks: 8/8 passed, including the Payments endpoint's private JSON 401 response with provider networking forbidden.
- Client secret scan: 512 exported client files scanned, zero configured private-secret or private-key/Stripe-secret/webhook-secret pattern matches.
- TypeScript: clean HEAD `c473dd5` and the feature worktree each reported the same 46 existing diagnostics; comparing file, code, and message found zero new diagnostics.
- Authenticated local Chrome readback: the Owner's full Payments page, Profile summary, and Dashboard summary loaded from the real authorized reporting endpoint. The 7/30/90-day controls, Chart/List views, refresh, and source/coverage disclosure worked. Profile and Payments document width matched the 1,292-pixel desktop viewport, with no page-level horizontal overflow.
- The current app dataset contained zero linked billing subscriptions. The displayed zero totals came from the completed private billing-account scan; no Stripe API calls were needed. Stripe invoice/subscription read access therefore remains unverified against a nonempty live dataset. No charges or subscription mutations were performed.

The browser check found duplicate half-cent labels in empty charts. The shared web/native chart scale now uses whole-cent/count midpoints; the final labels were confirmed in local Chrome after the export. No further production export was run for that two-line display-only adjustment. Native device behavior and the production Payments endpoint have not been verified or deployed for this feature.

## Primary References

- [Stripe invoice amounts and timestamps](https://docs.stripe.com/api/invoices/object)
- [Invoices paid outside Stripe](https://docs.stripe.com/api/invoices/pay#pay_invoice-paid_out_of_band)
- [Subscription status meanings](https://docs.stripe.com/billing/subscriptions/overview#subscription-statuses)
- [Stripe subscription analytics and MRR definitions](https://docs.stripe.com/billing/subscriptions/analytics)
- [Restricted key access](https://docs.stripe.com/keys-best-practices#limit-access)
