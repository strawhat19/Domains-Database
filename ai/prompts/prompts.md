1. For a focused change: Read the relevant instructions and current implementation, preserve uncommitted edits, make the smallest readable change that completes the request, and describe the result. Leave validation to the user unless explicitly requested.

2. For a new app or page: Follow the chosen framework and shared structure, separate component logic from rendering and styles, use descriptive element identifiers, and support the requested web and mobile targets. Reuse the app shell, theme, navigation, and existing components.

3. For local CRUD: Use the existing typed models, shared ID and storage helpers, and one useLocalStorage flag. Expose operations through the internal API or equivalent service, preserve saved records, and show skeletons, empty states, and errors in the consuming components.

4. For connected authentication: Read applicable shared guides in AGENTS.md order and the Admin skill. Use Google and email Firebase sign-in/sign-up, Subscriber defaults, hydrated account state, a provider avatar menu, private Profile, and explicit role capabilities. Preserve public browsing and existing accounts. Use a local demo only when chosen; report actual connection/setup state.

5. For a reusable refactor: Preserve behavior and user preferences, consolidate duplicated shared logic, and keep feature-specific data out of reusable modules and instructions. Document the resulting structure using actual paths and explain each boundary briefly.

6. For social features: Read the social guidance and implement only the requested profiles, posts, follows, or messages. Enforce visibility and ownership through the service, keep account connection credentials separate from public profiles, and use safe formatted text with public HTTPS image URLs rather than uploads. Use the shared storage switch, models, theme, and component structure.

7. For publishing work: Prepare concrete, reviewable output within the authorized scope. Ensure public policy pages, internal navigation, common redirects, dynamic copyright year, and the Piratechs link are present. Perform external publishing only when authorized.

8. For an account/admin system: Use ai/skills/admin/SKILL.md to build themed Profile/Admin sidebars, secure Owner/Admin/Developer/Subscriber capabilities, realtime Firestore feature data, animated dashboards, and protected Vercel Analytics/Observability reports. Adapt sections to the app's purpose/framework. Deliver rules/indexes, secret-free environment examples, and project setup notes; display missing setup or unsupported metrics honestly. Copy ai/ with AGENTS.md to reuse the workflow, keeping app-specific details outside it.

9. For the complete common-core starter, copy ai/ and AGENTS.md into the destination repository and use this prompt:

> Implement the full App System from ai/skills/app-system/SKILL.md and ai/adoption.md in this project, completing every common-core module through real services, account-scoped realtime persistence, rules/indexes, and protected analytics while preserving its framework, theme, features, and existing data. Use this project's authorized configuration, follow AGENTS.md, and report source completion, actual connectivity, and external setup separately.

Read [the feature map and completion matrix](../skills/app-system/system.md) for what this prompt includes. It requests public frontend, connected auth/users/profile/admin, dashboards/analytics/charts/icons, notifications/contact intake, private realtime chat, plans/pricing, and the sourced blog; existing working modules are reused. Payments, uploads, and external publishing remain separate requested work.

10. For detailed connected adoption, follow [adoption](../adoption.md) and the Admin [Firestore](../skills/admin/references/firestore.md), [workflow](../skills/admin/references/workflows.md), and [analytics](../skills/admin/references/analytics.md) contracts. Map the actual schema, permitted role operations, atomic identities, rules/indexes, environment boundaries and provider access outside ai/. Complete requested real actions and account-scoped subscriptions; report current local/reference gaps and external setup separately.
