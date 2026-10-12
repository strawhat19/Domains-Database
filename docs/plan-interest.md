# Plan Votes And Interest

When Pricing Table is unavailable to the current viewer, published pricing cards offer an upvote or downvote without signup and an explicit signed-in interest action. Catalog publication and feedback never grant account entitlements.

## Persistence And Access

The facade is `src/api/planInterest.ts`. It saves directly in the configured Firestore database using the existing Firebase client. No additional server credentials, visitor secret, or pricing API origin are required. Connected failures do not fall back to device storage; the existing explicit local demo labels its own saved results.

Guest voting uses a named secondary Firebase app with persisted Anonymous Authentication. The first vote creates its guest identity; browsing pricing does not. It is isolated from the app's normal sign-in state and does not create an application User or display a signup flow. Signed-in feedback uses the existing verified, active application account.

| Collection | Content | Access |
| --- | --- | --- |
| `planInterestRecords` | App-owned `PlanInterest_Number_Plan_Date_UUID` identity, matching number, plan reference, actor identity, optional verified User reference, vote and independent interest state | Actor's own record or Owner review; validated atomic writes |
| `planInterestLookup` | Stable plan/actor lookup to the app-owned record and number | Actor's own lookup |
| `planInterestSummary` | Saved plan name, up/down/interested totals and confirmed response timestamp | Owner realtime reads; writes coupled to the actor record |
| `counters/planInterest` | Last allocated record number and identity | Validated atomic allocation |

Lookup, summary, and counter keys are infrastructure identities; application feedback records retain the app-owned ID format. Guest records contain no email or IP. Owner summaries show aggregate counts and private authenticated records retain their verified User reference.

One Firebase actor has one active vote per plan. Repeating a desired vote or interest state does not add another response. Changing direction or clearing it adjusts the saved totals atomically. Rules validate the published plan, active account when applicable, Pricing Table audience, identity allocation, and the exact before/after response deltas.

Guest and account identities remain separate in connected mode. Signing in preserves the guest response and loads the account's own feedback; it does not transfer a vote between identities. Guest votes are device scoped, and clearing storage or using another device can create another guest identity. Counts represent saved responses, not proof of unique people. The explicit local demo retains its existing guest-to-account merge behavior.

## Connected Setup

Use the same `EXPO_PUBLIC_FIREBASE_*` configuration as the rest of this app. Guest votes require Anonymous Authentication enabled in that Firebase project. Both guest and account feedback require the reviewed voting rules to be published.

Anonymous Authentication and focused voting permissions were published to the existing `domainsdatabase-e62a3` project on October 12, 2026. Authenticated management readback confirmed both at `2026-10-12T20:29:35.737Z`. The existing published-plan composite index (`active`, `displayOrder`, `number`, ascending) is READY.

The exact published source is [the deployment snapshot](deployments/firestore-plan-interest-2026-10-12.rules). It preserves unrelated live rules, permits public published-plan/plan-tier/feature-setting reads, and adds actor-bound voting with Owner-only aggregate reads. The legacy Owner wildcard explicitly excludes every voting collection and its allocation counter, so it cannot bypass the new response constraints. Other existing Owner permissions, including unrelated counter descendants, remain intact.

Published ruleset: `projects/domainsdatabase-e62a3/rulesets/d0ed42ee-ff70-4b75-a1ee-bf1ad891a73c`. Previous ruleset retained for recovery: `projects/domainsdatabase-e62a3/rulesets/26f1c7bb-82dd-4069-851b-c7395fa03001`. Normalized source SHA-256: `f128b1bd8daa77b7d7689e32ec0e92d3674609858e9408f231244d2e58951de6`.

The repository's full `firestore.rules` includes other existing admin modules that were not published as part of this focused update. Firebase compiled the deployed vote rules; source reviews covered actor identity, allocation, summary changes, and document-access budgets. No sample votes, UI checks, or app build were performed.

The implementation follows Firebase's [anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth), [authentication persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), and [atomic transactions and rule validation](https://firebase.google.com/docs/firestore/manage-data/transactions).
