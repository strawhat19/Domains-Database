# Shop Provider Decisions

Copyright 2026 strawhat19. Licensed under [MIT](../../../LICENSE).

Read this reference when choosing product research, commerce, payment, or fulfillment providers.
Keep project-specific choices, prices, contracts, credentials, and connection evidence outside `ai/`.
Recheck official documentation and regional pricing before recommending a paid integration.

## Select the Commerce Boundary

Preserve the destination's storefront, theme, shared services, and existing commerce architecture.
An AI store builder produces pages or listings; it does not prove supplier authorization or fulfillment.
An import extension moves product data; it does not establish a server API or order automation.
A connected MCP tool may operate existing stores without accepting orders from an arbitrary custom store.
Separate five decisions: research data, licensed catalog, commerce backend, customer payment, supplier fulfillment.

| Requirement | Preferred Candidate | Decision Condition |
| --- | --- | --- |
| Custom storefront and native Stripe payment | Direct supplier API, beginning with CJ evaluation | Confirm catalog fit, shipping destinations, payment funding, and supported after-sale operations |
| Custom storefront with established app ecosystem | Shopify with a supported fulfillment app | Accept Shopify Checkout and its payment/account boundaries |
| Custom sales channel through a middleware provider | DSers approved Channel app | Obtain developer approval, API documentation, scope, and commercial terms |
| AutoDS with a custom presentation | Supported commerce backend or confirmed private integration | Confirm backend compatibility and every required automated operation |
| Existing WooCommerce backend | AutoDS or DSers supported WooCommerce integration | Preserve WooCommerce ownership of product/order data and confirm the headless flow |

Choose one owner for customer orders, pricing, and refunds; avoid several backends independently mutating them.
Firestore can expose permitted realtime application state without becoming an unverified provider integration.

## Capability Matrix

“Documented” describes a provider contract, not a connection completed for the current project.
Read the selected provider's actual account permissions, supported suppliers, and regional restrictions.

| Provider Route | Research and Catalog | Orders and Tracking | Returns and Refunds | Programmatic Access |
| --- | --- | --- | --- | --- |
| CJ direct integration | Catalog, variants, inventory, freight; optional research tools | Documented order creation, wallet payment, logistics, and webhooks | Documented disputes and evidence; supplier approval still applies | Public REST documentation; credentials and quotas required |
| DSers approved Channel app | Supplier/channel product workflows; discovery tools | Order and fulfillment workflows advertised | Confirm exact dispute/return operations after approval | Open API approval and app review; MCP is a separate integration |
| AutoDS supported channel | Marketplace, sourcing, import, stock/price monitoring by plan | Automated ordering and tracking for eligible suppliers/channels | Eligible supplier returns; recovery to managed balance | Supported-channel integrations and MCP; arbitrary custom-store API unconfirmed |
| Shopify plus fulfillment app | Shopify catalog plus app-specific sourcing | Shopify orders plus app-specific fulfillment | Shopify customer refund plus separate supplier recovery | Shopify APIs; app-specific operations must be confirmed |
| WooCommerce plus fulfillment app | WooCommerce catalog plus app-specific sourcing | WooCommerce orders plus app-specific fulfillment | Commerce refund plus separate supplier recovery | WooCommerce REST API; app-specific behavior must be confirmed |

Product reviews, keyword search volume, and competitor sale-price averages are separate evidence sources.
Do not present a supplier's suggested retail price as a measured market average.
Do not present inventory, connected-store counts, or supplier sales as search volume.
Return unavailable metrics explicitly when the selected licensed source cannot supply them.

## Direct Custom Store and Stripe

Evaluate CJ as a direct supplier adapter when retaining native customer payment is a requirement.
Its documented APIs cover catalog lookup, variants, stock, freight, order creation, payment, logistics, and disputes.
Create supplier purchases only after trusted server confirmation of the customer payment and order checks.
Customer payment proceeds and supplier wallet balance are separate funds; model working-capital needs.
Validate price, freight, availability, and variant identity before ordering within configured limits.
Use provider callbacks plus bounded reconciliation to update application order state.
CJ dispute creation is restricted to orders created through its API; preserve that order provenance.
Supplier dispute approval or wallet recovery does not itself refund the customer's Stripe transaction.
Confirm refund, resend, cancellation, evidence, and return-label capabilities for the selected supplier route.
Do not infer that every customer return reason qualifies for reimbursement by the supplier.

## DSers and AutoDS Conditions

DSers offers Supplier and Channel app paths through its Open API developer program.
Developer approval, documentation access, sandbox access, and app review precede a production custom integration.
Obtain the operation contract and quote before treating a merchant subscription as custom API access.
Confirm supplier payment behavior, order intake, tracking callbacks, and after-sale scope after approval.
CSV exchange can support manual operations but does not meet autonomous fulfillment requirements.

AutoDS documents integrations with supported selling channels, including Shopify and WooCommerce.
Its API/non-API eBay terminology refers to its eBay connection, not an arbitrary-store developer API.
Its MCP connector operates connected stores; confirm custom order intake independently.
Use a supported backend or a written private integration agreement if choosing AutoDS for a custom storefront.
Confirm monitored product/variation limits, eligible suppliers, order-processor add-ons, and ordering credits.
Customer refunds remain distinct from supplier refunds credited to an AutoDS managed balance.

