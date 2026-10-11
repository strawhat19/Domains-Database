# Complete Reusable App System

Use this blueprint when the user asks to implement the full common core. Extend an existing app through its own architecture; a new app follows AGENTS.md's framework defaults. Preserve product-specific feature models, routes, colors, and fonts while applying the shared account shell and working interactions. The common core is reusable; the app's business purpose and content remain its own.

## One Adoption Prompt

After copying ai/ and AGENTS.md into the destination repository, use:

> Implement the full App System from ai/skills/app-system/SKILL.md in this project, completing every common-core module while preserving its framework, theme, features, and existing data. Follow AGENTS.md and report any external setup still needed.

This requests the whole core below. For an existing focused task, apply only the relevant module. Existing working integrations count toward completion; do not replace them merely to match a suggested folder or schema.

## Feature Map

| Module | Frontend And Working Behavior | Detailed Contract |
| --- | --- | --- |
| Public Frontend | App-specific home/hero/features, active pricing section and Pricing page, Blog, About, Contact, Terms, Privacy; internal navigation/aliases, sticky header, avatar menu, current-year footer, and scroll-to-top | AGENTS.md; [routes](../routes/routes.md) |
| Shared Core | Typed models/helpers, one configuration/storage boundary, theme/provider state, thin routes, component logic/views/styles, accessible icons and feedback | [structure](../structure/structure.md), [database](../database/database.md), [API](../api/api.md) |
| Authentication And Users | Firebase Google plus email/password sign-up/sign-in by default unless another provider is chosen, hydrated app-owned accounts, Subscriber defaults, password reset/verification, trusted roles, permitted user/role/status actions | [authentication](../authentication/authentication.md), [Admin](../admin/admin.md) |
| Profile And Account Shell | Editable allowlisted profile, private settings, provider avatar, persistent account-scoped sidebar/submenus and bottom Profile controls across routes | [Admin layout](../admin/layout.md), [social privacy](../social/social.md) |
| Admin And Dashboard | Relevant operational records, summaries, recent activity, permitted users/roles, real feature charts, direct routes; working create/edit/status actions rather than decorative sections | [Admin](../admin/admin.md), [layout](../admin/layout.md) |
| Analytics, Runtime, Charts, Icons | Web collection SDK, protected provider reports, compact/full Chart/List controls, inspection, real units/missing values, complete local flags and source/device/page icons | [Admin reporting](../admin/admin.md#vercel-analytics-and-observability), [layout](../admin/layout.md) |
| Notifications | Private permitted CRUD/public active feed, persisted Active/Inactive status, bell/cards, account read state, unread count, individual/All Read, Reload | [Admin actions](../admin/admin.md#persisted-administrative-actions) |
| Contact Submissions | Validated guest intake, saved database records independent of email, private realtime request review, New/Read/Archived, search/filter/pagination | [Contact intake](../admin/admin.md#contact-intake-and-private-request-review) |
| Private Chat | Authenticated participant-only thread/message creation, realtime bounded lists, pagination, unread/read receipts, composer and saved/error states | [chats](references/chats.md) |
| Plans And Pricing | Authorized catalog creation/editing/publication, stable identities, active public live pricing and existing plan labels; no automatic purchase or entitlement writes | [plans](references/plans.md) |
| Blog And References | Public listing/article/category/search, verified relevant YouTube and Reddit links, source credit, permitted authoring/publication | [blog](references/blog.md) |

The full starter includes these common modules plus the app's existing relevant features. Add commerce, uploads, push delivery, provider email, follower feeds, or other business modules only when requested or already supported. A genuine empty collection is acceptable with working creation/query flows; an unconfigured placeholder does not complete a module.

## Adoption And Integration

Inspect the current app before editing: determine routing/framework, shell/theme, shared persistence/API boundaries, session-to-User mapping, roles, actual configured cloud scope, static/dynamic content, and existing data. Map reusable feature contracts to those boundaries. Keep the mapping and any compatible migration plan in project documentation such as docs/APP_SYSTEM.md, outside ai/. Do not overwrite schemas, IDs, role values, static articles, or account preferences without a compatible path.

Follow the shared data flow: typed records and helpers feed services, services normalize storage and enforce operations, context/hooks expose scoped state, components render it, and routes remain thin. Add focused shared modules for chats, plans, and blog only where required. Share behavior across web/native while using their supported rendering and styles. Reuse the same Firebase instance, account state, capability helpers, route registry, and storage adapter; avoid duplicate caches or authentication systems.

Keep public home, legal/contact, published articles, active pricing, and eligible notifications available without sign-in. Require identity for private Profile and chat actions. Use explicit capabilities for administration: Owner manages trusted roles/configuration, Admin has granted operations, Developer has granted technical reports, Subscriber has own-account features. Preserve stricter existing contact/message policies. Pricing publication cannot assign a User plan, alter roles, or establish payment entitlements.

Write restrictive rules alongside each new collection and matching bounded queries/indexes. Public projections contain only their intended display fields; private messages, contact details, account credentials, role records, drafts, and read state do not leak through public records or counters. Use app-owned stable IDs/numbers and atomic allocation as described in Admin. Include permitted create/update fields and immutable identity/ownership checks, including when clients call services directly.

Compose one shared account shell for Profile, Admin, Dashboard, chat management, plans, and authoring. Use the layout reference's measured header offset, full-width content, flush-left sidebar, persistent collapse/submenus, profile controls, responsive tables, and reporting geometry; retain the destination theme and fonts. Public frontend sections follow the app's own design while sharing its theme/icons. Legal content must describe actual behavior, not imaginary payment, email, or sharing features.

## Completion Matrix

Report each module as Implemented In Source, Connected, Setup Needed, or Blocked, with its actual paths and remaining prerequisites. Source implementation and a live connected service are separate claims. Do not mark a module complete merely because a route or empty panel exists.

| Area | Required Source Evidence | External Setup To Report |
| --- | --- | --- |
| Public Frontend/Core | Real routes/components, legal/contact/blog/pricing navigation, shared theme/providers/helpers, accessible responsive web/native views | Domain/deployment target and any missing licensed assets/content |
| Auth/Users/Profile | Supported provider flow, app-owned User mapping, hydrated account gate, allowlisted updates, role/status operations and guards | Firebase project/config, Google origins/provider setup, deliberate trusted Owner bootstrap |
| Database/Rules | Models/services, bounded listeners/cursors, atomic IDs/counters, private/public projections, matching rules/index definitions | Rules/index deployment and environment-specific resource selection |
| Admin/Dashboard/Reports | Capability-consistent direct routes/actions, real source/window summaries, themed charts and full icon coverage | Vercel project/token/plan access; unavailable metrics remain truthful |
| Notifications/Contacts | Persisted CRUD/status/read operations, confirmed contact saves, private paged review, separate delivery outcome | Optional delivery configuration only when that feature exists |
| Chat | Participant-only services/rules, thread and message subscriptions/paging, committed send/read updates, scoped unread/read indicators | Any required indexes/trusted summary operations |
| Plans | Catalog CRUD/publication, active live Pricing/Home views, immutable IDs/slugs, separate entitlement boundary | Owner-provided catalog/price details and any existing independent billing integration |
| Blog | Published list/article/category/search, authorized editor/publication, genuine credited sources including YouTube/Reddit, no draft leaks | Verified app-relevant content/source catalog; optional feed API access |
| Handoff | Secret-free environment example, project-specific route/schema/setup map, source review notes and actual limitations | Explicitly identify checks/deployment not performed |

Continue until all requested source paths and permitted actions are concrete and reviewable. If credentials/resources are missing, finish their typed boundary and honest setup/error UI, then name the external prerequisite. Do not substitute fake records, random charts, successful local fallback, fabricated links, or purchased entitlements. Follow AGENTS.md rather than running unrequested validation, deployment, or commits.
