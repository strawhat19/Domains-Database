# Store Implementation Contract

Copyright 2026 strawhat19. Licensed under [MIT](../../../LICENSE).

Read with [Shop](../SKILL.md). These are reusable boundaries; actual collection names, routes, schemas, cloud resources, prices, and setup evidence belong in the destination's code/docs. Adapt them to existing architecture rather than creating parallel stores or caches.

## Models And Privacy

| Boundary | Required Information | Access |
| --- | --- | --- |
| Store product/category | Stable identity, category, public copy/media, options/variants, integer money/currency, publication, fulfillment mode | Published public projection; permitted staff authoring |
| Section placement | Stable slot/section/category, product reference, order, revision | Public-safe current placement; staff writes |
| Market candidate | Provider product/variant references, source URL/time, match reasons, verified facts, nullable metrics, cost/freight, delivery/stock, readiness, exclusions | Shop administrators only |
| Supplier binding | Product/variant-to-supplier mapping, connection, cost/funding, manual locks, sync revision | Private server/staff projection; never public catalog |
| Order/line | Customer ownership or scoped guest access, immutable bought-product/variant/price snapshots, destination, quoted shipping/tax, fulfillment groups | Customer's own safe view and permitted operators |
| Payment/refund | Order reference, provider IDs, integer amounts/currency, attempts, verified events, financial status | Server writes; permitted customer/staff projections |
| Shipment/return | Line/group reference, actual carrier/tracking, evidence, deadlines, supplier case, customer resolution | Scoped customer/operator view |
| Job/outbox/audit | Stable operation reference, actor/scope, stage, lease/retries, committed counts, errors, spending, provider event references | Server writes; permitted staff status |
| Connection | Owning account/store, safe configuration/verification metadata and secret reference | Private account scope; credentials server only |

Use the app-owned Type_Number_Name_Date_UUID identity contract with an atomic matching integer allocation. External references live in named fields. Deduplicate imports through a connection/provider/product/variant key and persisted mapping; infrastructure keys follow documented exceptions. Do not expose supplier prices, secrets, raw private payloads, customer addresses, or financial events in public products.

Keep source modes for self-fulfilled and supplier-fulfilled goods. Existing services remain outside supplier procurement. Never overwrite an owner's own goods or manually locked fields with supplier/AI updates. Existing serializers that overwrite complete records require a compatible migration before adding fields; allowlisting only the reader is insufficient.

One shared facade owns catalog/category/placement subscriptions, candidate/job pages, cart/quote operations, imports, order/payment/tracking and permitted refunds. Use bounded realtime queries for active views and cursor history; cleanup on account/capability changes. Preserve last confirmed state with an error rather than silently substituting samples. Search/counts disclose loaded coverage unless a real full-catalog service exists.

## Store, Market, And Placement Changes

Reuse one Store table and one Market table across admin and modal views, with scoped props and distinct element IDs. Preview restrictions must not accidentally call existing save/status handlers. Connected controls use the same service/rules/server capabilities as their routes.

Distinguish these operations explicitly:

- **Import:** create or update the stable Store draft for an approved candidate and exact variants; retain provenance, field locks, import mapping, exclusions, and confirmed result.
- **Swap:** point the selected section slot to another eligible existing Store product in the same category/section. Do not rename or rewrite the old product to masquerade as the replacement. Allow the destination to choose exchange-two-slots semantics explicitly.
- **Replace:** import the chosen Market item if necessary, then update that selected slot only after the import commits. If validation fails, preserve the original placement and keep the imported item an unpublished draft.

Model current placements independently of product identity. Validate expected slot revision, original category/section and current actor atomically; reject stale edits. Use stable operation keys and a recoverable transaction/job for multi-step replacement. Decide whether duplicates are allowed in the section. Product removal/archive must preserve paid-order references and exclude intentional removals from automatic reimport.

## Evidence And Research Jobs

Research receives a trusted store profile: existing categories, section rules, design tone, licensed examples, destinations, currency, permitted suppliers, minimum contribution margin, delivery bounds, and spend limits. Capture these from actual confirmed store records; don't infer cloud contents from local seed data. AI may rank or draft from evidence, but can't invent ingredients, reviews, origin, authenticity, certifications, stock or delivery promises.

Candidate facts need source URL/provider reference, observation time, currency/unit, target country/language/period, sample size and confidence where applicable. Keep supplier reviews distinct from customer reviews at this store. Average sale price uses a disclosed licensed competitor set and comparable variant/shipping/tax basis; suggested retail price is a different field. Search volume is monthly keyword demand for a selected region/language, not verified product sales. Trend interest is a normalized relative index, not an absolute monthly count.

Pipeline: authorized request -> durable job -> supplier discovery -> normalize/validate -> category/section fit -> duplicate/exclusion check -> metrics -> rank -> commit -> publish committed outcome to job subscribers. Requesting N means a target of N usable additions, not permission to manufacture N when sourcing fails. Report Added, Already Known, Rejected, Partial, Failed and Unavailable truthfully. Deduplicate scheduled/manual runs, bound per-store concurrency, page requests, apply quotas/backoff and stop at budget caps.

