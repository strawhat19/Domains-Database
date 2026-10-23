# Live Billing Setup — October 23, 2026

## Configured Resources

Stripe account: `acct_1URo3231gDNPwfDr` (Domains-Database / Piratechs). The restricted live key was saved only in the ignored project `.env`. Its unused predecessor was rotated after the initial Copy And Close dialog did not preserve the token.

| Offer | Product | Monthly USD Price | Price ID |
| --- | --- | --- | --- |
| Free | `prod_VUkgMFkZyEYesG` | $0.00 | `price_1UTlB231gDNPwfDrWKI52Sqz` |
| Starter | `prod_VUkgJYnbxGv70v` | $1.33 | `price_1UTlB331gDNPwfDrZhA7MJVE` |

Both products copy their published Firestore plan features. Free signup uses the app baseline without a Stripe customer or subscription. Starter is the only paid Checkout offer. Auctions retain their Planned label.

The dedicated Customer Portal configuration is `bpc_1UTlB331gDNPwfDrzdmaatlu`. It enables invoices, payment-method updates, customer contact updates, and cancellation at period end. Plan switching is disabled.

Webhook `we_1UTlB431gDNPwfDrIxOlHNPh` targets `https://domaindatabases.com/api/billing/webhook`, is enabled, and uses API version `2026-09-30.endive`. Its fourteen events cover Checkout completion/expiry, subscription lifecycle, invoice payment, void, failure, action-required, and uncollectible status. The signing secret is saved only in `.env`.

Stripe Tax returned `pending` with zero active registrations. Setup did not enable automatic tax or assign an invented product tax code. Review registration and collection requirements before accepting payments. This setup does not establish tax registration.

The restricted key cannot read the account's `charges_enabled` or `payouts_enabled` fields. A separate read-only Stripe Dashboard observation at approximately 17:09 UTC reported "No active tasks to complete" and showed Payments and Payouts as Active. The listed paused optional payment methods were Cartes Bancaires and Scalapay. No settings were changed, and no customer or charge was created. This dashboard status does not establish tax registration or prove a successful payment or payout.

## Firebase Server Identity

`domains-database-billing@domainsdatabase-e62a3.iam.gserviceaccount.com` belongs to the existing Firebase project `domainsdatabase-e62a3`. Its project roles are `roles/datastore.user` and `roles/firebaseauth.viewer`. One JSON credential was saved in `.env` as `FIREBASE_SERVICE_ACCOUNT_JSON`; authenticated Admin SDK access to the published Starter plan was confirmed.

The reviewed source uses this server identity for billing and the portfolio quota transaction boundary. No new Firebase project or database was created.

The Starter catalog description was updated in Firestore to match the reviewed local catalog: "A simple start for your growing portfolio. Up to 333 domains for $1.33 per month." The active flag, features, amount, currency, interval, and other tiers were preserved.

The new `domains.name` ascending collection index returned `READY` at 16:30:10 UTC. The existing wildcard exemption and descending number collection-group override were preserved. Matching Firestore rules were subsequently deployed as recorded below; no full index-file deployment occurred.

## Production Release And Remaining Checks

Vercel Production variable names were read back after the user copied the values: all five Stripe variables, `FIREBASE_SERVICE_ACCOUNT_JSON`, and `EXPO_PUBLIC_SITE_URL` are present and encrypted. Their values were not printed or independently retrieved. Stripe and Admin credentials remain server-only; the Firebase JSON configuration requires the value without dotenv's enclosing single quotes.

Billing source was committed and pushed to `main` as `9ad3850a7f22a13e5fdd6d02bf8220e5fdd5b286`. Its production deployment `dpl_7X4ExsVWNnhN3RB3KY6cjMQN75Ft` reached Vercel READY and received the primary domain, but actual API checks found Firebase Admin 14 ESM/CommonJS cold-start failures returning generic 500 responses. READY was therefore not treated as proof of working billing.

The narrow Metro packaging correction and real exported-handler startup tests were committed and pushed as `32df233423c3727fd89b1d09a96904a269fa7bad`, changing only `metro.config.js` and `tests/server-startup.test.cjs`. Production deployment `dpl_9WAaDuaNEa3b2PZXmem83jU4vPsf` is READY. The `domaindatabases.com` alias readback points to that exact deployment with `redirect=null`.

Only `firestore:rules` was deployed to `domainsdatabase-e62a3`, after the initial matching server reached READY and received the primary domain. Release `projects/domainsdatabase-e62a3/releases/cloud.firestore` now points to ruleset `334bd06d-4366-446c-864a-731578465d91`, updated at `2026-10-23T16:53:24.058564Z`. Independent Admin readback at `2026-10-23T16:53:41.792Z` confirmed the published source SHA-256 exactly matches the tested rules: `36826438700b82de68f605ecdc846beca12a6704ae10f4a45de5a03fb4ec9bdb`. The restrictive rules remained in place while the server startup failure was repaired.

