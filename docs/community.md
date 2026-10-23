# Community And Discover

## Source Behavior

`/community` and `/discover` require an active signed-in account with a trusted Starter-or-higher plan, or an active Owner. Guests and accounts below Starter see a sign-in/plan CTA; Community is hidden from their header, and feed/discovery subscriptions and feature actions do not start. Other roles do not bypass the plan requirement. Comments also require a published public profile. Posts retain Public, Followers and Only Me audiences; Owner access and following never bypass profile privacy or ownership.

Profile settings start Private with domain sharing off. An explicit Save publishes an allowlisted profile. Public accounts can use **Refresh Public Profile** without editing their preferences to publish an existing profile or refresh legacy portfolio projections. Initial domain publication finishes before sharing is enabled. Subsequent portfolio changes mirror safe domain fields atomically; no automatic sample activity is added.

Discover supports domain/project/builder search, TLD and project-stage filters, sorting and progressive display of the loaded results. Builder links filter Community by the app-owned user ID. The feed offers Discover, Following and Your Posts, search, newest/most-liked ordering, editing/deletion, unique likes and expandable discussions. Self-likes are disallowed. Posts and comments render through the existing safe rich-text components.

## Persistence And Audiences

| Path | Purpose And Access |
| --- | --- |
| `users/{userId}` | Existing private account; public visibility does not grant reads to the complete account |
| `publicProfiles/{userId}` | Only ID, name, bio, color, HTTPS avatar, visibility and sharing choice; private projections are owner-readable |
| `publicProfiles/{userId}/domains/{domainId}` | Only shared name/project/registrar/date fields; reads require an active public source account with sharing enabled |
| `communityPosts/{postId}` | Post text, immutable author/identity/timestamps, audience and verified engagement counters |
| `users/{userId}/socialFollowing/{targetId}` | Private unique-follow lookup for the current account |
| `communityFollows/{followId}` | Numbered follow record, atomically paired with its private lookup |
| `communityPosts/{postId}/likeActors/{userId}` | Private unique-like lookup; no public list of private liker identities |
| `communityPosts/{postId}/likes/{likeId}` | Numbered like record, paired with its lookup and a verified counter increment/decrement |
| `communityPosts/{postId}/comments/{commentId}` | Public-author comments plus the viewer's own eligible comments, constrained by parent-post audience |
| `counters/communityPosts`, `communityFollows`, `communityLikes`, `communityComments` | Atomic number allocation paired with actual record creation |

App-owned post/follow/like/comment IDs retain matching monotonic numbers and the shared `Type_Number_Name_Date_UUID` identity format. Profile IDs remain the existing app-owned user IDs. Author/actor identity comes from the current session and authoritative ownership rules.

The service boundary and Firestore social reads/writes apply the Starter/Owner requirement. Rank comparisons use canonical public-safe `planSlugs` entries ordered by `displayOrder`, then `number`; the existing bidirectional atomic rules keep those entries synchronized with catalog records. Missing/unknown tiers fail closed, and no catalog selection grants entitlement. Public profile/domain projections retain their existing safe public audiences for other portfolio/profile consumers. Owned post/follow deletion remains available for cleanup.

To stay within Firestore's dependent-document budget, engagement parent updates retain active-account/audience checks while their required atomically created/deleted like/comment enforces the Starter/Owner threshold. Every delta must still couple to its exact child and unique mapping; a standalone parent counter update cannot pass. Child creation relies on that required parent update for post readability rather than repeating its author/follower lookups. These rule paths remain source-reviewed and unverified against an emulator.

Profile visibility/activation changes synchronize the public projection in the same transaction. Source-domain writes and deletes synchronize their projections in chunks of eight to respect Firestore rule document-access limits. Public projection fields exclude email, credentials, connection data, registrant/contact information, private notes, prices and arbitrary metadata. Public engagement metadata contains the action kind and opaque action record ID, without the private actor ID.

The existing configured database was identified by a read-only CLI lookup as `domainsdatabase-e62a3/(default)`, Standard edition, Firestore Native. No database or other cloud resource was created.

## Contribution Levels

Progress is computed from eligible records currently loaded: 20 XP per distinct public post, 10 XP per distinct shared domain, and 2 XP per received like. Levels run from Newcomer through Community Legend, with first-post, sharing and contribution badges. The community board ranks contributors in that same loaded activity window with a stable ID tie-breaker.

XP is a display calculation rather than a writable account field, lifetime score, paid entitlement or role grant. It can decrease when activity leaves the window, is deleted or becomes private. This scope is displayed in the interface; no global or lifetime leaderboard is claimed.

## Query Coverage

- Directory: up to 24 published public profiles in stable document-ID order.
- Following: up to 200 current-account relationships, with independent public-profile listeners for the newest 24 targets; followed builders are not limited to the directory's first page.
- A selected builder can load independently of the directory window.
- Posts: up to eight per author/source and 40 eligible feed posts, with progressive display of 12 at a time. Progress uses the loaded public-post sample, including independently followed/selected builders and the current public account, consistently across feed tabs.
- Shared domains: up to 100 per eligible profile. Explicit legacy publication backfills up to 100; newer portfolio changes maintain their projections through the normal writer.
- Comments: up to ten eligible comments per queried public author plus the current account, and 50 displayed replies. Directory, per-author and total limits are reported as a bounded preview. Reply counts in the interface use loaded eligible comments rather than the aggregate that may include now-private authors.

Realtime listeners use confirmed server snapshots, clean up on scope/account changes, and clear denied data. Refresh retries a failed subscription. Missing rules, indexes, permission failures and connection failures surface errors; connected failures do not fall back to device data.

## Existing Local Mode And Retention

The existing `useLocalStorage` configuration remains the single adapter switch. Local mode stays a clearly labelled device preview and supports compatible optional likes/comments in its version-one social store. It does not publish to Firebase or migrate device content automatically.

Connected **Delete Data** retains community history and follow/like records, as explicitly stated in its confirmation. The profile becomes Private and sharing turns off; republishing may reveal retained contributions again. Individual post/comment deletion remains available to eligible accounts in Community. Deleting a post removes the parent record and makes its nested reactions/comments unreadable; it does not recursively erase Firestore subcollections. Recursive cleanup and broader account-history erasure need a separately scoped trusted backend workflow.

## External Setup And Validation

The social/profile/domain rules and composite indexes are included in `firestore.rules` and `firestore.indexes.json`. They have **not** been deployed. Review the changes before deploying the application and matching rules/indexes together; the source-domain writer and profile transactions depend on those rules. Existing public users should deliberately refresh their public profile after rollout. Private users remain private.

No tests, type checks, builds, emulator runs or UI checks were performed, following the workspace instruction. Source implementation and the read-only database-edition lookup do not establish deployed social connectivity. The new rules are a prototype for review before publication.
