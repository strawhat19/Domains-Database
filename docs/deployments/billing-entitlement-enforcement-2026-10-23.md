# Billing Entitlement Enforcement

Source implementation notes; rules, endpoints, provider configuration, and real payment behavior require separate deployment and verification.

## Authority And Capabilities

- Firebase Standard `(default)` database in `domainsdatabase-e62a3` remains the configured persistence target.
- `billingUsers/{appUserId}` is a private, own-readable, server-write-only mirror. Paid access requires `plan=starter`, subscription status `active` or `trialing`, and a Firestore `accessUntil` timestamp later than the current time. Missing mirrors grant the Free baseline. Legacy/manual `users.plan` never grants paid features.
- Active trusted Owners bypass plan and feature-audience restrictions. Other roles do not receive unlimited access by role name.
- Free includes 33 domains, portfolio organization/import/export, basic search/name ideas, and GoDaddy/Hostinger connections. Starter includes 333 domains, other published current registrar connections, costs, research/insights, hosted-domain discovery, price comparison, and Community.
- Auctions remain Planned and their working preview is Owner-only. Purchasing Starter does not activate Auctions.
- Effective ad eligibility is false for Starter and Owner. No ad network or ad placements are connected; this change does not create advertising.

## Portfolio Write Boundary

`POST /api/portfolio/commit` authenticates the current Firebase identity through the billing Admin SDK helper. Each transaction rereads the identity mapping, active account, billing mirror, portfolio snapshot, and private usage state. A missing `portfolioUsage/{appUserId}` bootstraps from up to 10,001 authoritative domain documents, failing closed beyond the 10,000-record supported write window. Subsequent transactions use server-owned usage count/revision plus a SHA-256 membership digest, and read changed records and duplicate-name queries before writing.

The transaction validates app-owned IDs/numbers, account ownership, immutable existing identity fields, request/record sizes, final membership, and the 33/333 cap before growth. Domain records, their existing allowlisted public projections, the snapshot revision, and usage state commit together. All client domain creation, CSV imports, registrar imports, edits, and data-reset deletion chunks use this endpoint. Direct private domain writes and direct portfolio-snapshot writes are denied by rules. Owner has no plan quota but retains the existing technical write-window bound.

Existing over-limit portfolios remain readable and exportable. Updates/deletions remain permitted; additions require the final count to fit the current plan. No legacy records are deleted or silently truncated. The shared final `nextNumber` across import chunks remains supported; the server does not replace it with `count + 1`.

## Other Boundaries

- Paid registrar saves are checked by the shared service and Firestore rules. Registrar HTTP relays verify current identity/entitlement. Free Hostinger sync excludes hosted-domain discovery.
- Free search retains a single basic provider; prices are omitted by the server. Paid search can compare configured providers and prices. Native HTTP callers use the configured HTTPS site URL and Firebase bearer tokens.
- Domain research, market lookups, and website insights require paid or Owner access before provider calls. Shared services check before cached lookups or saves. Public portfolio projections retain their existing safe field allowlist.
- Cost/insight columns and effective `showCosts` derive from the shared entitlement context, independent of client-writable saved preferences. Raw inventory data remains available for the promised CSV export.
- Server environment credential import is Owner-only. Public signup cannot retrieve project registrar tokens.
- Billing mirrors and usage documents cannot be written by clients. User creation rejects reserved billing fields, while existing plan/role update protection remains. User/identity deletion is still denied; data-reset actions do not delete billing identity records.

## Rollout And Validation

The server needs the same server-only Firebase service-account configuration as billing. The single-field ascending collection index on `domains.name` is live and READY for duplicate-name queries, as recorded below; the existing wildcard index exemption otherwise disables it. Deploy compatible server/client code and restrictive rules as one coordinated cutover before exposing signup/payment; old clients cannot save domains after the restrictive rules activate. Do not reopen direct domain writes as a fallback when server credentials are absent. Failed provider or billing reads remain errors, rather than permission grants.

Any trusted maintenance outside this endpoint that changes portfolio membership must also reconcile `portfolioUsage` and snapshot state. Their mismatch fails closed with a reconciliation message.

Initial implementation received source review. Later authorized focused rules checks and the separate live index setup are recorded below. No browser checks, rule deployment, payment, or webhook verification are claimed here; production build evidence is tracked separately.

## Focused Rules Checks

The Firebase rules compiler returned no errors or warnings after removing only the unused `starterPlanAllows` and `syncedPublicDomain` helpers. The dependency-free `tests/rules/billing-permissions.cjs` then submitted the exact local rules source to Firebase Rules `projects:test` with synthetic identities, accounts, billing mirrors, and explicit mocked `get`, `exists`, `getAfter`, and `existsAfter` functions. No rules deployment or production document write occurred.

All 112 permission cases passed: 32 expected allows and 80 expected denials, with no compiler issues, evaluation error positions, or debug errors. Coverage includes own-only billing mirror reads; client mirror writes/lists; private billing accounts/customer mappings/events/usage; direct private domain and portfolio-snapshot writes including Owner; cross-account private data; Free versus paid registrar providers; active/trialing, expired, exact expiry, canceled, past-due, unpaid, free-mirror, and stale legacy-plan states; active Owner versus inactive Owner, Administrator, Developer, and forged token claims; Owner-only planned auction previews; disabled notification/audience override for active Owner; and downgrade reads/deletes.

The tested rules SHA-256 is `36826438700b82de68f605ecdc846beca12a6704ae10f4a45de5a03fb4ec9bdb`. Credential-free results are saved at `C:/Users/massa/.codex/visualizations/2026/10/23/01a1695f-f091-7232-9bf0-e4a6b998df82/billing-rules-results.json`. These are rule decision tests with isolated fixtures, rather than runtime tests of the portfolio endpoint or Stripe flows. Java 8 is installed without a cached Firestore emulator; the Rules API avoided runtime/dependency installation.

## Live Index Preparation

On 2026-10-23, a precise Firestore Admin `PATCH` of `projects/domainsdatabase-e62a3/databases/(default)/collectionGroups/domains/fields/name?updateMask=indexConfig` added only `ASCENDING` / `COLLECTION` indexing for the `name` field. Before the change, `name` inherited the empty `domains/*` indexing configuration. No rules, full index file, or application deployment occurred.

Operation `projects/domainsdatabase-e62a3/databases/(default)/operations/AyA2MzMzYTBjNGU1ZTItZTY1OC0yNWQ0LTBhN2YtYzk5NGJkNTQkGnNlbmlsZXBpcAkKMxI` finished with `done=true`, state `SUCCESSFUL`, and 226/226 documents completed at `2026-10-23T16:31:12.014883Z`. Independent field readback at `2026-10-23T16:31:16.107Z` confirmed `domains.name` / `ASCENDING` / `COLLECTION` / `READY`. Exact before/after comparison confirmed both existing field overrides remained unchanged: the `domains/*` exemption and `domains.number` / `DESCENDING` / `COLLECTION_GROUP` / `READY`.

Credential-free JSON evidence is saved outside the repository in `C:/Users/massa/.codex/visualizations/2026/10/23/01a1695f-f091-7232-9bf0-e4a6b998df82/`: `firestore-domains-name-index-before.json`, `firestore-domains-name-index-payload.json`, `firestore-domains-name-index-operation.json`, and `firestore-domains-name-index-after.json`. The final file contains the successful operation and preserved-index readback.
