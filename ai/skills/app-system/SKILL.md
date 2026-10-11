---
name: app-system
description: Implement the complete reusable app core when the user requests a full starter or all common app functionality. Covers public frontend, connected accounts/admin, private chat, pricing catalog, and sourced blog; focused changes remain scoped.
---

1. Apply this skill to an explicitly requested full app system or starter. A focused form, profile, dashboard, chat, or pricing edit uses only its relevant guides and existing implementation. Preserve the destination framework, theme/fonts, useful routes, data, and uncommitted work; use the new-app stack from AGENTS.md only when no framework is established.

2. Read the shared guides in AGENTS.md order, then [system.md](system.md) for the common-core feature map, adoption prompt, and completion matrix, and [adoption](../../adoption.md) for environment/connection mapping. Reuse [Admin](../admin/admin.md) and its focused [Firestore](../admin/references/firestore.md), [workflow](../admin/references/workflows.md), and [analytics](../admin/references/analytics.md) contracts for Firebase/auth/roles, notifications, contact intake, dashboards, and provider reports, and [the account layout](../admin/layout.md) for shell geometry, charts, icons, tables, and motion. Keep those detailed contracts in their existing guides.

3. For the full starter, read [private chat](references/chats.md), [plans and pricing](references/plans.md), and [sourced blog](references/blog.md). Implement the actual permitted services, subscriptions, and actions behind each view. A reference's unconfigured chat screen or static gallery is not proof of functioning persistence.

4. Complete every requested common-core module through frontend, typed service/model, database rules/indexes, and honest pending/empty/error states. Keep private conversations participant-scoped, pricing separate from entitlements/payments, and contact storage separate from optional email delivery. Preserve narrower existing role policies.

5. Put actual collection/route mappings, source catalogs, external setup, and feature completion notes in the destination project's documentation outside ai/. Ship secret-free environment examples and record the Firebase/Vercel resources still required. Copying ai/ and AGENTS.md provides a workflow; it does not supply credentials or connect services.

6. Recheck official provider contracts for reporting, feeds, authentication, and embeds when implementing them. Follow the user's scope and AGENTS.md for source review, tests, builds, UI checks, deployment, and commits. Do not change tool/model configuration or publish externally just because a full starter was requested.

7. Treat notification read-state persistence, public form retry idempotency, authoritative account changes, provider freshness, and rules/index readiness as actual source/connection requirements. Local visit preferences, transaction counters alone, static charts, and copied assets do not complete their connected modules. Preserve existing partial modules and describe their gaps accurately while completing the requested target.
