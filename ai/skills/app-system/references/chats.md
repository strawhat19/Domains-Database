# Private Realtime Chat

Read this for a requested real chat feature or the full App System. Follow social privacy, database, authentication, and route guidance. Match the shared account shell and destination theme, but implement services rather than copying an unconfigured reference screen.

## Participants And Records

Require an active authenticated app account to start a conversation, send, read, or mark messages read. Use stable app-owned User IDs for participants; derive the actor through the Firebase session/account mapping. A direct conversation has two distinct eligible participants unless the app explicitly supports another model. Validate the intended recipient using only permitted safe identity projections. Do not expose private account email/roles or arbitrary user records merely to populate a picker.

Conversations and messages are typed app-owned records with stable ID/number and timestamps. A useful conversation contains participantIds, creator, and server-confirmed last-activity metadata; messages contain the conversation reference, sender, allowed text/content, and created time. Messages may be a subcollection or a constrained flat collection. Define whether message numbers are per conversation or global and allocate accordingly. Do not put message bodies, recipient email, or participant names into publicly readable counter metadata.

Choose an explicit participant membership policy and enforce it in services and rules. Default direct-thread membership is immutable after creation. Each message must belong to that thread and its sender must be the authenticated participant; ordinary sends cannot alter participants, another sender's content, roles, identity, or server-managed fields. If edit/delete is offered, enforce its actual authorship/moderation policy and preserve record/counter invariants. Membership changes or transcript moderation require a separately defined capability and visible product policy.

Private chat access is independent of dashboard roles. An Admin/Owner chat route can show threads in which that account is a participant; a role label alone does not grant every transcript. Support conversations may explicitly include an authorized staff participant. Public profiles, notifications, public counts, and catalog publication never publish conversation content. Authorize any server/Admin SDK path independently because it bypasses client rules.

## Realtime Queries And Paging

Query only the current participant's conversations and the selected eligible thread's messages, with bounded limits, stable ordering/cursors, and declared indexes. The conversation query includes the participant constraint; message rules check its parent conversation. Firestore query constraints must match access rules, which do not filter forbidden results afterward. See [Firestore secure queries](https://firebase.google.com/docs/firestore/security/rules-query).

Use onSnapshot for the visible conversation page, current thread/membership, recent message window, and own read state. Load older pages through cursors; merge by stable message ID to prevent duplicate rows when live/new and older windows overlap. Keep chronological display separate from the query's newest-first ordering. Describe loaded-page/window search honestly. Do not keep every transcript subscribed. See [realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen) and [cursor paging](https://firebase.google.com/docs/firestore/query-data/query-cursors).

Dispose subscriptions on thread/account changes, lost membership, unmount, or deactivation, and guard async results with the originating account/thread. Clear another account's messages and composer state before hydrating the next account. Show Loading, No Conversations, No Messages Yet, No Search Matches, Access Denied, Connection Needed, and Read Failed distinctly; a permission failure is not an empty conversation.

## Send, Unread, And Read Receipts

Validate supported length/content in both UI and persistence boundary. Use the existing safe text/Markdown renderer; do not execute arbitrary HTML or add uploads outside scope. Send persists the message and permitted thread activity metadata through an authorized atomic operation. Reuse a stable send-attempt ID for retry/deduplication where needed. Show pending/failed sends accurately, disable conflicting send actions, and clear the draft or claim Sent only after confirmed persistence. See [Firestore atomic writes](https://firebase.google.com/docs/firestore/manage-data/transactions).

Store per-participant read state separately from message ownership/global publication. An own read record/cursor references an eligible confirmed message in that thread, changes only for the authenticated participant, and cannot move backward accidentally. Derive read receipts from persisted counterpart read state; opening a view or appending an optimistic message is not proof that another person read it. Apply any receipt/privacy preference supported by the app.

Unread counts represent unseen incoming messages, excluding the viewer's own sends. Use a trustworthy maintained per-account/thread aggregate or an authorized bounded calculation with its coverage disclosed. Subtracting a global counter from a read number is not an exact count when records are deleted, skipped, or sent by the viewer. Do not display an unavailable/hydrating count as a confirmed zero. Mark Read/All Read waits for the relevant read state and saves only eligible cursors; readiness is separate from mutation busy so reload can recover from read errors.

Provide own-thread search/list, start/select conversation, message history and Load Older, composer, send retry, refresh, unread badges, and actual saved read indicators. Preserve the viewport when loading older messages; scroll to new content when the viewer is already near the bottom, otherwise offer a new-message indicator. Label fields and icon actions, support keyboard/touch operation and reduced motion, and use descriptive thread/message IDs. Keep typing/online/delivery labels absent unless their actual presence/transport source is implemented; realtime Firestore updates alone do not establish presence.

