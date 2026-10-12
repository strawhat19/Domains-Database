# Reusable Connected App Guidance

Copy this complete ai/ directory and AGENTS.md to adopt the generic app system. Skills live in ai/skills/ and travel with their focused references and licensed analytics assets. Each destination keeps its framework, product data, branding and stricter access policies; root admin URLs use available names, with collision fallbacks and old-route redirects. Actual project/configuration/schema/setup notes stay outside ai/.

The original reusable guides and accompanying AGENTS.md are [MIT licensed](LICENSE), copyright 2026 strawhat19. Keep ai/LICENSE and the copyright/license notices when copying or distributing them. Dependencies and vendored assets retain their own licenses, provenance and disclaimers; preserve their complete notices, including individual brand-icon terms. Adopting this pack does not relicense the destination project's unrelated code or grant trademark rights.

Use [adoption.md](adoption.md) for the connection matrix, implementation mapping and truthful handoff. For the connected Profile/Dashboard/Admin/Analytics system, use [its prompt and included scope](adoption.md#connected-account-system-prompt) and [Admin](skills/admin/SKILL.md). For the broader common core, use [App System](skills/app-system/SKILL.md) and [the feature/completion map](skills/app-system/system.md).

Simple prompt after copying the files:

> Set up the connected account system from ai/adoption.md in this project

This includes private Profile/Connections, real Firebase/Firestore boundaries, the current shared sidebar and submenus, Owner feature controls with minimum-plan targeting, top-level admin pages, and Traffic/Health charts. Use [the full-system prompt](skills/app-system/system.md#one-adoption-prompt) when you also want the complete public/chat/pricing/blog starter.

Read applicable guides in this order:

1. [Structure](skills/structure/structure.md)
2. [Database](skills/database/database.md)
3. [API](skills/api/api.md)
4. [Authentication](skills/authentication/authentication.md) for users/sessions
5. [Social](skills/social/social.md) for profiles/privacy/social features
6. [Routes](skills/routes/routes.md)
7. [Admin](skills/admin/SKILL.md), then only the needed detailed contracts: [Firestore/accounts/rules](skills/admin/references/firestore.md), [private connections/sync](skills/admin/references/connections.md), [feature flags/roles/tiers](skills/admin/references/features.md), [notifications/forms/account actions](skills/admin/references/workflows.md), [analytics/runtime/icons](skills/admin/references/analytics.md), [shell/editor/chart layout](skills/admin/layout.md)
8. [App System](skills/app-system/SKILL.md) for the complete starter; [chat](skills/app-system/references/chats.md), [plans](skills/app-system/references/plans.md), and [blog](skills/app-system/references/blog.md) for those modules

New connected account systems default to Firebase Google/email authentication, realtime Cloud Firestore, private Profile/Connections, explicit roles, permitted admin CRUD, confirmed Owner feature settings, connected dashboards, account notification read state, saved public submissions/private review and protected Vercel reports unless another stack is chosen. The full core also includes public frontend and focused chat/pricing/blog contracts. A narrow task remains narrow.

The [complete analytics bundle](skills/admin/assets/analytics/) includes local country flags and source brand marks with code/source manifests and notices. Install/adapt artwork and resolver metadata into supported public/native paths and retain flags/device/source/page identities across Chart/List and compact/full views. Assets under ai/ are not automatically served routes.

Dropping in guidance starts implementation; it does not itself create resources or supply credentials. Actual connection still needs the destination's implementation, Firebase providers/origins, trusted account bootstrap, deployed compatible rules/indexes, hosted private endpoints and available Vercel scope/plan. Show missing setup instead of mock success or silent local fallback. Follow AGENTS.md for checks, commits and live changes.

[Goals](goals/goals.md) keeps requested scope clear. [Prompts](prompts/prompts.md) provides focused requests without app-specific history.
