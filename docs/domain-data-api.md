# Domain Data API And Copy JSON

`GET /api/domains` is a real, read-only Expo HTTP endpoint. It returns a versioned JSON envelope with domain records, collections, groups, source/access metadata, timestamps, coverage, and cursor pagination. The existing `api.getDomains()` remains the internal service returning the current account's domain models; it does not change signature or become an HTTP request.

## App Usage

```ts
import { domainDataAPI } from './src/api/domainData';

// Current signed-in account; the client obtains its Firebase ID token.
const own = await domainDataAPI.getDomains({ limit: 50 });

// Replace publicUserId with an app-owned User ID from a shared profile.
const shared = await domainDataAPI.getDomains({
  limit: 50,
  userId: publicUserId,
  visibility: `public`,
});

// Continue the same account/visibility query while another page exists.
const next = shared.page.hasMore
  ? await domainDataAPI.getDomains({
    limit: 50,
    userId: publicUserId,
    visibility: `public`,
    cursor: shared.page.nextCursor!,
  })
  : null;
```

The facade is also exported from `src/api/index.ts`. Pass an `AbortSignal` as the second argument to cancel a request. The client supports web and native; native builds use the existing `EXPO_PUBLIC_SITE_URL` to reach the deployed Expo Node endpoint. It rejects late results after the Firebase account changes. Guest anonymous Firebase identities used for plan votes are not implicitly sent as portfolio credentials.

## HTTP Queries

| Parameter | Meaning |
| --- | --- |
| `userId` | App-owned `User_…` ID. Defaults to the authenticated account. Required for visitors. This is not the Firebase UID. |
| `visibility` | `accessible` by default: fuller private data for the record owner or an active trusted Owner, otherwise public data. `public` always requests the public projection. |
| `limit` | Domain page size, 1–100; defaults to 50. |
| `cursor` | The prior response's `page.nextCursor`, used with the same account and visibility. |
| `domainId` | One exact app-owned Domain ID. Cannot be combined with `cursor`. |

Examples, replacing IDs with actual app-owned record IDs:

```http
GET /api/domains?userId=USER_ID&visibility=public&limit=50
Accept: application/json
```

```http
GET /api/domains?limit=50
Accept: application/json
Authorization: Bearer FIREBASE_ID_TOKEN
```

An active trusted Owner can add another account's `userId` to an authenticated request. Tokens belong in the Authorization header, never in a query string or copied JSON. Unknown/repeated query parameters, malformed IDs, unsupported visibility, and invalid limits are rejected. This endpoint adds no HTTP create/update/delete operations; existing inventory mutations still use their internal services.

## Access And Fields

The server verifies any supplied Firebase ID token through the existing Firebase Auth verification boundary, resolves the app-owned account mapping, and reads its current active status and role. Only the exact active `Owner` role grants cross-account private access for this endpoint; Admin, Administrator, and Developer labels do not. Missing authentication permits only explicit public portfolio requests. Invalid or incomplete authentication fails rather than silently becoming a guest request.

Public reads deliberately omit the caller's Firebase token on their Firestore data reads. A privileged caller choosing `visibility=public` receives the same limited projection as a visitor. Firestore's publication/privacy rules remain an additional access boundary. The endpoint does not use an Admin SDK service account or bypass database rules.

| Data | Public | Own Account / Active Owner |
| --- | --- | --- |
| Domain identity, name, extension, description, registrar, project status, registration/expiry dates, MVP/future notes, difficulty | Published allowlisted fields | Saved fields |
| Record number, title, owner label, update/import/export history | Excluded unless already part of the public projection | Included when saved |
| Notes, tags, prices, estimates, renewal settings, DNSSEC/lock/privacy settings, nameservers, registrant details | Excluded | Included when saved |
| Project links and domain metadata, including stored registrar/website insight snapshots | Excluded | Included through explicit field selection and credential filtering |
| Collection identity/name/description/status/date and membership | Explicitly public, non-hidden collections under an eligible public profile | All saved collection metadata, including private and empty collections |
| Group identity/name/description/date, collection reference, app marker and membership | Non-hidden groups inside an explicitly public, non-hidden collection | All saved group metadata, including standalone and empty groups |
| Credentials, connections, passwords, session/provider tokens, unrelated private account documents | Excluded | Excluded |

All responses use explicit top-level field lists. Metadata is converted to JSON-safe values, with credential-shaped keys and secret-bearing authorization/private-key values removed. URLs containing user/password credentials or secret query parameters are omitted. Account connection documents are never read. This filtering does not make arbitrary user-authored notes suitable for public sharing: public domain responses exclude notes and raw metadata entirely.

Only saved information is returned. Fetching domains does not spend provider quotas, request new market data, synchronize a registrar, or generate visitor/valuation estimates. Existing stored insight/provider values retain their original source dates. Private responses apply the existing portfolio timestamp overlays so optimized registrar sync timestamps match the app's saved domain view.

