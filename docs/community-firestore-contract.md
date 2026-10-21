# Community Firestore Contract

Source implementation targets the existing default Standard edition Firestore Native database. The existing Firebase client and shared local-mode switch remain authoritative. No resources were created, rules/indexes deployed, tests run, builds run or browser checks performed during this change.

## Data and authorization

- `publicProfiles/{userId}` contains only `id`, `name`, `description`, `color`, `photoURL`, `publicDomains` and `profilePrivacy`. A private or inactive source account publishes a private projection. Changes to public profile fields and account active status require an atomic projection update. Public profile listing trusts this invariant; direct content reads also check the authoritative private account's current active/privacy state.
- `publicProfiles/{userId}/domains/{domainId}` contains only the public domain summary fields. These projections are readable only when the authoritative account is active, public and explicitly sharing domains. Every client domain write/delete mirrors the safe projection in the same transaction. Samples are excluded. Profile Save backfills the first supported publication window; historical records require that explicit publication step.
- `communityPosts/{postId}` stores an app-owned Post identity, author, body, audience, timestamps and exact reaction/reply totals. Public authors' public posts are browseable without sign-in. Followers-only posts require the requesting account's explicit follow mapping. Owners can read their own private posts. Posting does not automatically make a profile public.
- `communityFollows/{followId}` stores private explicit relationships. `users/{userId}/socialFollowing/{targetId}` is the unique lookup. Both are created/deleted atomically. The target must currently have a public active profile; self-follows and duplicate pair creation are denied.
- Each post's `likes/{likeId}` and `likeActors/{actorId}` are private to their actor. One lookup per actor prevents duplicates. Self-like additions are denied. Anonymous aggregate totals are visible on readable posts.
- Each post's `comments/{commentId}` contains an app-owned identity, body, author and timestamps. A currently public active profile is required to publish a comment. Readers need access to the parent post and a currently public comment author, or ownership of the comment. Reply totals can include comments whose author subsequently made their profile private; the discussion displays only eligible public comments and the viewer's own comments.
- Public post engagement metadata contains only `kind` and `recordId`. It does not expose a private reaction actor or maintain writable XP.
- `counters/communityPosts`, `communityFollows`, `communityLikes` and `communityComments` allocate monotonically increasing matching ID numbers in transactions. Counter updates are coupled to their exact new records. Stable lookup mappings are also coupled to the corresponding records.
- Rule-verified reaction/reply deltas require the actual unique like/comment creation or deletion in the same atomic write. Other post fields remain immutable during engagement updates. No client-writable XP, badge, entitlement or global leaderboard aggregate is introduced.

## Bounded queries and realtime

The live directory loads up to 24 public profiles. The newest 24 followed targets are resolved independently of that directory, so followed profiles remain usable outside its first window. A specifically requested profile is resolved separately. The private follow lookup window is 200 records.

Each eligible author query loads at most 8 posts, with a separate public sample for progress and an own/followed source when necessary. The displayed feed is at most 40 posts. Progress remains derived from loaded public activity, including public directory, followed, selected and own profiles consistently in every feed view; it is not a lifetime/global ranking. These bounds are disclosed in the snapshot coverage string. There is no global exhaustive feed, historic post paging or global ranking service in this implementation.

Per-post discussion loading queries up to 11 comments from each eligible author, retaining 10 per author and at most 50 total visible comments. The post's author and current viewer are included separately. `hasMore` reports potentially truncated profile/comment coverage; the first directory window is not an exhaustive commenter directory.

Subscriptions observe server-confirmed snapshots, skip cached/pending writes, reset per-author sources when profile/privacy/follow scope changes, and detach on disposal. Public domain projection changes trigger a fresh confirmed composition. Permission/index/quota/offline errors surface explicitly. An author becoming private triggers a directory recheck and source rebuild. Some concurrent post deletion/reaction listener races may surface a safe retryable feed error; Refresh reattaches the scope.

`firestore.indexes.json` includes the profile privacy, author/audience/post number, private following number and per-author comment-number query combinations. Large unused social body/maps are not indexed. An index declaration in Git does not imply the cloud index is ready.

## Deployment and retention

Review and deploy matching clients, indexes and rules together through an authorized rollout. Old clients that write source domains without the safe mirror, or change profile privacy without synchronizing the projection, are intentionally denied by the new rules. Paired source/projection transactions use small chunks to stay within rule document-access limits.

Deleting a post removes its readable parent. Nested likes/comments remain inaccessible in Firestore until a trusted recursive cleanup job removes them. Account data reset privatizes the public profile but does not recursively delete cloud community posts/follows/reactions/comments; those records are retained with private author content hidden and anonymous received-like totals retained. Device-local reset removes authored posts, follows, likes and comments, plus engagement on removed posts, preserving allocation high-water marks.

The rules are a prototype for source review. They use safe public projections, current authoritative privacy checks, active session ownership, bounded queries and atomic identity/engagement coupling. They have not been deployed or validated against an emulator in this task.
