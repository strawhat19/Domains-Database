# Provider Photo Refresh

Read this reference when a requested identity workflow needs current upstream photos beyond the provider metadata already supplied by sign-in. Keep the destination's auth provider, custom-avatar policy and validation scope. This is an optional extension, not permission to add OAuth scopes, credentials, token storage or a new login flow.

## Fresh Results And Restored Sessions

Use the fresh sign-in result's picture first, then its Google provider data, then its Firebase photo when appropriate. Verify web and native response shapes separately. Firebase's web `GoogleAuthProvider.credentialFromResult(result)` can expose an authorized Google access token; a Firebase ID token is a different credential. Supported native sign-in responses can expose a fresh user photo while their token getter returns the access token separately.

A Firebase reload reads stored Firebase account/provider metadata and does not guarantee a live Google profile request. On browser restoration an in-memory Google token may be absent; keep the saved avatar and describe the fallback honestly. Do not open a popup, silently add scopes or treat an ID-token refresh as Google photo freshness. Missing or invalid pictures retain the saved photo; removal requires the destination's explicit policy.

## Already Authorized Google Access

Keep any reusable Google access token in transient shared memory, scoped to the Firebase user, Google provider UID and session/attempt generation. Never put it in account documents, browser/device storage, URLs, analytics or logs. Clear it on sign-out, identity replacement and a new sign-in generation, even for the same UID. Stale auth callbacks cannot clear a newer session's token. Discard expired/denied access and fall back without invalidating an otherwise valid Firebase session.

For an already authorized profile check, use Google's documented userinfo endpoint with the access token in its authorization header. Verify the response `sub` against the current user's Google provider UID, not the Firebase UID or email. Recheck the originating session before using the result or saving its validated HTTPS photo. Bound the request and token wait; abort supported network work and ignore late completions. Keep upstream failures optional and safely logged, while required account-loading or authorization failures remain real errors.

Inspect the installed native token implementation before using it in a focus/restore hook. A token getter can launch recoverable authorization UI even when a saved Google user exists. If the supported getter may prompt, capture its token only during an explicit Google sign-in action, with current native/Firebase identity and attempt checks before and after retrieval. Background refresh reuses that transient token; it does not call the getter to regain access. A bounded wait cannot necessarily cancel underlying native UI, so do not hold successful app-account hydration on optional token capture.

## Refresh And Persistence

Use one shared refresh operation for the current account. Where requested, trigger it on visible mount, focus, reconnect or native foreground activation, with a bounded interval/cooldown and concurrent-request deduplication. Avoid hidden-page polling, per-avatar requests and render-triggered network calls. Explicit Refresh may bypass a cooldown while still joining work already in flight. Skip custom avatars and unchanged/missing photos; let confirmed account subscriptions propagate a committed change.

Read the current mapped account before reusing a bootstrap endpoint that also reconciles provider metadata. Without a genuinely fresh sign-in/upstream result, preserve its validated saved provider photo instead of sending older Firebase fallback data that can roll it back. Verify how the endpoint treats omitted and null photos: a backend fallback may still refill an empty avatar. Do not invent a removal sentinel or claim null preservation when the contract cannot provide it.

The server derives the target from the authenticated mapping and atomically rechecks active status, ownership, custom override and any expected photo/revision before changing only allowed photo/provenance fields and timestamps. Preserve app-edited names and unrelated account fields. An explicit custom-photo edit must win over a concurrent provider refresh. Keep optional photo-only write failures separate from required account bootstrap; if the existing endpoint couples them, identify that limitation instead of treating an authorization failure as successful login.

A shared client queue can order local bootstrap, photo and profile requests and discard stale results. It cannot guarantee freshness across devices or prove that a timed-out server request did not commit. Use the destination's server conflict/revision checks when that guarantee is required. Do not claim strict global ordering from a local queue or add a schema/API migration without the requested scope.

Primary references: [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Google OpenID Connect userinfo](https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation), and [native Google sign-in/token behavior](https://react-native-google-signin.github.io/docs/original).

Copyright 2026 strawhat19. Licensed under the [portable pack MIT license](../../../LICENSE).
