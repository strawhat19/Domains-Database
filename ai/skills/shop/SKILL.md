---
name: shop
description: Add or extend a themed Firestore store with public product pages, cart, native Stripe checkout, permitted shop administration, sourced dropshipping discovery, and supplier fulfillment; adapt an existing store or scaffold missing account foundations within the requested scope.
---

# Reusable Shop System

Copyright 2026 strawhat19. Licensed under [MIT](../../LICENSE).

Build the requested store using the destination's framework, theme, records, and shared service boundaries. Reuse working modules; create missing store/account prerequisites rather than replacing an established application. This skill also supports a disconnected preview or planning request: in those modes, do not connect providers, persist preview data, publish goods, charge customers, or purchase inventory.

## Read And Scope

Read the destination's AGENTS.md and the applicable shared guides in their prescribed order: [structure](../structure/structure.md), [database](../database/database.md), [API](../api/api.md), [authentication](../authentication/authentication.md), [social/privacy](../social/social.md), [routes](../routes/routes.md), then [Admin](../admin/SKILL.md). For account foundations use its [Firestore](../admin/references/firestore.md), [connections](../admin/references/connections.md), and [layout](../admin/layout.md) contracts. Read [the store contract](references/system.md) for commerce implementation and [provider decisions](references/providers.md) for supplier selection. Read other Admin/App System contracts only for modules actually requested.

Inventory the actual public shop, category/section placements, cart, checkout, orders, payments, auth, roles, route metadata, pagination, Firebase adapters, rules, and indexes. Distinguish implemented source from verified live connectivity. Preserve existing records, IDs, narrower permissions, and owner edits. Keep application-specific schemas, provider choices, current pricing, setup history, and connection evidence in project docs outside `ai/`.

For a new store, default to public browsing, Firebase Google/email authentication, realtime Firestore, a private Profile and active trusted Owner-only shop operations. Give Admin/Developer or other roles narrower capabilities only when the user explicitly chooses that destination policy; technical access does not automatically grant sales or refund authority. New accounts are Subscribers and trusted provisioning assigns privileged roles. Reuse the shared account shell and route/capability registry. A shop request does not add unrelated chat, blog, or the entire app core.

## Build The Requested Experience

- Public landing store section, shop/category/detail pages, cart, internal checkout, customer order status, and accessible responsive product cards matching the destination's design. Keep or add the existing PWA/native target within scope.
- Shop administration with Products, Orders, Payments, and permitted connection/status controls. Products has **Store** as default and **Market** second. Reuse shared tables, filters, pagination, status cells, icons, theme tokens, and measured shell geometry.
- Market starts with a target of 30–50 genuinely sourceable matching products once connected. Include supplier/variant evidence, reviews, sale-price benchmarks, keyword volume, trend interest, landed costs, margin, stock, delivery, freshness, and import readiness where sources actually support them. Missing metrics stay unknown. Keep Market private.
- Product-card settings gear for the Owner or an explicitly user-authorized shop operator, at the top right outside the product link; modal contains product settings, Products Admin navigation, and Swap / Replace. **Swap** uses the Store table restricted to the original category and section; **Replace** uses the same Market table and research operation with that scope. Other viewers receive no editing controls.
- Import icon per Market row, import review/publication controls when connected, and research counts **1 / 3 / 5 / 10** on Market and **1 / 3 / 5** inside Replace. Jobs report genuine stages, saved counts, partial failures, and costs; use a spinner unless measured progress supports a percentage.

In preview mode, label all concept rows and simulated progress visibly. Keep import/save/swap actions inert or disabled. Never invent real supplier availability, ratings, reviews, prices, trends, or search volumes to make the table appear connected.

## Connect In Small Complete Slices

1. Reuse or implement the missing catalog/account/admin foundations and typed store models. Map public projections, private procurement, customer orders, payment events, jobs, placements, and account connection metadata to permitted queries/rules/indexes. Preserve compatible existing readers/writers.
2. Confirm one supplier's supported API and product fit with current official documentation. A platform app, extension, MCP connector, or AI website builder does not establish arbitrary custom-store order intake. Recommend a direct API for native Stripe; Shopify commerce requires its Checkout. Report unavailable capabilities before buying subscriptions.
3. Add research as a durable, bounded job with sourced normalization, deterministic category/section matching, deduplication, spend/quota controls, and confirmed Firestore commits. Cache slowly changing metrics; schedule discovery separately from stock/cost/tracking updates.
4. Implement retry-safe import and transactional placement changes. Preserve manual field/price locks, removed-product exclusions, stable internal identities, and historical order snapshots. An import normally creates an unpublished draft; only an explicitly configured approval can publish it.
5. Keep the native checkout design through Stripe Elements/Payment Element, preferably backed by the currently supported Checkout Sessions integration. Recheck current API/SDK requirements. Hosted Checkout is an optional product choice, not a forced redesign. Server quotes and verified webhooks own payment state; the browser success page never authorizes fulfillment.
6. Implement a supplier adapter, durable procurement outbox, funded/spend-limited workers, tracking, reconciliation, returns, customer refunds, and an exception inbox. Supplier recovery and customer refund are separate records/operations. Confirm exact variant/destination/landed cost before buying and reconcile uncertain purchases before retrying.

Stripe can be connected alongside catalog/supplier work; it is unnecessary before preview or research. Both verified payment and fulfillment must be ready before accepting live paid dropship orders. Preserve existing unpaid-request flows until the connected flow is deliberately enabled.

## Adoption Prompt

> Use ai/skills/shop/SKILL.md to build and connect a store to this app the way I like: store section on the landing page, shop pages, cart and internal Stripe checkout, Firestore data, permitted shop administration, and a Market of matching dropshipping products. Reuse existing authentication/Profile/Admin/roles, or implement the missing foundations. Match this app's look and feel. Include Store/Market tables, product-card settings with category/section-safe Swap/Replace, sourced research jobs, controlled fulfillment/tracking/refunds, current provider pricing, and precise missing setup.

Respect the actual session's scope, verification and deployment preferences. Do not override the selected Codex model/speed. For complex payment/security/migration work, apply the destination's recommendation policy without changing its selection.

## Completion Handoff

Report **Source**, **Connection**, and **Validation** separately. A skill pack or configured SDK does not prove enabled authentication, deployed rules/indexes, provider API entitlement, funded procurement, or live payments. Deliver the requested source and secret-free setup examples; identify remaining external requirements precisely. Run checks and external actions only within the user's authorized scope. Do not promise fully unattended returns or fixed cloud costs from a proposed architecture.
