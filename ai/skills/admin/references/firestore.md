# Firebase, Accounts, And Realtime Firestore

Use this contract for connected account/data work, with [Admin](../admin.md), [authentication](../../authentication/authentication.md), and the destination's actual schema/query map. Realtime Cloud Firestore is the default data store here. Firebase Realtime Database is a separate product with a different SDK and rules format; do not create or assume both without a requested use case.

## SDK, Providers, And Private Configuration

Initialize one Firebase app per environment/runtime through the shared boundary. Keep public client identifiers in the framework's supported environment names, and real server/Admin SDK credentials and provider tokens only in private server configuration. Missing configuration shows Connection Needed; it must not automatically enable a local demo. Preserve an existing explicitly selected local mode and describe its scope.

New full apps support Google plus Firebase email/password signup/signin, verification/reset and supported persistence unless the user chooses another provider. Preserve existing provider choices for focused work. Enable actual providers and authorized local/preview/custom origins in the selected project; web popup/redirect and native credential flows use their platform-supported APIs. Firebase owns passwords and account tokens. Handle cancellation, disabled providers, blocked popup, linking conflicts, missing mapping and account deactivation explicitly.

Hydration waits for both Firebase identity and the app-owned User. Deduplicate concurrent hydration, subscribe to current authoritative role/status, and reuse confirmed account state for ordinary actions while retaining required lifecycle/reauthentication reads. New accounts are active private Subscribers; a trusted deliberate bootstrap creates the first Owner. A local Google mock is a demo, not a production provider. [Google provider setup](https://firebase.google.com/docs/auth/web/google-signin)

Normalize existing role labels/case and scalar role/roles arrays through one helper with a declared canonical representation. Keep mirrored fields consistent, preserve legacy role values, and do not grant permissions by array order. Subscriber has own-account actions, Developer only explicitly granted technical reports, Admin granted operations, and Owner trusted configuration/role management. Preserve stricter contact/record policies. Separate app deactivation from disabling/deleting Firebase Auth identity.

Ordinary account/profile writes cannot change ID/number/UID/ownership/roles/entitlements. Trusted access changes atomically write the affected account and immutable audit record/counter where required, recording actor/target/before/after/time; preserve self-access/elevated-target and last-Owner constraints. A server verifies the ID token and authoritative current active role before every privileged result. Admin SDK paths bypass rules and authorize independently. Custom claims, if chosen, are trusted/server-managed and require refresh/propagation handling. [Token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)

## Portable Record, Query, And Rule Map

Map these logical records to the destination's existing collections. Keep the actual names, fields, role values, limits, and migration notes in project docs outside ai/. Infrastructure lookup documents can use stable UID/collection keys; application records retain app-owned IDs and matching numbers.

| Logical Record | Identity And Fields | Read/Write Boundary |
| --- | --- | --- |
| Private account | App-owned User ID/number, firebase_uid, display/profile fields, role, active status, timestamps | Own permitted account read; authorized user management; allowlisted self edits |
| UID access mapping | Provider UID key, app-owned user reference, authoritative role/status if chosen | Own constrained lookup and trusted administration; no public listing or self promotion |
| Public profile | Explicit safe name/handle/avatar/bio projection and visibility | Public only when deliberately shared; private fields never copied |
| Collection counter | Collection/scope key, last allocated number, optional last record reference | Trusted allocation or tightly coupled atomic client writes; never a public content feed |
| Private summaries | Scope, measured totals/series, source coverage and update time | Authorized reports; trusted incremental maintenance |
| Announcement | ID/number, title/body, kind/link if supported, canonical publication status, timestamps | Active public query; operational management capability |
| Read preferences | Own account key, notification IDs/read cursor, update time | Own account only; bounded/versioned state and account reset policy |
| Form submission | ID/number, allowed form fields, New/Read/Archived review state, timestamps, optional verified actor | Validated public creation; explicit private review capability |
| Private connections | Account scope, provider metadata and secret references | Own safe metadata operations; real production secrets remain server-owned |

Counter, mapping, read-state, slug reservation, and aggregate keys are infrastructure exceptions to content naming; document them explicitly instead of changing existing content IDs to Firebase UIDs. Notification/contact/chat/plan/blog content records are not exceptions.

## Account Creation And Atomic Identity

Use a shared ID helper that sanitizes the type/name stem, uses one defined date format, and appends collision-resistant randomness. Preserve the complete existing format, number, ID, creation time, and relationships on edits. Use a fixed non-personal stem for sensitive intake or private records; app IDs can appear in paths and logs, so avoid emails, secrets, and message bodies.

Resolve the Firebase UID through the private mapping before creating a User. An idempotent create/load operation allocates the collection number, builds the app-owned record, and writes the UID mapping together. Simultaneous tab/provider callbacks must resolve to one account. Generate stable attempt values outside a retryable callback where needed; return the committed result before updating context or showing success.

Firestore transactions perform reads before writes, can rerun, and fail offline. Keep navigation, toasts, state updates, external delivery, and other side effects outside the callback. Couple counter advancement to the new document and any required account/summary references. An increment alone does not prove a document received the corresponding number. Prefer a trusted intake endpoint where guests would otherwise need to read private allocation metadata. [Atomic operations](https://firebase.google.com/docs/firestore/manage-data/transactions)

For permitted client allocation, rules must validate the before/after counter, exactly the next positive integer, the document ID/number match, and existence of the matching newly created record through getAfter. Validate both directions so a standalone counter write, counter jump, overwritten mapping, or second record with the same allocated number cannot pass. Keep create and update predicates separate. Counters never decrease after deletion. Imports preserve legitimate identity, deduplicate by stable key, and advance the high-water mark through a trusted operation; never renumber live records or derive shared allocation from a loaded page.

## Listener And Connection State

A reusable subscription accepts typed scope/filter/cursor/limit values, returns an unsubscribe function, and delivers records plus an explicit loading/error/source state. Define whether the state is Waiting For Session, Connection Needed, Loading, Live, Cached, Pending Writes, Empty, Access Denied, Index Needed, or Read Failed. Do not infer a confirmed live connection merely from SDK initialization or an online browser.

Wait for session and app-account hydration before attaching protected subscriptions. Share a subscription where several consumers need the same query. Account, role, active status, filter, route, selected thread, and permission changes invalidate relevant results. Dispose first, clear previous private rows/drafts/counts, then attach the new scope. Guard callbacks and async page results with the originating account/query revision so late results cannot restore old data.

Use includeMetadataChanges when cache/pending-write transitions affect visible state. Local snapshot delivery is not a server-confirmed save; distinguish fromCache and hasPendingWrites where the product promises confirmation. A listener error ends that subscription; expose an explicit retry/resubscribe action. Permission denial never becomes No Records or local fallback. Choose SDK persistence and transport settings for the installed platform; do not copy web popup/IndexedDB behavior into native or turn off TLS/rules to work around a connection failure. [Listener metadata and cleanup](https://firebase.google.com/docs/firestore/query-data/listen)

| Query | Required Scope/Ordering | Subscription Coverage |
| --- | --- | --- |
| Current account | Own mapped document | One account plus protected role/status authority |
| Admin users/records | Granted capability, supported server filters, stable descending number or timestamp plus ID | Current bounded page |
| Public announcements | Canonical active/published constraint and stable order | Latest public window |
| Own read state | Exact authenticated account | One preference record or bounded own records |
| Private intake | Explicit review capability, supported status/order and cursor | Current bounded page |
| Dashboard summaries | Exact authorized scope | Maintained summary documents |
| Public plans/articles | Active/published constraints and deterministic order | Current permitted list/detail |
| Chat | Participant constraint and eligible thread | Current conversations/recent messages; older pages fetched separately |

Choose and document actual limits in the destination. Use a small overview window and a bounded record page, not unbounded getDocs/onSnapshot calls. Stable cursors include a tie-breaker when the order field can repeat. Reset paging when server filters change; merge live and fetched pages by ID where they overlap. Handle insertions/deletions that shift a live window. Loaded-page search/filter/counts are labelled as such and keep Next/Previous available when no displayed rows match.

Maintain global dashboards through trusted idempotent summaries, including create/edit/status/delete deltas and explicit reconciliation. Count/sum/average server aggregation queries do not support realtime listeners or offline caching; label refreshed aggregates accurately, or subscribe to maintained summaries for live totals. Lifetime counter values and a page length are not the number of currently stored records. [Aggregation behavior](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)

## Firestore Rules And Indexes

Keep rules_version = '2' and a deny-by-default boundary. Define safe missing-auth/unknown-role handling, active account resolution, explicit capabilities, and separate get/list/create/update/delete predicates. Multiple matching allow rules are ORed; a broad wildcard grant can bypass a narrower denial. Server Admin SDK paths authorize themselves because client rules do not apply to them. [Rule structure](https://firebase.google.com/docs/firestore/security/rules-structure)

| Operation | Required Rule Invariant |
| --- | --- |
| Self account create | Verified UID, valid app identity/allocation/mapping, Subscriber default, allowed creation fields |
| Self profile update | Own active account; changed fields limited to editable profile/preferences; identity, role, status, entitlements and ownership unchanged |
| Role/status management | Deliberately granted trusted operation; actor/target constraints, protected Owner policy, audit trail |
| Public content read | Whole document safe for public access and matching publication/privacy state |
| Public intake create | Exact fields/types/lengths/default status; validated empty honeypot; actor bound to auth if supplied; atomic identity |
| Submission review | Explicit private review capability; only review fields/timestamps editable; original intake immutable |
| Read preferences | Own account only; valid eligible notification references/cursor and allowed fields |
| Counter/mapping write | Atomic coupling and immutable ownership; no arbitrary increment, relink, public promotion or deletion |
| Summary write | Trusted writer only; no browser-supplied totals or forged source/coverage |
| Other collections | Explicit feature policy; unmatched paths denied |

Rules validate document key equals stored id, positive integer number, ID-number agreement, required/allowed keys, field types, canonical statuses, timestamp semantics, and immutable relationships. Updates use changedKeys/affectedKeys allowlists appropriate to the chosen schema; deletes use resource rather than request.resource. Treat missing/legacy fields deliberately through a compatible migration, without temporarily opening all writes.

Firestore rules protect entire documents. Public projection must be a separately safe document, not a UI hide-field filter. Queries carry the same audience, participant, status, and bounded-limit constraints that rules require; rules do not remove forbidden rows. Maintain a query-to-index table for actual combinations, including collection-group scope where used. Surface the supplied missing-index error; index source existing in Git does not mean it is deployed or ready. [Secure queries](https://firebase.google.com/docs/firestore/security/rules-query)

Keep get/exists/getAfter helper access within the provider's rule limits and avoid repeating unrelated account lookups across each write. Verify the configured Firebase project/database, rules path, indexes path, Authentication providers/origins, environment selection, and trusted Owner bootstrap separately. Writing rules/index files does not activate them in a cloud project. Follow AGENTS.md for any checks or deployment.

## Read Cost, Cache, And Rollout

Attach feature/catalog listeners only while needed; share identical public queries and their validated snapshots. A short configurable release grace, such as 30 seconds, can avoid route/development remount reads. Cancel release when a consumer returns, ensure one active listener per key, and release immediately on identity or permission loss. Private listener/cache keys include environment, account and complete query/converter identity. A healthy Refresh reuses its listener; a failed listener deliberately reattaches. Do not reuse a reader/converter for another schema under the same cache key.

If a private logical snapshot spans metadata and record collections, compose only compatible validated revisions after the required sources are ready. onSnapshotsInSync coordinates local listener updates; it does not itself prove server freshness. Pending/cache metadata still governs confirmation. Do not briefly publish a half-updated snapshot after an atomic write.

Use pageSize + 1 lookahead for cursor lists, discarding the extra row from display. Typical configurable pages are 5 for media-heavy tables and 50 for dense tables; bounded overviews may use 50/100 and a deliberate larger feature window. Ascending record management and descending recent summaries are separate queries. Number gaps after deletion are valid; a maximum number is not a row total or an offset. Exact numbered page buttons require an explicit eligible-number index/aggregate strategy and its cost disclosure; do not subscribe to an entire collection merely for pagination.

Complete public catalogs remain complete through supported cursor/category/detail paths or deliberate current full-public snapshots. Do not silently truncate eligible offers or articles while leaving UI labelled All. If replacing full listeners for scale, provide genuine discovery/paging and source coverage. Avoid a revision document that triggers a complete download after every edit.

Skip unchanged profile, status, content and slug writes after canonical normalization. Maintain only actually queried single-field/composite/collection-group indexes, including both number directions when needed; disable large unused payload/map/URL indexing deliberately and preserve supported lookup/migration queries. A rules limit may need to permit pageSize + 1 and bounded account-deletion batches without widening audience permissions.

For an authorized rollout that tightens rules/indexes, create required indexes and wait for readiness, deploy clients with matching bounded queries, then activate compatible restrictive rules while preserving authorization throughout. Do not temporarily weaken access or ship queries that exceed the permitted deployed backend constraints. Do not deploy anything merely to update this portable pack. Choose memory cache for sensitive shared-device contexts unless persistent cache is deliberately supported and described; sign-out state cleanup remains necessary either way.

Optional Firebase App Check has separate registration, initialization, token transport, verification and enforcement steps. A configured site key or transmitted header is not verified enforcement, and App Check is not a per-person rate limiter. Use trusted intake validation/rate limits/idempotency for public abuse boundaries where required. Treat billing alerts as notifications, not a spend cap.

Exact sequential creation contends on one counter document and sequential indexes. A random suffix does not remove that contention. High-volume work needs an agreed trusted serialized allocator/backpressure or compatible numbering migration; do not promise exact uniqueness while substituting an approximate sharded count. Observe real workload before claiming cost savings.
