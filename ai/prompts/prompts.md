1. For a focused change: Read the relevant instructions and current implementation, preserve uncommitted edits, make the smallest readable change that completes the request, and describe the result. Leave validation to the user unless explicitly requested.

2. For a new app or page: Follow the chosen framework and shared structure, separate component logic from rendering and styles, use descriptive element identifiers, and support the requested web and mobile targets. Reuse the app shell, theme, navigation, and existing components.

3. For local CRUD: Use the existing typed models, shared ID and storage helpers, and one useLocalStorage flag. Expose operations through the internal API or equivalent service, preserve saved records, and show skeletons, empty states, and errors in the consuming components.

4. For connected authentication: Read applicable shared guides in AGENTS.md order and the Admin skill. Use Google and email Firebase sign-in/sign-up, Subscriber defaults, hydrated account state, a provider avatar menu, private Profile, and explicit role capabilities. Preserve public browsing and existing accounts. Use a local demo only when chosen; report actual connection/setup state.

5. For a reusable refactor: Preserve behavior and user preferences, consolidate duplicated shared logic, and keep feature-specific data out of reusable modules and instructions. Document the resulting structure using actual paths and explain each boundary briefly.

6. For social features: Read the social guidance and implement only the requested profiles, posts, follows, or messages. Enforce visibility and ownership through the service, keep account connection credentials separate from public profiles, and use safe formatted text with public HTTPS image URLs rather than uploads. Use the shared storage switch, models, theme, and component structure.

7. For publishing work: Prepare concrete, reviewable output within the authorized scope. Ensure public policy pages, internal navigation, common redirects, dynamic copyright year, and the Piratechs link are present. Perform external publishing only when authorized.

8. After copying ai/ and AGENTS.md, request the current connected account/admin setup with:

> Set up the connected account system from ai/adoption.md in this project

[Its scope and detailed prompt](../adoption.md#connected-account-system-prompt) include Profile/private Connections, Firebase/Firestore sync, the full-width account header/canvas, slim logo-plus-wordmark measured rail, shared sidebar/submenus and avatar role pills for every role and trusted-plan pills only for non-Owners. Only active trusted Owners receive ADMIN/Dashboard/Feedback by default; all other roles see Profile only at top level with supported private tools inside it. Include Owner Features, root admin routes and Traffic/Health reports/charts. Preserve the destination's palette/fonts, framework, product data and narrower permissions; broaden administrative roles only when explicitly requested. Real cloud/provider setup still uses that project's authorized resources.

9. For the complete common-core starter, use [the full-system prompt](../skills/app-system/system.md#one-adoption-prompt) after copying the files. It extends the account scope with the complete public/chat/pricing/blog modules.

Read [the feature map and completion matrix](../skills/app-system/system.md) for what this prompt includes. It requests public frontend, connected auth/users/profile/admin, dashboards/analytics/charts/icons, notifications/contact intake, private realtime chat, plans/pricing, and the sourced blog; existing working modules are reused. Payments, uploads, and external publishing remain separate requested work.

For focused follow-ups, use concise requests such as:

- "Apply the shared account sidebar, submenus and loading layout from ai/skills/admin/layout.md"
- "Set up the Owner Features table and real feature consumers from ai/skills/admin/references/features.md"
- "Connect private account settings and provider synchronization from ai/skills/admin/references/connections.md"
- "Set up Traffic and Health charts from the Admin analytics and layout references"
- "Use available root admin page URLs and preserve existing links through redirects"

10. For detailed connected adoption, follow [adoption](../adoption.md) and the Admin [Firestore](../skills/admin/references/firestore.md), [workflow](../skills/admin/references/workflows.md), and [analytics](../skills/admin/references/analytics.md) contracts. Map the actual schema, permitted role operations, atomic identities, rules/indexes, environment boundaries and provider access outside ai/. Complete requested real actions and account-scoped subscriptions; report current local/reference gaps and external setup separately.

11. For real payments, use [the Stripe adoption prompt](../adoption.md#stripe-payments-and-subscriptions-prompt) and [Payments](../skills/payments/SKILL.md). Reuse the actual catalog/auth/database; connect private billing records, trusted webhooks/entitlements and authoritative feature/limit enforcement. A pricing-only task does not enable billing, and source preparation does not authorize a live charge.

12. For business payment charts, use [the Owner reports prompt](../adoption.md#owner-payment-reports-prompt). Include the requested Payments page and compact panels, private app-scoped aggregates, meaningful units/statuses and honest null/coverage/freshness. Reports do not require a new purchase flow or expanded payment write permissions.

13. For production hosting, use [the custom-domain prompt](../adoption.md#custom-domain-and-detachable-redirects-prompt) and [Deployment](../skills/deployment/SKILL.md). Connect the intended Git branch and primary domain; make only the selected secondary hostnames independent redirects with a documented detach path. Preserve DNS/email, auth origins and provider return/webhook configuration, and distinguish source, push, deployment, DNS and observed HTTPS behavior.
