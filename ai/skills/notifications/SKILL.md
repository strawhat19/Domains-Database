---
name: notifications
description: Build or refine database-backed in-app notification bells, published announcement pages and authorized management with private read state. Use for header unread badges, announcement inboxes and Owner CRUD; email or push delivery is separate requested scope.
---

# In-App Notifications

Read applicable structure, database, API, authentication and route guidance, then [Admin](../admin/SKILL.md), [notification persistence/read hydration](../admin/references/workflows.md#notification-state-and-read-hydration), [Firestore](../admin/references/firestore.md) when applicable and [header/account controls](../admin/layout.md#header-notifications-and-account-actions). Reuse those contracts and the destination's framework, branding, trusted capabilities and stricter permissions. For an explicit frontend-only task, follow [Disconnected Account Frontend](../disconnected-account-frontend/SKILL.md); this skill does not authorize cloud setup, delivery or a release by itself.

## Header Bell And Popup

Honor existing [feature/audience gates](../admin/references/features.md); unresolved or disabled feature eligibility hides entry points without deleting data. When enabled and eligible, place the bell immediately left of the signed-in avatar and the signed-out Sign In/Sign Up controls, including custom action slots. Keep that placement through eligible auth/feed loading and error states, using an unknown badge until read state is known. Match the existing settings/utility button's size, surface, border, icon weight and focus treatment. Preserve the destination's utility motion and reduced-motion settings. Opening or closing a popup and restoring its trigger focus must leave unrelated marquees moving.

Use the real published feed and private read state for the unread badge. Unknown, cached, pending and failed state stays explicit; it never becomes a fabricated zero. Disclose loaded-window coverage when the count is partial. Show the latest published items with kind, title, plain-text body, date, safe optional destination, individual read and observed-feed All Read actions. Include Reload and an always-reachable Full Notifications link through loading, empty and error states. Read mutations require confirmed feed/history; Reload remains usable for recovery.

Animate entrance and exit with the app's shared timing. Retain the panel until exit finishes, disable hidden pointer/keyboard/accessibility interaction immediately, and support interrupted close/reopen. Anchor within the viewport, escape clipped header containers on web, dismiss on outside interaction, Escape, navigation and identity changes, and return focus when appropriate. Provide corresponding native modal/pressable behavior and touch targets. Readability and focus safety must survive reduced motion.

## Feed, Read State And Management

Share one publication/read-state boundary between the bell and full page. Follow the workflow contract for bounded realtime paging, source/error states, private cloud receipts, guest-device separation, stable read semantics, concurrent merges, explicit recovery and account changes. Keep the public feed outside a private workspace subtree that remounts whenever identity changes; clear private read state immediately before the next account hydrates.

The full page lists published announcements, read actions and paging, with the app's declared stage/version and only supported current service observations. Show checked times, missing configuration and failed checks honestly. A response from one health endpoint proves that service responded; it does not establish global uptime or working providers. Link to existing Blog, News and documentation pages without inventing articles or capabilities.

Use active trusted Owner management by default and preserve the destination's verification requirements. Apply the same capability at navigation, direct routes, services and persistence. Provide bounded list/search/status controls, Add Draft, Quick Edit, Publish/Unpublish and confirmed Delete using [shared account icon actions](../admin/layout.md#header-notifications-and-account-actions). Keep visible confirmation copy, record-specific accessible labels, real pending/error feedback and failed drafts. Save only validated plain text, kinds and supported safe links. Public queries must exclude drafts; read receipts never change global publication.

Seed only the requested starter count/content through an explicit authorized idempotent import. A welcome notice and honest development/status notice are useful when they match the actual app. Preserve edits and deliberate deletions on rerun; empty-feed and sign-in paths never reseed. Use atomic app-owned ID/number allocation, bound retry receipts and expected revisions from the workflow contract. Keep multi-write rules within provider evaluation/access budgets; verify legitimate creation as well as denial cases without weakening transaction coupling.

## Handoff

Keep the destination's actual schema, route choices, collection limits, seed content/history, resource identifiers and evidence outside `ai/`. Preserve this pack's [MIT license](../../LICENSE), copyright 2026 strawhat19, when copying. Keep private publication management, account read state and optional email/push delivery separate.

Within the authorized validation scope, check signed-in and guest placement, confirmed unread persistence/isolation, publish/unpublish visibility, Owner boundaries, editor actions, keyboard/rapid-reversal motion and full-page links. Report source, rule/index deployment, saved records, browser behavior and native-device checks separately; a configured SDK or copied skill is not proof of connectivity.
