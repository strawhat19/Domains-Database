1. Apply this guidance when the user requests profiles, posts, followers, messaging, or social privacy. Implement the requested features within the existing app; do not add unrelated social features to every app.

2. Keep public pages, public profiles, and eligible feed content browseable without authentication unless the user explicitly requests a private app. When a visitor selects an action that requires identity, present sign-in and sign-up, then return to the intended internal destination. Do not gate the whole app merely because it has account features.

3. Give users ProfilePrivacy options of public or private, defaulting to private. Keep optional public sharing disabled until the user enables it. Public profile responses contain an explicit projection of safe display fields such as a name, handle, avatar URL, and bio. Visibility never makes email, password data, session tokens, API keys, connection credentials, or other private account fields public. The authenticated account settings view may read private fields through its own service operation. Whitelist editable fields and preserve roles, identity, and other server-managed fields during profile updates.

4. Keep typed social records in shared/models and operations in the shared service or API layer. Use Data, the shared ID helper, and the same useLocalStorage master flag; do not add separate social storage switches. Preserve auto-incrementing numbers, Type_Number_Name_Date_UUID IDs, stable author and recipient references, and plain Data.toRecord() records for local or device storage and a future Firestore adapter.

5. Enforce audiences in service reads for individual records, profile lists, feed queries, counts, and search. Public feeds expose only public profiles and posts to other viewers; owners may see their own private records. Followed feeds include only records the current viewer is allowed to read. Following someone does not bypass a private profile or post audience. Apply requested follower approval rules consistently, and refresh visible state when privacy or relationships change.

6. Store follows as explicit relationships between app-owned user IDs. Prevent duplicate and self-follow records, and derive follower and following counts from eligible relationships. Use pending and accepted states only when the requested private-account behavior requires approval; do not invent acceptance on the client.

7. Require a current authenticated session for creating, editing, deleting, following, and sending messages. Derive the actor from that session rather than accepting a caller-supplied author or sender ID. Enforce ownership and requested roles in the service, including direct calls; hidden buttons are only a view concern.

8. Messages and conversations stay private to their authorized participants. Read, send, and mark-read operations enforce membership, and profile visibility never publishes message content. Keep message previews and counts scoped to the current account and clear cached conversation state when the account changes.

9. Support the requested Markdown, rich-text, and code formatting for posts and messages with one shared content format and renderer. Render through an allowlisted parser or structured nodes, escape code and text, and sanitize links. Do not execute scripts or render arbitrary user-authored HTML.

10. Support images through public HTTPS image URLs only; do not add image uploads. Validate URLs at save and render boundaries, allow only the expected HTTPS protocol, and treat images as content rather than executable markup. Preserve useful alt text when supplied.

11. Account connection settings are logically part of the user's profile management but use separate private account-scoped records. Read, update, and remove them only for the current account. Keep credentials out of public User models, social projections, posts, messages, URLs, logs, and toasts; profile visibility cannot change their access. A future backend must store secrets privately and enforce the same separation.

12. Keep editors, feed records, profiles, and conversation views in their own component folders with shared logic and separate web/native rendering where needed. Use the existing theme, descriptive element identifiers, icons, loading skeletons, empty states, and concise Title Case feedback. Local social data is a device demo until a real backend is connected; describe its actual sharing and persistence behavior.

13. Apply [database guidance](../database/database.md) for records and persistence, [API guidance](../api/api.md) for operations, [authentication guidance](../authentication/authentication.md) for sessions and private account data, and [route guidance](../routes/routes.md) for public pages and account actions. Keep the implementation scoped and leave validation to the user unless requested.
