# Custom Avatar Uploads

Read this reference when a requested profile workflow lets a signed-in user upload their own profile photo. It complements provider photo sync in [the User Identity skill](../SKILL.md); provider checks still never add an upload feature on their own. Pick one storage model per destination, based on whether the photo must be public.

## Shared Rules

- Accept only JPEG, PNG and WebP. Check size (non-empty, destination maximum such as 2 or 5 MiB) and the file's magic bytes, not just the browser-supplied type; the stored content type and extension must match the detected format.
- Name every object with a fresh random UUID inside a per-account folder. Never overwrite in place; never trust a client-supplied path.
- Bind the upload to the expected account: recheck the current auth user before upload, after upload and before saving, and abandon (and delete, when still the same user) an object whose account changed mid-flow.
- Save the result through the existing authenticated profile operation, which sets `avatarSource`/custom-avatar fields, requires an active app account and keeps the role/identity field allowlist. A later provider photo sync must not overwrite the custom choice; removing the custom photo restores the saved provider photo when available.
- Deploy `storage.rules` with the app (`firebase.json` storage entry, `firebase deploy --only storage`) and document the bucket, environment variable and actual release evidence in project docs, not in `ai/`.
- Native builds need the picker dependency (for example the Expo document picker) and a rebuild of existing custom native builds.

## Public Model (Client Upload)

Use when avatars appear on public profiles. The client uploads directly to Firebase Storage under `avatars/{sha256(uid)}/{uuid}.{jpg|png|webp}`. Storage rules allow `get`/`delete` only when the folder equals the SHA-256 of `request.auth.uid`, and `create` only for a matching UUID filename, allowed content type/extension pair and size limit; no list or update. Save the Firebase download URL as the custom avatar. Tell the user plainly that anyone with the image link can view it, and that profile visibility controls where the app shares it. Only delete an old object when its URL is in the app's bucket, matches the UUID naming and sits in the caller's own folder.

## Private Model (Server-Mediated)

Use when avatars are visible only to the account and trusted Owners. Storage rules deny all client access. An authenticated API route (GET/PUT/DELETE) takes a bounded base64 body, validates type and magic bytes, writes with the Admin SDK to `account-avatars/{userId}/{uuid}` with `ifGenerationMatch: 0` and `Cache-Control: private, no-store`, then transactionally records the object path, content type and upload time on the active user (matching Firebase UID) and sets `photoUrl` to the API path with a version query. Delete the new object if the transaction fails and the previous object after it succeeds. GET serves bytes only to the owner or a trusted Owner with `nosniff`; clients fetch it with a bearer ID token instead of a plain image URL. Account deletion removes the user's avatar prefix. The bucket comes from a private server variable (for example `FIREBASE_STORAGE_BUCKET`), and the runtime service account needs object access.

Sources: strawhat19/Directory-Directory 19948aa (public model), strawhat19/Science-Histories 5985f05 (private model).
