---
name: user-identity
description: Synchronize provider profile photos and render each user's avatar beside their name or username. Apply when building or changing authentication, Users tables, account shells, profiles, author or participant labels, and other user identity displays.
---

# User Identity And Profile Photo Sync

Use this skill by default for user identity displays within the requested app or feature. Follow the applicable [authentication](../authentication/authentication.md), [social/privacy](../social/social.md) and [Admin workflow](../admin/references/workflows.md#profile-users-and-own-data-controls) contracts. Preserve the destination's framework, provider, shared models, theme and access policy. For frontend-only work, follow [Disconnected Account Frontend](../disconnected-account-frontend/SKILL.md): render truthful supplied identities without claiming provider sync or enabling backend connections.

## Shared Identity Data

Reuse or create a shared avatar/identity component with the existing component-folder conventions. Pair the avatar with the displayed user's name or username in Users tables, account/header/sidebar controls, Profile, author/reviewer labels, participant lists, messages, and user-attributed notifications wherever those surfaces exist in scope. Existing compact avatar-only controls keep an accessible user name. Text inputs, raw username values in exports/logs, and incidental names inside prose remain text; this rule applies to UI that identifies a user.

Resolve each displayed identity by its stable app-owned user ID through the shared service/context and authorized user projections. The signed-in account's photo belongs only to that account; never reuse the viewer's Firebase profile for every table row or author. Keep provider IDs in their existing mapped fields and preserve record IDs/numbers. Reuse existing photo/name field names through a typed adapter rather than introducing a parallel user store or forcing a schema migration.

Saved photo changes must reach the current account and eligible Users tables, cards and other identity consumers through the same confirmed shared state or bounded realtime subscriptions. Refreshing a Users table reads each person's latest permitted saved identity; provider synchronization runs in that person's authorized account flow. Use bounded batches/shared caches for related user identities; do not create a provider request or independent database listener for every username. Resolve current display metadata from the authorized identity source instead of leaving copied author photos permanently stale. Preserve intentional historical snapshots separately from current identity display.

Public and participant views receive only the safe identity fields their audience may read. An avatar does not authorize public reads of private User records, emails, roles or credentials. Preserve private-profile and deleted/restricted-account behavior; show a permitted saved label or neutral identity when the current projection is unavailable. Clear account-scoped state and listeners before switching users.

## Provider Photo Synchronization

At account creation and each successful provider sign-in, reconcile the freshest valid photo returned by that provider with the mapped app user's photo. For Google, prefer the fresh sign-in result's profile picture, then its Google provider data, then the Firebase profile photo when appropriate. Verify the installed SDK's current documented response shape rather than assuming the top-level Firebase photo is always the newest Google photo.

During restored-session hydration/browser refresh, perform a best-effort provider-profile check through the shared auth service. Reuse an SDK startup reload when it already obtains the account profile; avoid duplicate reloads, render-triggered polling and automatic login popups. Firebase account reload reads Firebase's stored provider data, not Google's live profile. A Google change may still require Google sign-in and provider propagation; never describe token refresh or Firebase reload as guaranteed live Google polling. Direct upstream checks require an already authorized provider API flow and truthful handling of expired or missing access. This default does not add scopes, OAuth token storage or new credentials.

Validate photo URLs at save and render boundaries using the destination's length limits and HTTPS policy. Reject unsafe schemes or embedded URL credentials. Missing/omitted provider photos retain the saved avatar; only a confirmed provider removal under the destination's photo policy may clear it. Preserve an existing user-selected custom-avatar override and app-edited names/usernames; a provider photo check must not overwrite those choices or add an upload feature.

Skip unchanged writes. A changed provider photo updates only the allowed photo field and update timestamp, preserving role, status, ownership, privacy, names, email, IDs and entitlements. Derive the target from the authenticated account mapping and recheck the current session, expected account, active status and relevant photo override before saving; use the existing atomic persistence mechanism to prevent stale concurrent work from overwriting a newer choice. Rules/server authorization enforce the same ownership and field allowlist.

Deduplicate concurrent hydration/sign-in work and discard results from replaced sessions, including a new sign-in to the same UID. Optional photo-sync errors preserve the valid session and last confirmed avatar, report a safe concise failure through the existing logging/status boundary, and allow retry on later hydration or sign-in. Do not swallow account-loading or authorization failures as a successful sync. Propagate committed photo changes through the existing subscriptions rather than inventing a local save.

## Avatar Presentation

Use the authorized current photo, otherwise a themed colored circle with the first available name/username letter capitalized; use a neutral person glyph when no permitted name is available. Keep the fallback visible while the photo loads or fails. Reset image-failure state when the URL or displayed identity changes. Honor normal image-cache revalidation; avoid permanent failure flags or random cache-busting writes on every render.

In a Users table, place a compact circular avatar immediately before the name/username in the existing Name/User cell, aligned with its readable text. Reuse that identity treatment in other lists and native row cards. Retain the destination's row density, status/action cells and responsive layout; use proportional cover cropping rather than stretching photos. Give repeated identity wrappers/images descriptive IDs containing the user ID and row/occurrence key so repeated users do not create duplicate element IDs.

When readable name text is adjacent, treat the image and fallback initial as decorative to avoid duplicate announcements. Avatar-only links/buttons need the person's name in their accessible action label and the existing keyboard/touch/focus behavior. Keep web/native data, fallback behavior and sync semantics consistent; implement the provider's supported native auth flow instead of copying a web popup into native code.

## Adoption And Evidence

For connected-account or full-app adoption, inventory and connect all included username/identity surfaces, including Users tables; updating only the signed-in header does not complete identity coverage. Focused tasks apply this shared behavior to their requested consumers without adding unrelated app modules. Copy this skill with the complete portable `ai/` pack and its [MIT license](../../LICENSE), copyright 2026 strawhat19. Keep destination schemas, provider setup, overrides and actual verification evidence outside `ai/`.

Follow AGENTS.md for validation permissions. Source review should cover existing Google-user re-sign-in, restored-session freshness limits, unchanged/missing/invalid photos, custom overrides, stale account switches, two different users in a table, allowed author/participant views, image failures and native equivalents where supported. Run checks only within the authorized scope and distinguish source completion, committed cloud data, deployed rules, browser behavior and native-device evidence.

Primary provider references for implementation: [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firebase reload implementation](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/src/core/user/reload.ts), [Firebase startup hydration](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/src/core/auth/auth_impl.ts), [Google optional profile claims](https://developers.google.com/identity/openid-connect/openid-connect#an-id-tokens-payload), and [Google profile photo propagation](https://support.google.com/accounts/answer/27442?hl=en).
