# Adopt The Connected App System

Copy the complete ai/ folder, including skills and analytics assets/licenses, plus AGENTS.md into the destination repository. Skills live under ai/skills/; do not create a second divergent skills/ tree. Preserve existing unrelated guidance and implementation. This pack supplies the build contract; Firebase/Vercel resources, secrets, provider access and deployed source remain project-specific.

Use [the full-system prompt](skills/app-system/system.md#one-adoption-prompt) for the whole starter, or [Admin](skills/admin/SKILL.md) for the connected account/dashboard subset. A narrow task loads only its relevant guides and does not authorize adding every module.

## Map Before Implementation

Inspect the current framework/router/output mode, supported package versions, shell/theme/icons, shared models/services, auth and account hydration, local versus cloud adapters, identity/role schemas, forms/notifications, reporting endpoints and existing rules/indexes. Preserve working boundaries and existing IDs/data. A local Google mock, local read-preference module, static dashboard, missing provider route, or configuration-driven local fallback is not evidence of a connected account system.

Record the actual collection/route/environment/capability/query/index map in destination docs such as docs/APP_SYSTEM.md. Separate observed working behavior, source needing improvement, and external setup. Reuse working implementation; implement the connected target for missing account-scoped read state, trusted guest intake, native reporting capability, or another requested module without describing reference gaps as completed features.

## Connection Matrix

| Integration | Public/Client Configuration | Private/External Setup |
| --- | --- | --- |
| Firebase app | Framework-supported API key, auth domain, project ID, app ID and required sender/storage settings | Correct environment/database; intended resource access |
| Firebase Auth | Supported Google/email flows and session persistence | Enabled providers, authorized local/preview/custom origins, deliberate Owner bootstrap |
| Firestore | Single SDK adapter, typed record/query map | Restrictive rules, compatible ready indexes, trusted allocation/summary operations |
| Account/roles | UID mapping, hydrated authoritative profile/status, explicit capability registry | Trusted role/status management and immutable audit policy |
| Notifications/forms | Real subscriptions, private own read state, confirmed intake/review actions | Audience/reviewer policy, validated guest boundary, idempotency; delivery only if configured |
| Vercel collection | Installed web SDK once in shell, redacted page/event inputs | Enabled Web Analytics on the intended linked project |
| Vercel reports | Authenticated calls to deployed server endpoints | Server-only token, fixed project/team scope, verified reporting/observability access |
| Native/PWA | Supported routing, asset rendering and platform auth | Actual build/deployment target; explicit unsupported provider/report states |

Use secret-free .env.example names supported by the framework: EXPO_PUBLIC_FIREBASE_* or NEXT_PUBLIC_FIREBASE_* are client identifiers; choose the actual required suffixes from SDK initialization. Server-only examples may use VERCEL_ANALYTICS_TOKEN, VERCEL_ANALYTICS_PROJECT_ID, VERCEL_ANALYTICS_TEAM_ID and separately configured privileged Firebase credentials if needed. A service account/Admin SDK is not required merely because existing endpoints verify Firebase tokens through supported Auth/Firestore interfaces. Never copy another project's actual values, IDs, credentials or bootstrap identities into the pack.

Environment changes need the correct build/deployment environment and supported local server restart. A static frontend requires an actual hosted server boundary for private provider access. Source examples, environment presence, console enablement, deployed rules/indexes and a connected running service are separate readiness facts.

## Source Completion And Handoff

Finish relevant routes, components, providers, typed models/services, real permitted mutations, subscription cleanup, validation, rules/indexes and secret-free examples. Install/adapt the complete flag/brand bundle and device/page resolver in the supported output/bundler paths. Retain the measured account-shell geometry and frontend theme.

For each requested module, report Source: Complete/Incomplete, Connection: Connected/Setup Needed/Unavailable, and Validation: User Review Pending/Checks Performed with actual evidence. Do not call a module Connected merely because its files exist. If cloud access is missing, complete the reviewable boundary and honest connection UI, name the precise prerequisite, and continue independent source work.

Give the user a review map for sign-in/profile persistence, Subscriber defaults and role rejection, account-switch cleanup, live dashboard updates, form save/private review, announcement publication/account read state, analytics flags/device/page/source rows, range/null/export behavior and missing-plan errors. These are behaviors to review; do not run tests, builds, UI checks, commits or live changes unless authorized under AGENTS.md. Authorized deployment still checks actual cloud scope and existing stricter policies before applying changes.
