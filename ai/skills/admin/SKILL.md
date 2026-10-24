---
name: admin
description: Build or update connected account/profile/admin workflows, roles, realtime Firestore dashboards, Owner feature configuration, notifications, saved forms, and protected analytics reports in an existing app.
---

1. Read the applicable shared guides in AGENTS.md order, then [admin.md](admin.md) for the system map. Preserve the existing framework, theme, schema, routes and narrower permissions; a focused task does not add every module.

2. Read [references/firestore.md](references/firestore.md) for Firebase/provider setup, identity/roles, atomic records, scoped realtime listeners, rules/indexes and scaling. Read [references/workflows.md](references/workflows.md) for profile/users, persisted notification CRUD/read state, guest intake/private review, resets and optional delivery. Read [references/connections.md](references/connections.md) for private account connections and typed provider sync. Read [references/analytics.md](references/analytics.md) for provider queries, ranges/filters, source/cache/capability states and identity icons.

3. Read [layout.md](layout.md) for the full-width account header/canvas, measured logo-plus-wordmark sidebar width, persistent navigation, profile/table/editor controls, chart geometry/inspection and platform icons. Default ADMIN and Dashboard/Feedback access to active trusted Owner; all other roles get Profile only as top-level account navigation, with supported private tools inside Profile. The signed-in avatar popup shows role pills for every role and trusted-plan pills only for non-Owners, based on the actual account role rather than its administrative capability. Other administrative grants require an explicit user-selected policy. Layout parity includes relevant working persisted actions; retain the destination's colors/fonts and business labels.

Apply [User Identity And Profile Photo Sync](../user-identity/SKILL.md) to Users tables, account controls and other displayed user names/usernames. Reuse each person's authorized current avatar and shared identity data, including provider photo sync and themed fallbacks.

Read [references/features.md](references/features.md) for requested Owner feature controls or the connected starter: global settings, role/minimum-tier targeting, public-safe catalog ranks, consumer/intake enforcement and the slim table/settings modal. Feature eligibility uses existing trusted entitlements; it does not assign paid access.

For a database-backed bell, published announcement page or notification manager, read [Notifications](../notifications/SKILL.md). It assembles this skill's workflow and layout contracts for header placement, private unread state, retained popup motion and Owner icon actions.

For requested business payment/subscription charts, read [Payments](../payments/SKILL.md) and its [reporting contract](../payments/references/payment-reports.md). Keep active Owner authorization consistent across menus, direct routes and server reports; reuse compact Profile/Dashboard panels without exposing billing identities or treating public plan prices as revenue. Billing setup remains separate requested scope.

4. Use [adoption](../../adoption.md) when connecting the system in another project. Keep actual project IDs, schemas, credentials, bootstrap identities and history outside ai/. Complete source and configuration examples within scope; describe external prerequisites accurately. Do not turn missing configuration into local authentication/data success.

5. Use [the analytics assets](assets/analytics/) as a complete licensed source bundle, or reuse an equivalent catalog. Adapt served URLs, importable resolver metadata and supported native static asset mappings; the bundle does not install component code or cloud services. Recheck official provider contracts/entitlements when implementing reporting.

6. For a requested complete starter, use [App System](../app-system/SKILL.md) and its focused chat/plans/blog contracts. Follow AGENTS.md for source review, checks, commits, deployment and external actions.
