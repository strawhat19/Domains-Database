# Feedback Workflows

## Scope And Access

The Contact page keeps guest messages in the existing private `formSubmissions` collection. Active signed-in accounts can use Contact, Review, and Report A Bug. Contact starts or reuses the account's support conversation. Support is an explicit staff queue: its customer and current active Owners can read it and reply. This is not a general peer-message service, and an administrative role other than Owner does not grant inbox access.

Reviews and bug reports remain private feedback. Submitting a review does not publish it. A bug report needs a description or a publicly accessible HTTPS screenshot/video URL; supplied URLs are validated and stored as links, never fetched or embedded by the server.

## Screens

- `/contact`: signed-in Contact, Review and Report A Bug tabs; Contact opens the saved conversation and offers Continue Conversation on later visits. Guests retain the existing form.
- `/ai-chats` and `/messages`: the same human support inbox, retaining existing bookmarks. These routes do not introduce an AI chatbot.
- `/reviews` and `/bug-reports`: private Owner feedback review with New, Read and Archived actions.
- `/form-submissions`: existing guest form review.
- `/404` and unmatched routes: the shared StatePanel appearance used for unavailable and planned states.

## Records And Queries

| Path | Fields And Access |
| --- | --- |
| `supportThreads/{id}` | App-owned `SupportThread` ID/number, customer ID/name/email/optional phone, subject, open/closed status, created/updated, last-message number/time/text/sender; customer or active Owner reads |
| `supportThreads/{id}/messages/{messageId}` | App-owned `SupportMessage` ID with per-thread number, thread/sender references, sender kind/name, body and created time; same thread access |
| `supportThreads/{id}/readStates/{userId}` | Own private last-message read cursor; only that active account reads it; infrastructure ID exception |
| `feedbackEntries/{id}` | App-owned `Feedback` ID/number, review/bug kind, author identity, title/description/media URL/rating, new/read/archived status and timestamps; active Owner review, author own-record access |
| `supportThreadAccounts/{userId}` | Server-only account-to-thread reservation; infrastructure ID exception |
| `feedbackAttempts/{hash}` | Server-only retry reservation with a normalized payload fingerprint; infrastructure ID exception |
| `counters/supportThreads`, `counters/feedbackEntries` | Server-only monotonic allocation, without message bodies; infrastructure ID exceptions |

Firestore content writes go through the authenticated `/api/feedback` server boundary. The client can subscribe to its permitted records but cannot create/update/delete these records or allocation metadata directly. The server verifies the current Firebase identity, mapped app account and active status; privileged review actions additionally require Owner. Client-supplied author, recipient or role fields are not authority. Contact feature eligibility applies to customer intake; existing staff review remains available to authorized Owners.

Server authorization is enforced separately because [Firestore server SDKs bypass client Security Rules](https://firebase.google.com/docs/firestore/security/rules-query). Transactions read their authorization, allocation and retry records before writing, following [Firestore's transaction requirements](https://firebase.google.com/docs/firestore/manage-data/transactions).

| Read | Query And Coverage |
| --- | --- |
| Owner inbox | `supportThreads`, descending `lastMessageAt` then `number`, latest 40 active threads |
| Customer inbox | `customerId == actor.id`, descending `lastMessageAt` then `number`, latest 40 active threads |
| Current transcript | Thread's `messages`, descending `number`, latest 50; chronological presentation |
| Older transcript | Same query with a numeric cursor and 50-record page plus lookahead; merge by message ID |
| Reviews / Bugs | `feedbackEntries`, `kind == review/bug`, descending `number`, latest 50 records |
| Own read cursor | Exact thread `readStates/{actor.id}` document |

New records allocate their number and app-owned ID atomically. Stable attempt IDs deduplicate retries. Messages increment their thread's sequence and activity metadata together. Counters never act as public feedback summaries. Failed saves keep the draft; successful UI feedback waits for the committed response. Session/thread changes clear private state and discard stale async results.

## Configuration And Release

This uses the existing Firebase project `domainsdatabase-e62a3`, `(default)` database, and existing server `FIREBASE_SERVICE_ACCOUNT_JSON` configuration. No new credential is created or copied. The database metadata read on 2026-10-27 identified Standard edition in `us-east1`; this does not establish that the new endpoints or rules are deployed.

Native requests use the existing configured website origin for `/api/feedback`; that origin must serve the released API. Missing server credentials or an unreleased native transport target remains an explicit unavailable state. Reopening a conversation from Contact reads the account's existing thread without posting another message.

The rules/index changes in this workspace are prototypes for review. Deploy the application API, Firestore rules and indexes through the project's normal authorized release process. Until those are released, the new workflow may report missing server configuration, permission errors or missing indexes. Local-only mode must identify itself or report the connected feedback service as unavailable; it must not report a cloud conversation as saved.

No test suite, build, UI check, feedback submission or rules deployment was run for this change. Source completion and live cloud verification are separate.
