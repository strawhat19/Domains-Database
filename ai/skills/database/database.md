1. Before a backend is connected, use local browser or device storage for demo CRUD. Keep one shared master variable named useLocalStorage, true by default. When false, use the connected backend or preserve an explicitly selected session-only mode for existing CRUD. Report the actual mode; do not claim session-only data is persisted. Authentication without a backend follows its separate connection-needed behavior.

2. Keep typed models under shared/models, shared enums under types/types.ts, and storage helpers under shared/common. Use one storage adapter across browser and native targets, with framework-specific implementations only where required.

3. Users, notifications, visits, and other model collections may start empty and fill through user actions. Keep optional sample data in a separate module with an explicit setting; do not silently repopulate cleared collections or replace saved data with samples.

4. App-owned records use an auto-incrementing integer number and an ID shaped Type_Number_Name_Date_UUID. The number must match the number embedded in the ID. Keep IDs and numbers stable during edits and imports; store external service IDs in clearly named fields rather than using them as primary IDs.

5. Generate IDs through the shared helper instead of duplicating formats in feature code. Allocate numbers from a persistent counter or an atomic backend operation so concurrent writes cannot create duplicates.

6. Read and write collections through the internal API or service layer. Use the shared common/collection factory when repeated typed CRUD benefits from a common implementation with per-account storage and monotonic numbers. Components should not parse storage, generate record IDs, or implement separate caches. Keep persisted state and React Context or framework services synchronized after mutations.

7. Validate storage shape on load, distinguish missing data from unreadable data, and surface storage failures. Version serialized data when its shape changes and preserve compatible existing records during migrations. Do not overwrite malformed saved data with an empty collection without explicit recovery intent.

8. Store local authentication and account connection credentials separately from public User records in private account-scoped storage. Profile visibility cannot expose them. Apply [authentication guidance](../authentication/authentication.md) when changing users or sessions, [social guidance](../social/social.md) for profile and content audiences, and [API guidance](../api/api.md) for model operations and loading behavior.

9. Optimize records for local or device storage first and a later Firebase Firestore adapter. Data.toRecord() returns plain JSON-compatible fields, omits undefined object fields, and keeps dates as ISO strings; persist that record rather than class methods or prototypes. A future Firestore adapter should use the same app-owned id as the collection document key, preserve its matching number and account uid, and keep external service IDs in named fields. Preserve the separation of public social records and private account data when changing adapters. Prepare this storage boundary without adding a Firestore SDK before its integration is requested.
