# Profile, Admin, And Dashboard System

Use this portable connected-system contract for the requested account/admin/dashboard work. Preserve the current framework, product schema, branding and stricter access policies. New full applications default to Firebase Authentication, realtime Cloud Firestore and protected Vercel reporting unless another stack or an explicit local demo is chosen. A focused edit does not scaffold the whole app.

## Shared Boundaries

Keep one initialized boundary for the existing backend, one authoritative auth/account provider, focused capability helpers, a shared route registry and typed service facades. Preserve an established database/auth provider; apply Firebase-specific setup only to a Firebase destination or a requested migration. Translate private ownership, atomic identity and trusted-operation requirements to the configured provider's policies/constraints. Map them to the destination's existing shared/ architecture. Services own persistence/subscriptions/serialization and privileged operations; component folders own logic, rendering and styles. Avoid second caches, routers, password stores or provider trackers.

Profile, AccountNavigation, AdminDashboard, AdminRecords, AnalyticsCharts and ObservabilityPanel reuse existing themed components. Web uses supported SCSS; native uses platform styles/renderers. Static web output needs a real hosted server boundary for private reporting and trusted intake; server secrets never enter client imports.

| Requested Work | Read The Detailed Contract |
| --- | --- |
| Setup and adoption | [Adoption](../../adoption.md) |
| Firebase/account hydration, IDs/counters, realtime subscriptions, roles, rules/indexes and scaling | [Firestore](references/firestore.md) |
| Profile/users, notifications/read state, public forms/private review, persisted actions and optional delivery | [Workflows](references/workflows.md) |
| Private account connection configuration and permitted typed provider sync | [Connections](references/connections.md) |
| Owner global feature controls, role/minimum-plan targeting, public-safe tier ranks and gated consumers/intake | [Features](references/features.md) |
| Traffic/runtime adapters, range semantics, source/units/cache, flags/device/source/page icons and exports | [Analytics](references/analytics.md) |
| Requested Stripe subscriptions, trusted entitlements and aggregate Owner payment charts | [Payments](../payments/SKILL.md) |
| Shell/sidebar/editor/chart sizing, controls, motion and platform rendering | [Layout](layout.md) |
| Complete public/private common core | [App System](../app-system/SKILL.md) |

## Firebase Configuration And Accounts

