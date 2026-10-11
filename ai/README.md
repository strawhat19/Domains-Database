# Reusable Connected App Guidance

Copy this complete ai/ directory and AGENTS.md to adopt the generic app system. Skills live in ai/skills/ and travel with their focused references and licensed analytics assets. Each destination keeps its framework, product data, branding, existing URLs and stricter access policies; actual project/configuration/schema/setup notes stay outside ai/.

Use [adoption.md](adoption.md) for the connection matrix, implementation mapping and truthful handoff. For the complete common core, use [App System](skills/app-system/SKILL.md) and [the feature/completion map](skills/app-system/system.md). For the connected account/dashboard subset, use [Admin](skills/admin/SKILL.md).

One prompt after copying the files:

> Implement the full App System from ai/skills/app-system/SKILL.md and ai/adoption.md in this project, completing every common-core module through real services, account-scoped realtime persistence, rules/indexes, and protected analytics while preserving its framework, theme, features, and existing data. Use this project's authorized configuration, follow AGENTS.md, and report source completion, actual connectivity, and external setup separately.

Read applicable guides in this order:

1. [Structure](skills/structure/structure.md)
2. [Database](skills/database/database.md)
3. [API](skills/api/api.md)
4. [Authentication](skills/authentication/authentication.md) for users/sessions
5. [Social](skills/social/social.md) for profiles/privacy/social features
6. [Routes](skills/routes/routes.md)
7. [Admin](skills/admin/SKILL.md), then only the needed detailed contracts: [Firestore/accounts/rules](skills/admin/references/firestore.md), [notifications/forms/account actions](skills/admin/references/workflows.md), [analytics/runtime/icons](skills/admin/references/analytics.md), [shell/editor/chart layout](skills/admin/layout.md)
8. [App System](skills/app-system/SKILL.md) for the complete starter; [chat](skills/app-system/references/chats.md), [plans](skills/app-system/references/plans.md), and [blog](skills/app-system/references/blog.md) for those modules

New full apps default to Firebase Google/email authentication, realtime Cloud Firestore, private Profile, explicit roles, permitted admin CRUD, connected dashboards, account notification read state, saved public submissions/private review and protected Vercel reports unless another stack is chosen. The full core includes the public frontend and focused chat/pricing/blog contracts. A narrow task remains narrow.

The [complete analytics bundle](skills/admin/assets/analytics/) includes local country flags and source brand marks with code/source manifests and notices. Install/adapt artwork and resolver metadata into supported public/native paths and retain flags/device/source/page identities across Chart/List and compact/full views. Assets under ai/ are not automatically served routes.

Dropping in guidance starts implementation; it does not itself create resources or supply credentials. Actual connection still needs the destination's implementation, Firebase providers/origins, trusted account bootstrap, deployed compatible rules/indexes, hosted private endpoints and available Vercel scope/plan. Show missing setup instead of mock success or silent local fallback. Follow AGENTS.md for checks, commits and live changes.

[Goals](goals/goals.md) keeps requested scope clear. [Prompts](prompts/prompts.md) provides focused requests without app-specific history.
