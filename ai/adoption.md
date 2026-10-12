# Adopt The Connected App System

Copy the complete ai/ folder, including skills and analytics assets/licenses, plus AGENTS.md into the destination repository. Skills live under ai/skills/; do not create a second divergent skills/ tree. Preserve existing unrelated guidance and implementation. This pack supplies the build contract; Firebase/Vercel resources, secrets, provider access and deployed source remain project-specific.

Use [the connected-account prompt](#connected-account-system-prompt) for Profile, Dashboard, Admin, private connections, feature controls and reporting, or [the full-system prompt](skills/app-system/system.md#one-adoption-prompt) for the broader starter. A narrow task loads only its relevant guides and does not authorize adding every module.

## Connected Account System Prompt

After copying this complete folder and AGENTS.md, use:

> Set up the connected account system from ai/adoption.md and ai/skills/admin/SKILL.md in this project: Firebase authentication and realtime Firestore, Profile and private Connections, the shared Dashboard/Admin sidebar and submenus, Owner Features with role and minimum-plan controls, and Traffic/Health reports and charts. Use available top-level admin page URLs with collision fallbacks and legacy redirects. Preserve this project's framework, theme, product data and narrower access policies. Complete the real services, subscriptions, permitted actions, rules/indexes and protected server connections using its authorized configuration; follow AGENTS.md and report source completion, actual connectivity and remaining external setup separately.

The shorter request "Set up the connected account system from ai/adoption.md" selects this scope. A blank project uses the stack in AGENTS.md; an existing project keeps its framework. Do not require chat, a blog, payments, uploads or unrelated business features to complete this account scope. Reuse existing working modules.

| Included Module | Observable Target |
| --- | --- |
| Authentication/accounts | Real Google/email flows, UID-to-app-account mapping, private Subscriber defaults, current role/status hydration and trusted Owner bootstrap |
| Profile/Connections | Saved editable account details/preferences; private account-scoped connection load/save/validate/clear and permitted provider synchronization |
| Account shell/navigation | Measured sticky header, full-width content, logo-aligned desktop rail, persisted collapse/single-column submenus, bottom identity controls and route-specific themed skeletons |
| Dashboard/Admin | Dashboard parent and permitted record/report children, Features last for Owners; Feedback parent with actual private review workflows; real bounded data, useful empty/error states and scoped CRUD |
| Features/catalog tiers | Owner table and settings modal; confirmed global settings, role audience and one minimum tier; real theme/marquee/notification/contact consumers and matching backend guards |
| Traffic/Health | One web collector, authorized server reports, provider-aware ranges/units/limits, responsive Chart/List inspection, clear thin timeline controls and consistent country/source/device/page icons |
| Notifications/forms | Actual public publication, private account read state and confirmed guest intake/authorized review where requested; retry-safe intake for the connected target |

Features uses the existing real plan catalog where present. If minimum-plan targeting is requested without a catalog, provide an authorized empty catalog manager and Free baseline, then collect actual plan content only when needed; do not seed invented paid tiers or entitlements. Keep optional Feedback channels honest when no records/service exist. An existing Coming Soon view can remain outside requested functional scope; it does not complete a requested chat or review workflow.

Read [layout](skills/admin/layout.md), [connections](skills/admin/references/connections.md), [features](skills/admin/references/features.md), and the relevant [Firestore](skills/admin/references/firestore.md), [workflow](skills/admin/references/workflows.md) and [analytics](skills/admin/references/analytics.md) contracts. They define the current reusable interaction/setup behavior; destination route/schema/provider names belong in project docs.

## Map Before Implementation

Inspect the current framework/router/output mode, supported package versions, shell/theme/icons, shared models/services, auth and account hydration, local versus cloud adapters, identity/role schemas, private connection boundaries, feature settings/catalog order, forms/notifications, reporting endpoints and existing rules/indexes. Preserve working boundaries and existing IDs/data. Inventory root pages, dynamic routes, aliases, API and static-asset paths before choosing admin URLs; public pages keep occupied names. All canonical/legacy destinations, shell/loading classification, auth return paths and analytics icons use one shared registry. A local Google mock, local read-preference module, static dashboard, missing provider route, or configuration-driven local fallback is not evidence of a connected account system.

Record the actual collection/route/environment/capability/query/index map in destination docs such as docs/APP_SYSTEM.md. Separate observed working behavior, source needing improvement, and external setup. Reuse working implementation; implement the connected target for missing account-scoped read state, trusted guest intake, native reporting capability, or another requested module without describing reference gaps as completed features.

Use the destination's approved Firebase/Vercel resources and provider configuration when available. Resolve only missing resource identities, required secrets, access or bootstrap intent that affects connection; continue independent source work while those are unavailable. Do not copy another project's identifiers or quietly create/use a different cloud project. Code generation, resource creation, configuration, deployment and connected behavior are separate actions; external work follows the user's actual authorization.

## Connection Matrix

| Integration | Public/Client Configuration | Private/External Setup |
| --- | --- | --- |
| Firebase app | Framework-supported API key, auth domain, project ID, app ID and required sender/storage settings | Correct environment/database; intended resource access |
| Firebase Auth | Supported Google/email flows and session persistence | Enabled providers, authorized local/preview/custom origins, deliberate Owner bootstrap |
| Firestore | Single SDK adapter, typed record/query map | Restrictive rules, compatible ready indexes, trusted allocation/summary operations |
| Account/roles | UID mapping, hydrated authoritative profile/status, explicit capability registry | Trusted role/status management and immutable audit policy |
| Private connections | Own account metadata, verified availability/count, typed save/validate/clear/sync actions | Account-scoped private storage, server-held production credentials, authorized provider access and retry-safe record synchronization |
| Global features/tiers | One public-safe confirmed settings source and safe catalog rank metadata; effective flags follow current role/plan | Owner-only settings writes, atomic identity/counter, synchronized catalog rank indexes, matching notification/contact policy and compatible migrations |
| Notifications/forms | Real subscriptions, private own read state, confirmed intake/review actions | Audience/reviewer policy, validated guest boundary, idempotency; delivery only if configured |
| Vercel collection | Installed web SDK once in shell, redacted page/event inputs | Enabled Web Analytics on the intended linked project |
| Vercel reports | Authenticated calls to deployed server endpoints | Server-only token, fixed project/team scope, verified reporting/observability access |
| Native/PWA | Supported routing, asset rendering and platform auth | Actual build/deployment target; explicit unsupported provider/report states |

Use secret-free .env.example names supported by the framework: EXPO_PUBLIC_FIREBASE_* or NEXT_PUBLIC_FIREBASE_* are client identifiers; choose the actual required suffixes from SDK initialization. Server-only examples may use VERCEL_ANALYTICS_TOKEN, VERCEL_ANALYTICS_PROJECT_ID, VERCEL_ANALYTICS_TEAM_ID and separately configured privileged Firebase credentials if needed. A service account/Admin SDK is not required merely because existing endpoints verify Firebase tokens through supported Auth/Firestore interfaces. Never copy another project's actual values, IDs, credentials or bootstrap identities into the pack.

Environment changes need the correct build/deployment environment and supported local server restart. A static frontend requires an actual hosted server boundary for private provider access. Source examples, environment presence, console enablement, deployed rules/indexes and a connected running service are separate readiness facts.

## Source Completion And Handoff

Finish relevant routes, components, providers, typed models/services, real permitted mutations, subscription cleanup, validation, rules/indexes and secret-free examples. Install/adapt the complete flag/brand bundle and device/page resolver in the supported output/bundler paths. Retain the measured account-shell geometry and frontend theme.

Implementation must connect each control through view → shared context/service → permitted persistence or server operation → authoritative subscription/result. Account/profile edits cannot change roles or entitlements; connection secrets cannot enter public users or reports; global feature settings cannot fall back to per-browser preferences in cloud mode. Realtime Firestore handles app records/settings and eligible private preferences. Provider reports retain their actual server-query/cache cadence; direct provider access does not become Firestore realtime telemetry.

For each requested module, report Source: Complete/Incomplete, Connection: Connected/Setup Needed/Unavailable, and Validation: User Review Pending/Checks Performed with actual evidence. Do not call a module Connected merely because its files exist. If cloud access is missing, complete the reviewable boundary and honest connection UI, name the precise prerequisite, and continue independent source work.

Give the user a review map for sign-in/profile persistence, Subscriber defaults and role rejection, account-switch cleanup, private connection save/verification/sync, live dashboard updates, submenu persistence/root-route aliases, feature role/minimum-tier gates and all four consumers, form save/private review, announcement publication/account read state, analytics country flags/device/page/source rows, range/null/export behavior and missing-plan errors. These are behaviors to review; do not run tests, builds, UI checks, commits or live changes unless authorized under AGENTS.md. Authorized deployment still checks actual cloud scope and existing stricter policies before applying changes.