Follow [the SDK/provider and account contract](references/firestore.md#sdk-providers-and-private-configuration). New accounts use stable app-owned identity, Subscriber defaults and private visibility. Verify actual client/server environments, enabled providers, allowed origins and deliberate trusted Owner bootstrap. Missing configuration, a local Google mock and copying instructions do not establish a connected account.

Hydrate both session and app account before protected access; subscribe to authoritative active role/status and clear old private state on account/permission changes. Keep public projections, private accounts and connection secrets separate. Reuse existing role values through one explicit capability map.

## Records And Realtime Firestore

Follow [record/query/rule mapping](references/firestore.md#portable-record-query-and-rule-map), [atomic identity](references/firestore.md#account-creation-and-atomic-identity), and [listener lifecycle](references/firestore.md#listener-and-connection-state). Content IDs/numbers remain stable and allocate atomically; infrastructure lookup keys have explicit exceptions. Serializers validate actual records and normalize timestamps at the service boundary.

Use genuine bounded subscriptions for live records and summaries, cursor pages for history, matching rules/indexes and honest cached/pending/error/coverage states. Shared/lazy listeners, unchanged-write checks and deliberate index selection reduce repeated work. A historical counter or loaded page is not a current global total, and a refreshed server aggregate is not a realtime listener.

## Roles And Authorization

Use [the account authorization contract](references/firestore.md#sdk-providers-and-private-configuration) and [operation rules](references/firestore.md#firestore-rules-and-indexes). The default ADMIN boundary is active trusted Owner only, including Dashboard, Feedback, operations and technical reports. Every other role, including Admin and Developer, retains Profile and supported own-account tools without automatic administrative access. Broaden a role's capability only when the user explicitly chooses that destination policy; retain narrower record/participant constraints. Roles are not a numerical permission hierarchy.

The same capability drives menu visibility, direct route, service, rules and privileged server checks. Clients cannot promote themselves through profile or mapping edits. Trusted role/status actions preserve identity and require an immutable atomic audit where the app policy specifies it. Protect elevated targets, self-access and the last active Owner. Authorize current active identity before returning cached reports.

## Profile And Admin Navigation

Follow [the account layout](layout.md#account-canvas-and-sidebar) for a full-width header inner row and canvas beyond the public box, measured header/safe-area offset, and flush-left full-height desktop sidebar whose expanded right edge follows the natural logo-plus-wordmark right edge relative to account-shell/viewport left, including the existing leading inset with no added trailing padding. Keep persisted account-scoped collapse/submenus, bottom identity/Profile controls and mobile inline navigation. Keep the destination's palette/fonts, icons, canonical routes and business labels.

Profile is the only top-level ACCOUNT link; supported private Connections, My Submissions and own tools stay inside it. Only the Owner sees ADMIN and its supported Dashboard/Feedback children by default. Profile exposes supported editable details/preferences and provider photo/themed initial. The header avatar opens the shared popup with role pills for all signed-in roles, trusted-plan pills only for non-Owners, Profile, permitted admin links and Sign Out last; visible unknown plan state remains truthful. Hide the popup plan pill by actual Owner role, independently of administrative capability; retain Profile Account Details. Clear scoped shell preferences and private views before hydrating the next account. Use actual counts/loading/error states, keyboard/touch behavior, labels and reduced motion.

## Persisted Administrative Actions

Follow [notifications and account workflows](references/workflows.md), including their typed operation map, canonical publication state, unique-slug/identity preservation, persisted CRUD/status actions, private read-state hydration, reload recovery and deliberate own-data resets. A read-only gallery or decorative toggle is not completed management.

Account-specific read preferences never alter shared announcement status. A connected starter uses private account-scoped read persistence; existing session/device state must be labelled accurately. Email/push delivery exists only with its separately configured trusted transport.

## Owner Features And Plan Eligibility

Follow [Features](references/features.md) for persisted global settings and the Owner-only Features item last in Dashboard submenus. Its shared record table uses No., Feature, Description, Value, Plans, Actions; slimmer Disable/Enable segments sit beside a settings gear, and the accessible modal contains Description and independent role segments.

Availability combines the global boolean, current role and current minimum plan tier. No selected paid plan means Free And Above; one selected paid threshold admits that tier and future higher tiers using actual catalog order and stable record number. Keep raw global settings separate from effective viewer flags, and catalog rank metadata separate from publication and trusted entitlements. Map Theme Toggle, Top Bar Infinite Marquee, Notifications and Contact across all consumers and authoritative intake/read gates. Preserve saved theme preferences while forcing dark, remeasure header offsets when the marquee changes, and retain authorized management when public surfaces are disabled.

## Contact Intake And Private Request Review

Follow [forms and review](references/workflows.md#forms-and-submission-review) and [the portable form map](references/workflows.md#portable-form-schema-and-delivery-map). Preserve established schemas such as email-or-phone or named contact fields, public guest access and stricter reviewer policies.

Validate and persist intake independently of delivery, allocate identity atomically, and use stable request idempotency for retry-safe creation. Confirm Submission Saved only after commit; preserve failed drafts. Reviewer pages use real bounded subscriptions, message detail, New/Read/Archived or mapped form statuses, honest page filters/counts and permitted persisted actions.

## Dashboard And Animated Charts

Use real application summaries with source/window coverage, [the report contract](references/analytics.md#typed-report-and-server-contract), and [layout geometry](layout.md). Keep business activity, website traffic and platform runtime separate. No seeded account history, random chart values, global counts from samples or fabricated conversions.

Chart/List and pointer/touch/slider inspection share typed data, real units/time positions, missing-value gaps, and accessible descriptions. Compare only compatible real periods and denominators. Maintain the same safe identity resolver and flags/device/source/page icons across compact/full/platform presentations.

## Vercel Analytics And Observability

Follow [analytics integration](references/analytics.md), its [traffic query/range map](references/analytics.md#traffic-query-map-and-range-semantics) and [runtime compatibility](references/analytics.md#runtime-provider-compatibility). Mount collection once, query reports through authenticated server-only fixed scope, and expose actual capability/plan/cache/freshness states.

The public Web Analytics API and official metrics tooling are distinct interfaces. Verify current contracts when implementing; a CLI-backed compatibility adapter is not a guaranteed public REST promise. Provider report refresh and optional ingestion are not automatically as live as Firestore subscriptions. Keep missing metrics unavailable.

## Reviewable Completion

Deliver all requested routes/views, models/services, permitted real actions, subscriptions, rules/indexes, safe provider boundaries, assets and secret-free examples. Keep project IDs, schema maps, credentials, Owner setup and deployment notes outside ai/. [Adoption](../../adoption.md) distinguishes source completion, actual connection and authorized validation.

For an explicitly requested full starter, use [App System](../app-system/SKILL.md) with its private chat, plans/pricing and sourced blog contracts. Complete narrower tasks within their scope. Respect AGENTS.md for source review, tests/builds/UI, commits and live changes.
