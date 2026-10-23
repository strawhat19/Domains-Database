# Reusable Connected App Guidance

Copy this complete ai/ directory and AGENTS.md to adopt the generic app system. Skills live in ai/skills/ and travel with their focused references and licensed analytics assets. Each destination keeps its framework, product data, branding and stricter access policies; root admin URLs use available names, with collision fallbacks and old-route redirects. Actual project/configuration/schema/setup notes stay outside ai/.

The original reusable guides and accompanying AGENTS.md are [MIT licensed](LICENSE), copyright 2026 strawhat19. Keep ai/LICENSE and the copyright/license notices when copying or distributing them. Dependencies and vendored assets retain their own licenses, provenance and disclaimers; preserve their complete notices, including individual brand-icon terms. Adopting this pack does not relicense the destination project's unrelated code or grant trademark rights.

Use [adoption.md](adoption.md) for the connection matrix, implementation mapping and truthful handoff. For the connected Profile/Dashboard/Admin/Analytics system, use [its prompt and included scope](adoption.md#connected-account-system-prompt) and [Admin](skills/admin/SKILL.md). For the broader common core, use [App System](skills/app-system/SKILL.md) and [the feature/completion map](skills/app-system/system.md).

Simple prompt after copying the files:

> Set up the connected account system from ai/adoption.md in this project

This includes private Profile/Connections, real auth/database boundaries (Firebase/Firestore by default for a new app), and the [shared account layout](skills/admin/layout.md): full-width account header/canvas, a slim rail measured from the logo plus adjacent wordmark, persistent submenus, and avatar role pills for every signed-in role and plan pills only for non-Owners. ADMIN, Dashboard and Feedback are active trusted Owner-only by default; all other roles see Profile only at top level, with supported private tools inside Profile. Owner feature controls, top-level admin pages and Traffic/Health charts reuse the destination's palette/fonts. Broader grants need an explicit user-selected policy. Use [the full-system prompt](skills/app-system/system.md#one-adoption-prompt) when you also want the complete public/chat/pricing/blog starter.

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

## Stripe Payments And Custom Domains

These are focused workflows, separate from the default account starter. Copy the complete pack, then choose the requested work:

- **Payments/subscriptions:** [Payments](skills/payments/SKILL.md) connects the destination's plan catalog, private database billing records, verified Stripe operations, trusted entitlements and actual feature/limit enforcement. Use [the Stripe prompt](adoption.md#stripe-payments-and-subscriptions-prompt).
- **Owner payment charts:** the [reporting contract](skills/payments/references/payment-reports.md) adds private aggregate reports and compact Profile/Dashboard panels with source, coverage, freshness and meaningful money/status definitions. Use [the reports prompt](adoption.md#owner-payment-reports-prompt).
- **Production/custom domains:** [Deployment](skills/deployment/SKILL.md) connects the intended Git production branch and canonical domain, with each secondary hostname independently redirecting and detachable into a future site. Use [the domain prompt](adoption.md#custom-domain-and-detachable-redirects-prompt).

Existing projects keep their database and authentication provider; Firebase is the new-app default, not a required migration. Actual account IDs, prices, currencies, quotas, domain inventories, environment names/status and release evidence belong in the destination's docs/configuration outside `ai/`. Private values belong only in ignored local configuration or hosted server secret storage, never ordinary docs or client code. Preparation, connection, deployment and a real financial transaction are distinct outcomes.

[Goals](goals/goals.md) keeps requested scope clear. [Prompts](prompts/prompts.md) provides focused requests without app-specific history.

Use [Shop](skills/shop/SKILL.md) and [its adoption prompt](skills/shop/SKILL.md#adoption-prompt) for a themed Firestore store, cart/native Stripe checkout, permitted shop administration, sourced dropshipping Market, research and controlled fulfillment. It reuses the destination's existing account/store foundations and keeps project-specific pricing/setup outside this portable pack.

## Google AdSense

Use [AdSense](skills/adsense/SKILL.md) for submission readiness, original public content, truthful policies/contact, crawlable metadata, publisher verification and ads.txt. Start with [the submission prompt](adoption.md#google-adsense-submission-prompt); a missing publisher ID remains unconfigured and preparation does not enable ads.

For explicitly requested advertising, use [the serving prompt](adoption.md#consented-ads-and-ad-free-plans-prompt) and [the serving contract](skills/adsense/references/serving.md). It covers consent, eligible public placements, trusted ad-free tiers, feature controls and navigation after advertising code has executed. Google approval, published consent, serving settings, the deployed loader and actual filled ads remain separate evidence. These workflows are optional additions to the app core and do not enable native advertising.

## Frontend Only, Before Connections

For page buildouts without live services, use [Disconnected Account Frontend](skills/disconnected-account-frontend/SKILL.md). Simple prompt: "Prepare this app with the disconnected account frontend skill, keep its theme, and commit to my review branch; no backend connections." This mode does not enable the connected defaults above.
