# Reusable AI Guidance

Copy this ai/ directory and AGENTS.md into a project to adopt the shared working agreements and complete reusable app blueprint. For the whole core, use [the App System skill](skills/app-system/SKILL.md) and [its feature map/completion matrix](skills/app-system/system.md). Keep application names, branding, schemas, cloud project IDs, owner bootstrap details, and deployment instructions in that project's own configuration or documentation outside ai/.

One prompt after copying the files:

> Implement the full App System from ai/skills/app-system/SKILL.md in this project, completing every common-core module while preserving its framework, theme, features, and existing data. Follow AGENTS.md and report any external setup still needed.

Read applicable guides in this order:

1. [Structure](skills/structure/structure.md)
2. [Database](skills/database/database.md)
3. [API](skills/api/api.md)
4. [Authentication](skills/authentication/authentication.md) for users/sessions
5. [Social](skills/social/social.md) for profiles and privacy or social features
6. [Routes](skills/routes/routes.md)
7. [Admin](skills/admin/SKILL.md) and [its system guide](skills/admin/admin.md) for profiles, admin areas, persisted contact/request intake and review, connected dashboards, roles, and reporting; [its layout reference](skills/admin/layout.md) for shared shell geometry, menus, records, and charts
8. [App System](skills/app-system/SKILL.md) for an explicitly requested complete starter; [chat](skills/app-system/references/chats.md), [plans/pricing](skills/app-system/references/plans.md), and [blog/references](skills/app-system/references/blog.md) only for those modules

New full applications default to Firebase Authentication with Google and email sign-in/sign-up, realtime Cloud Firestore, role-based account/admin navigation, animated charts, and server-protected Vercel reporting unless another stack is chosen. Preserve an existing project's framework and data; a focused change does not require scaffolding unrelated features. Use local demo storage only when chosen explicitly or already required by that app, and describe it accurately.

To adopt the system, map the shared boundaries to the framework, provide secret-free environment examples, configure the chosen Firebase/Vercel projects, define app-owned records and trusted roles, implement security rules and private reporting endpoints, and build relevant themed sections. Follow the Admin guide for listener cleanup, pagination, privacy, and truthful provider states. Dropping in instructions prepares the workflow; each project still needs its own code, credentials, authorized domains, deployed rules/indexes, and provider entitlements.

The [Admin analytics assets](skills/admin/assets/analytics/) travel with ai/: complete local flags and source brand marks with provenance/licenses. Reuse an existing equivalent catalog or install them in the destination's public/native asset paths and adapt its resolver/renderers as described in [the layout guide](skills/admin/layout.md#analytics-identity-icons).

[Goals](goals/goals.md) tracks task scope. [Prompts](prompts/prompts.md) supplies reusable starting requests. Follow AGENTS.md for validation and external actions.