Normal-DNS HTTPS readback at `2026-10-23T17:06:15.908Z` confirmed `/`, `/pricing`, and `/subscription?plan=starter` return 200 HTML. Unauthenticated `GET /api/billing/status` and `POST /api/billing/checkout`, `/api/billing/portal`, `/api/billing/reconcile`, and `/api/portfolio/commit` return 401 JSON with `billing_sign_in_required`. An invalid-signature `POST /api/billing/webhook` returns 400 JSON with `billing_signature_invalid`. These API responses are private/no-store rather than the prior generic cold-start 500s. At `2026-10-23T17:06:31.961Z`, a structurally valid synthetic RS256 bearer token also returned the expected 401 JSON, exercising Admin initialization and token-verification rejection without a real identity or production write.

Real sign-in, Free signup, deployed quota transactions, Starter Checkout, verified paid webhook entitlement, renewal/failure handling, and Portal cancellation remain unverified end to end. Use a separate Subscriber account because active Owners bypass enrollment. Complete sandbox coverage before any explicitly authorized live payment. No access should be granted from a success URL, and these checks did not create Stripe customers, subscriptions, invoices, or charges.

Vercel is linked to `strawhat19/Domains-Database`, production branch `main`, with automatic deployments and custom-domain assignment enabled. A successful deployment after a push to `main` updates production. Local edits and local commits alone do not deploy.

The provisioning script is `node scripts/sync-stripe-billing.cjs`. It reuses app-marked products, exact recurring prices, the dedicated Portal, and the existing webhook. It refuses duplicate mappings and does not create customers, subscriptions, invoices, or charges.

## Approved Checks

- `npm run export:web` passed: 79 static routes and 18 API routes, including all billing endpoints and the portfolio commit endpoint. A second isolated export from the clean billing HEAD plus the Metro fix passed with the same counts, excluding the uncommitted AdSense preparation.
- `node --test --test-reporter=spec tests/server-startup.test.cjs` passed 7/7 checks against actual generated server handlers with provider networking disabled. These checks exercise server initialization, which a successful export alone does not establish.
- The resulting public client output (511 files) was scanned for eleven configured private credential patterns, including the Firebase private key material. No matches were found; the isolated fixed export also returned 511 files and zero credential matches.
- `node --test --test-reporter=spec tests/billing.test.cjs` passed 46/46 tests using isolated Stripe/Firestore doubles. Coverage includes paid period/price/identity validation, trials, duplicate subscriptions, Checkout retry/recovery, account leases/versioning, event deduplication, Portal binding, allowed redirect hosts, and actual Stripe SDK raw-body signature verification/tamper rejection.
- `node --test --test-reporter=spec tests/portfolio.test.cjs` passed 19/19 tests against the actual portfolio handler, domain normalization, and public projection with isolated transactions. Coverage includes Free 32→33/33→34 and Starter 332→333/333→334 boundaries; expired paid access; trusted Owner bypass; over-limit edits/deletes without growth; actual record-count bootstrap; stale/concurrent revision fencing; fresh identity binding; and exclusion of private properties from public projections.
- `node tests/rules/billing-permissions.cjs` passed 112/112 mocked Firebase Rules API cases (32 allowed, 80 denied). Rule compilation has no errors or warnings. The suite sends the local rule source and synthetic documents to the stateless Rules test API; it does not deploy rules or write production data.
- `tsc --noEmit --pretty false` still fails with 46 diagnostics. An in-memory compilation of committed HEAD `cd5f3e400be5297f7066f64b7ebe76a2765a3739`, using identical installed dependencies/options, reports the exact same file/line/column/code/message diagnostics. There are zero new diagnostics. Two access-check placement errors caught in the first run were fixed before the successful export and final comparison. Unrelated baseline errors were preserved.

The tests do not create Stripe customers, subscriptions, invoices, or charges. Real Firestore concurrent transactions, valid deployed webhook transport, browser/device behavior, and an end-to-end paid subscription remain separate validation steps.

The credential-free rules readback and prior source backup are saved under `C:/Users/massa/.codex/visualizations/2026/10/23/01a1695f-f091-7232-9bf0-e4a6b998df82/` as `billing-firestore-rules-after-release.json`, `billing-firestore-rules-before-release.json`, and `billing-firestore-rules-deploy.log`. The clean fixed export and startup-check artifact directory is `C:/Users/massa/AppData/Local/Temp/domains-database-startup-01d44b053edf48e68b723cc483e02ee6`; it contains no private `.env`.

This release-record update remains local and uncommitted to avoid another documentation-only automatic deployment. The billing code commits and live rules above are published; the separate AdSense preparation remains uncommitted and is not part of this billing release.

See [Subscription Flow](../subscription-flow.md) and [Entitlement Enforcement](billing-entitlement-enforcement-2026-10-23.md) for source contracts and limitations. Source review and external resource configuration are distinct from deployment and verified payment behavior.