## Shopify and WooCommerce Alternatives

Shopify permits custom storefront presentation, while its terms require Shopify Checkout for associated store sales.
Do not design a default bypass that takes standalone Stripe payment and injects the resulting order into Shopify.
Shopify Payments normally replaces standalone Stripe as a separate gateway where Shopify Payments is supported.
Confirm regional payment availability, checkout customization, and the selected app's order/fulfillment behavior.
Preserve a clear boundary between application identity and commerce customer identity.

WooCommerce may provide a supported backend for AutoDS or DSers while retaining custom presentation.
Its REST API is a commerce API, not proof that a supplier app accepts every headless payment/order workflow.
Confirm the supported Stripe integration, order payment state, provider SKU mapping, tracking, and refund synchronization.
Account for WordPress hosting, maintenance, plugins, and an additional source-of-truth integration.
Treat a custom Stripe-to-WooCommerce bridge as a separate implementation requiring documented compatibility.

## Provider-Neutral Adapter Contract

Expose supported capabilities explicitly; unsupported operations return a typed unavailable result.
Keep provider calls, credentials, supplier funding, and privileged state transitions on the server.
Use normalized application models while retaining external product, variant, order, and tracking references.
Preserve app-owned identities; replacing a supplier mapping must not rewrite historical order snapshots.
Require operation provenance, currency, units, freshness, and provider status in normalized results.

| Capability | Required Behavior |
| --- | --- |
| Catalog discovery | Bounded filters/pages; source URLs; permitted media/data use; duplicate handling |
| Product quotation | Exact variant, destination, inventory, landed cost, and quotation validity |
| Supplier order | Stable application reference; retry-safe creation/payment; reconciliation before retry |
| Tracking synchronization | Verified callback ingestion; deduplication; bounded fallback polling |
| Cancellation | Provider-confirmed eligibility and result; separate customer payment reversal |
| After-sale request | Evidence intake, reason, eligibility, provider case reference, and status |
| Customer refund | Explicit policy/authority; retry-safe payment refund; supplier recovery tracked separately |
| Connection status | Supported operations, quota/funding availability, last confirmed sync, and actionable errors |

Verify callback signatures with the provider's current contract and enqueue work before acknowledging callbacks.
Never retry an uncertain supplier purchase blindly; reconcile its stable external reference first.
Configure spending, margin, stale-data, funding, and retry limits for the requested store.
Automate eligible routine cases and expose exceptions when the supplier requires evidence or judgment.
Keep research recommendations advisory until the requested import/publication operation is authorized.

## Cost and Data Rights

Quote costs by billing cycle, region, currency, variation/store limits, included operations, and renewal terms.
Include subscriptions, add-ons, usage credits, research APIs, AI usage, hosting, database reads, and scheduled jobs.
Separate payment processing, supplier goods, freight, duties, tax, returns, and supplier wallet funding.
Distinguish optional memberships from mandatory fees and promotional offers from ongoing rates.
Source products from licensed feeds or authorized supplier integrations; retain provenance and usage conditions.
Confirm rights to product images, videos, descriptions, reviews, and competitor data before publication.
Generated product copy cannot establish inventory, authenticity, safety claims, reviews, or delivery promises.

## Official Sources

- CJ: [authentication](https://developers.cjdropshipping.com/en/api/api2/api/auth.html), [catalog](https://developers.cjdropshipping.com/en/api/api2/api/product.html), [orders/payment](https://developers.cjdropshipping.com/en/api/api2/api/shopping.html), [disputes](https://developers.cjdropshipping.com/en/api/api2/api/dispute.html), [webhooks](https://developers.cjdropshipping.com/en/api/api2/api/webhook.html).
- CJ: [quotas](https://developers.cjdropshipping.com/en/api/api2/standard/points.html), [rate limits](https://developers.cjdropshipping.com/en/api/api2/standard/limit.html), [memberships](https://www.cjdropshipping.com/prime), [service fees](https://www.cjdropshipping.com/service-fee), [returns policy](https://www.cjdropshipping.com/dispute-policy.html).
- DSers: [Open API](https://www.dsers.dev/), [developer approval](https://help.dsers.com/partner-account-registration-for-third-party-app-integrations-2/), [plans](https://www.dsers.com/pricing).
- AutoDS: [supported channels](https://help.autods.com/en/articles/12699877-supported-selling-channels-stores-marketplaces-and-shops), [WooCommerce integration](https://help.autods.com/en/articles/12699992-woocommerce-stores-how-to-configure-and-integrate-your-store), [MCP](https://www.autods.com/blog/autods-mcp-connector/).
- AutoDS: [plans](https://www.autods.com/pricing/), [ordering credits](https://help.autods.com/en/articles/12700458-auto-order-credits-for-order-automation-and-tracking-conversion), [fulfillment terms](https://help.autods.com/en/articles/12699825-fulfilled-by-autods-fba-automation-terms-and-conditions).
- Shopify: [checkout terms](https://www.shopify.com/legal/terms), [payment gateway availability](https://help.shopify.com/en/manual/payments/third-party-providers/payment-gateway-availability), [pricing](https://www.shopify.com/pricing).
