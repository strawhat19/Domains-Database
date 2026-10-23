---
name: payments
description: Implement or review real checkout, recurring billing, trusted paid access, and Owner payment reports in an existing app. Preserve the selected provider and stack; catalog or pricing presentation alone does not enable payments.
---

# Payments And Trusted Access

Connect the requested billing or reporting behavior through the destination's existing frontend, authentication, server, database, and deployment boundaries. Keep public offers, private billing records, account roles, and trusted entitlements separate.

## Read For The Requested Work

| Work | Reference |
| --- | --- |
| Stripe Checkout, Portal, webhook reconciliation, private billing records, paid features and quotas | [Stripe billing](references/stripe-billing.md) |
| Owner aggregate payment/subscription reports and charts | [Payment reports](references/payment-reports.md) |
| Public catalog editing and publication | [Plans](../app-system/references/plans.md) |
| Feature audiences and minimum tier evaluation | [Features](../admin/references/features.md) |
| Roles, current account authority, account shell and reporting geometry | [Admin](../admin/SKILL.md), [layout](../admin/layout.md), [analytics](../admin/references/analytics.md) |

Read only applicable references. Use the chosen provider's equivalent documented contracts when Stripe is not the destination's provider.

## Working Approach

1. Read AGENTS.md and applicable shared guides in its prescribed order. Preserve the destination framework and persistence: React, Expo, Next.js, Supabase/RLS, Firestore, or another existing stack does not need replacement to add billing.
   For native digital subscriptions, make a deliberate purchase/distribution-policy decision using the current platform rules. Preserve an existing valid store/in-app purchase flow; do not automatically route every native app to Stripe Checkout.
2. Discover the current account/environment, existing billing integration, published offers, supported currencies/intervals, actual feature consumers, and authorized operations. Resolve ambiguities from connected sources before asking. Existing authorization persists; a documentation or frontend-only request authorizes neither provisioning nor payments.
3. Define a small typed contract for billing state and requested actions before rendering paid CTAs. Map actual offers to server-owned provider prices, private account bindings, effective entitlements and enforcement. Follow the billing reference for retry/reconciliation behavior.
4. For reporting, define dataset scope, metric meaning, effective time range, coverage and missing values first. Follow the report reference; screenshots and local chart arrays are not transaction sources.
5. Keep the app usable when configuration is absent. Show connection, pending, denied, failed and confirmed states accurately; do not substitute mocks, device data, an empty array, or a public plan label for server evidence.
6. Complete source and authorized configuration work within scope. Use focused checks only as permitted by AGENTS.md and the user. Do not create test subscriptions, charges, refunds, cancellations, new environments or paid resources merely to demonstrate a flow.

## Completion Evidence

Report these separately, using actual evidence and unresolved limitations:

| Level | What It Establishes |
| --- | --- |
| Source | The implementation and enforcement paths exist; execution remains unproven |
| Configured | Environment names/resources are set for an identified account and mode |
| Readback | A specific permitted request confirmed actual state or permissions at that time |
| Deployed | The exact revision is Ready and the intended alias/runtime serves it |
| Transaction | An explicitly authorized real or sandbox scenario reached its confirmed outcome |

A configured key, successful build, zero linked customers, complete empty app dataset, or rendered chart does not prove provider read permissions, payment settlement, webhook delivery, or entitlement enforcement. Record which operations actually ran. Runtime environment changes can require a new deployment even when source is unchanged.

Keep real cloud IDs, domains, prices, quotas, credentials, schema/route mappings, operational budgets and release evidence in the destination's code/configuration/docs outside ai/. Do not turn one project's limits or timing into universal defaults. Preserve unrelated work and the user's deployment/verification scope.

Copyright (c) 2026 strawhat19. Licensed under [MIT](../../LICENSE).