## Response And Pagination

The JSON envelope has these fields:

```ts
{
  schemaVersion: 1;
  success: true;
  source: `firebase` | `displayed`;
  access: `public` | `own` | `owner` | `displayed`;
  fetchedAt: string;
  userId: string | null;
  domains: Record<string, JSONValue>[];
  groups: Record<string, JSONValue>[];
  collections: Record<string, JSONValue>[];
  page: {
    limit: number;
    returned: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  coverage: {
    relationships: `page`;
    warnings: string[];
  };
}
```

Domain pages use stable ascending document-ID order and one lookahead record. The response includes authorized collection/group metadata, including empty records. Their `domainIds` contain only domains returned on the current page; collection membership combines direct domains and its groups. An empty membership array can mean the collection/group is empty or its domains fall on another page. It is not a whole-portfolio count. Merge records by ID while following `nextCursor` to assemble a larger snapshot.

Requests use a 25-second server timeout, an eight-request per-instance concurrency limit, and a 3,000,000-byte response/read limit. Reduce `limit` if domain metadata exceeds the response bound. Responses are private/no-store and vary by Authorization; private records are not shared in a response cache. Source metadata and access are not inferred from caller-supplied role values.

## Public Collection And Group Publication

The existing public domain/profile projections remain in `publicProfiles/{userId}` and its `domains` subcollection. Shared collection/group metadata now has a separate infrastructure snapshot at:

```text
publicProfiles/{userId}/portfolio/shared
```

The snapshot has `version`, `userId`, `updatedAt`, `sourceDataId`, `sourceRevision`, `collections`, and `groups`. Automatic publication includes only explicit safe metadata fields. It excludes private collections, standalone groups, hidden collections/groups, hidden domain memberships, financial fields, development/preview links, notes, contacts, and raw metadata. The API further intersects membership references with its permitted domain page.

Public access requires the source account to remain active, its profile to be public, and public-domain sharing to be enabled. A public collection's groups inherit that collection's sharing; standalone groups currently have no independent public setting. Own/Owner reads do not depend on public publication.

Private preference saves and public snapshot set/delete operations occur in the same Firestore transaction. The public snapshot's source Data ID/revision must match the current exact preferences record and key mapping. Older clients changing preferences without updating this snapshot make the old snapshot unreadable. Profile privacy or account deactivation also blocks public reads immediately through the existing privacy gate. Missing/stale publication never triggers a private-data fallback.

Existing accounts publish the new snapshot on their next preferences save or profile-sharing save. A missing snapshot is reported with a publication warning rather than invented empty public metadata. Publication is bounded to 200 public collections, 500 groups, 5,000 membership references, and 750,000 JSON bytes; oversized publication is rejected before the private preference transaction commits. Firestore rules constrain the snapshot envelope, ownership, bounds and source binding; the pure projector/reader enforce the nested allowlists, because rules cannot iterate arbitrary arrays.

## Copy JSON

The existing web copy icon opens a menu with **Copy JSON**, alongside the list and tree formats. It is available for individual domains, groups, collections, portfolio selections, settings actions, and supported collection stars. Empty groups/collections can copy their metadata. Selection and Include Hidden control which loaded records are included.

The shared serializer produces the same envelope as the HTTP API, with `source: displayed` and `access: displayed`. This is an explicitly identified snapshot of already-loaded records, not proof that the server reauthorized a fresh request. Copying does not fetch data or write records. Credential filtering and relationship pruning apply to the copied JSON too; serialization and clipboard failures use the existing copy-error feedback.

The existing copy controls are web-only. This change does not add a native clipboard dependency or new native copy controls; native app code can use the new data API facade.

## Source, Connectivity And Deployment

The implementation uses the existing configured Firebase project/default database and Expo Node adapter. No database, provider key, account, or cloud resource was created. The REST reader follows [Firestore's Firebase ID-token authorization model](https://firebase.google.com/docs/firestore/use-rest-api), [structured query cursors](https://firebase.google.com/docs/firestore/reference/rest/v1/StructuredQuery), and the existing [Firebase Auth account verification](https://firebase.google.com/docs/reference/rest/auth#section-get-account-info) boundary.

Review and deploy the updated `firestore.rules` to the configured project for the new public snapshot and narrow Owner preference/snapshot reads. Deploy the app and server together. No new composite index is required by the document-ID-only domain paging query. Existing local/device portfolios are not uploaded or served by this endpoint automatically, and a static XAMPP/Apache document root cannot execute Expo API routes.

Source implementation and documentation are complete separately from external setup: no rules or app deployment, live credential exercise, tests, typechecks, builds, or UI checks were performed. Changes remain uncommitted for review.