Expose stages and actual processed/expected counters; don't fabricate wall-clock percentages. A run continues after a modal closes because the backend owns it. Opening admin/Replace subscribes to the same scoped job/candidate state. Initial target is 30–50 valid products, expandable through bounded pages. Reuse/cursor-filter persisted results rather than loading an unlimited supplier catalog.

Schedule discovery two–four times/day as a configurable starting point. Stock/cost updates, keyword refresh, tracking and reconciliation have independent schedules suited to provider contracts. Cache monthly demand until the source refreshes and enrich new keywords in batches. Persist query cache keys including store, country/language, source, timeframe, connection revision, and requested filters.

## Native Payment And Procurement

Use one merchant payment account for a single-merchant store; Stripe Connect is needed only for a separately requested multi-seller payout model. Preserve public browsing and the destination's guest/account checkout policy. Customer authentication and merchant secret ownership are distinct.

The server owns the authoritative quote: published eligible product, exact variant/quantity, integer amount/currency, destination-specific freight/tax/discount, freshness, stock/reservation, expiry, and financial policy. Browser amounts are display data. Customer reviews/assent to changed quotes precede payment; never charge extra silently. Reserve owned inventory atomically; supplier stock isn't reserved unless the API guarantees it. TTL cleanup alone cannot release reservations reliably.

Stripe Elements keeps sensitive payment fields on Stripe's boundary and integrates into the destination's checkout. Verify the current supported Checkout Sessions/API version; avoid copying obsolete ui_mode values. Store provider IDs and safe status only, never card data. Distinguish payment Pending/Paid/Failed/Expired/Partially Refunded/Refunded/Disputed from fulfillment Requested/Purchasing/Accepted/Shipped/Delivered/Cancelled/Exception and supplier after-sale state.

Signed Stripe webhooks plus authoritative payment retrieval update financial state. Durably deduplicate events and commit an outbox before acknowledging; duplicates/reordered deliveries cannot queue duplicate procurement. A customer redirect cannot mark an order paid. Start with immediate payment methods unless delayed-payment reservations and failure recovery are implemented.

After payment, workers recheck variant, stock, destination, complete landed cost, supplier balance and Owner purchase limits. Reserve procurement budget atomically across workers. External calls happen outside database transaction callbacks. Use provider idempotency where documented; after an uncertain response, query the stable order reference before retrying. If certainty cannot be established, pause that purchase and expose Purchase Unknown. Prevent duplicate purchases across restarts and expired worker leases.

Split mixed carts into fulfillment groups, with line-level shipments/refunds and immutable original prices. Supplier wallet cash and Stripe payouts are independent. Keep a working-capital reserve, loss allowance and kill switch. A procurement pause must leave reconciliation and customer refunds available. Webhooks supplement periodic reconciliation; a tracking number alone isn't shipment or delivery confirmation.

## Returns And Refunds

Automate eligible routine cancellation, evidence collection, supplier dispute submission, tracking checks, return labels where supported, and customer refunds within explicit reason/deadline/amount policies. Keep retailer support/customer obligations distinct from supplier reimbursement rules. Seller remains responsible for promises even when a supplier dispatches goods.

A customer refund doesn't cancel a supplier purchase; a supplier wallet credit doesn't refund the customer. Track both results independently with operation keys, exact line amounts, available funds, partial refunds, restocking/return shipping, evidence, deadlines, approval and exception states. Never wait indefinitely for supplier recovery to resolve an eligible customer issue. High-value/ambiguous/fraud/unsupported cases go to the permitted exception inbox. Do not silently substitute goods; alternate suppliers need approved equivalent exact variants and bounded cost/delivery.

## Production And Handoff

Reuse public About, Terms, Contact, Privacy and aliases, current-year Piratechs footer, sticky header/attached bars, reduced motion, scroll-to-top and custom-domain/PWA behavior. Before live sales, adapt shipping, returns, cancellation, support, tax and product-specific policy content to real operations. Private order/payment pages and secrets must not enter public/offline caches.

Show actual source/freshness, unavailable metrics, payment/fulfillment exceptions, low funds, stale catalog, quota/spend use, and per-store buying pause. Real financial reports distinguish revenue, refunds, fees, tax, freight, supplier spend and contribution margin; sample/recent unpaid totals aren't revenue. Owner chooses spending/refund thresholds; an Admin role alone does not lift them.

When verification is authorized, cover tampered quotes, denied roles/ownership, concurrent stock/slot edits, duplicate/reordered events, ambiguous supplier timeouts, partial shipments/refunds, locked fields, sign-out cleanup, preview/live isolation and recovery. Keep future acceptance criteria separate from checks actually performed. Deliver source completion, external connection/setup needs, and user validation status separately.
