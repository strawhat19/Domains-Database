# Feedback Workflows

## Scope And Access

The Contact page offers Contact, Review, and Bug tabs to both guests and active signed-in accounts. Guests supply a required name and email plus an optional phone number. Guest Contact keeps messages in the existing private `formSubmissions` collection; guest reviews and bugs enter `feedbackEntries` with an empty account ID, a Guest identity label, and the supplied contact details. Signed-in Contact starts or reuses the account's support conversation. Support is an explicit staff queue: its customer and current active Owners can read it and reply. An administrative role other than Owner does not grant inbox access.

Reviews and bug reports remain private feedback. Submitting a review does not publish it. A bug report needs a description or a publicly accessible HTTPS screenshot/video URL; supplied URLs are validated and stored as links, never fetched or embedded by the server.

## Screens

- `/contact`: shared Contact, Review and Bug tabs on web and native; signed-in Contact offers Continue Conversation on later visits, while guest Contact saves a form submission.
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
| `feedbackEntries/{id}` | App-owned `Feedback` ID/number, review/bug kind, author identity and optional `authorPhone`, title/description/media URL/rating, new/read/archived status and timestamps; active Owner review, signed-in author own-record access |
| `supportThreadAccounts/{userId}` | Server-only account-to-thread reservation; infrastructure ID exception |
| `feedbackAttempts/{hash}` | Server-only retry reservation with a normalized payload fingerprint; infrastructure ID exception |
| `feedbackGuestLimits/{key}` | Server-only source/email/global counters and reset times; infrastructure ID exception |
| `counters/supportThreads`, `counters/feedbackEntries` | Server-only monotonic allocation, without message bodies; infrastructure ID exceptions |

Feedback and support writes go through `/api/feedback`. Requests without Authorization may only submit a guest review or bug. Any supplied Authorization header must authenticate successfully; invalid authentication never falls back to guest intake. Conversations, messages, read state and review mutations retain their existing account/Owner checks. The client cannot create/update/delete these records or allocation metadata directly. Client-supplied author, recipient or role fields are not authority. Contact feature eligibility applies to customer intake, including the Guest/free audience; existing staff review remains available to authorized Owners.

Guest review/bug intake validates identity, field lengths, rating, description/media requirements and the website honeypot before saving. Guest responses and payload-bound retries expose only `{ id, number, kind }`, without reading back private content or review status. New entries, counter allocation, retry receipts and rate counters commit atomically. Caps are 5 new entries per source per 15 minutes, 5 per email per hour, and 100 globally per hour. Source addresses are accepted from `x-vercel-forwarded-for` only when `VERCEL=1`; other hosts ignore forwarded address headers and share one conservative source bucket, so unrelated guests can hit that shared cap. Rate metadata contains hashes/counters/reset times rather than raw addresses or message content. Existing Firestore rules need no guest read or write grant; the new rate collection remains denied to clients.

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

The initial rules/index additions were prepared for review. On 2026-10-27, the deployed rules were found to lack all feedback/support matches, explaining the permission errors. The existing rules were published with `firebase deploy --only firestore:rules --project domainsdatabase-e62a3 --non-interactive`; Firebase compiled them successfully, and live rules readback exactly matched the repository. The comparison with the previous release contained only the feedback/support helpers and collection matches; existing collection permissions were unchanged.

The three feedback/support composite indexes were created separately and confirmed `READY`: `feedbackEntries` kind/number (`CICAgNja0ogK`), `supportThreads` lastMessageAt/number (`CICAgOi36pgK`), and `supportThreads` customerId/lastMessageAt/number (`CICAgLjRnZMK`). Existing indexes and single-field settings were preserved; the repository's other index declarations and exemptions were not deployed as part of this fix.

This release covered Firestore rules and those three composite indexes. Application/API deployment remains separate. Local-only mode must identify itself or report the connected feedback service as unavailable; it must not report a cloud conversation as saved. No app test suite, build, UI check or feedback submission was run. Compilation, live rules readback and index readiness do not establish an authenticated end-to-end workflow result.

The subsequent guest-tab change was checked on 2026-10-27 with isolated temporary harnesses: 31 HTTP/server validation and transaction cases, plus 14 hook/submission-routing and static web/native renderer cases. A scoped TypeScript check of 14 edited source files with the project's ambient declarations reported zero errors and warnings. These used mocked authentication/database dependencies and native rendering adapters, with no live submissions, browser/device run, emulator or application deployment. They cover guest fields/tabs, unchanged signed-in routes, failed-save retries, session changes, receipt privacy, feature eligibility, input rejection, rate caps and transaction rollback; they do not establish hosted API availability or real Firestore transaction concurrency.
