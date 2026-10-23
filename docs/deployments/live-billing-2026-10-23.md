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

The restricted key cannot read the account's `charges_enabled` or `payouts_enabled` fields. Account-level payment readiness must be confirmed in Stripe; the presence of live prices is not proof of settlement readiness.

## Firebase Server Identity

`domains-database-billing@domainsdatabase-e62a3.iam.gserviceaccount.com` belongs to the existing Firebase project `domainsdatabase-e62a3`. Its project roles are `roles/datastore.user` and `roles/firebaseauth.viewer`. One JSON credential was saved in `.env` as `FIREBASE_SERVICE_ACCOUNT_JSON`; authenticated Admin SDK access to the published Starter plan was confirmed.

The reviewed source uses this server identity for billing and the portfolio quota transaction boundary. No new Firebase project or database was created.

The Starter catalog description was updated in Firestore to match the reviewed local catalog: "A simple start for your growing portfolio. Up to 333 domains for $1.33 per month." The active flag, features, amount, currency, interval, and other tiers were preserved.

The new `domains.name` ascending collection index returned `READY` at 16:30:10 UTC. The existing wildcard exemption and descending number collection-group override were preserved. No Firestore rules were deployed.

## Required Release Steps

Vercel Production variable names were read back after the user copied the values: all five Stripe variables, `FIREBASE_SERVICE_ACCOUNT_JSON`, and `EXPO_PUBLIC_SITE_URL` are present and encrypted. Their values were not printed or independently retrieved. This does not verify the running application or change an existing deployment.

1. Review the source diff and the approved check results below. No commit, push, application UI check, or rule deployment was performed for billing setup.
2. Copy the private billing variables from `.env` into Vercel Production: `STRIPE_SECRET_KEY`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`, and `FIREBASE_SERVICE_ACCOUNT_JSON`. Set `EXPO_PUBLIC_SITE_URL=https://domaindatabases.com` at build time. `STRIPE_FREE_PRICE_ID` is optional catalog metadata. Never expose Stripe or Admin credentials with an `EXPO_PUBLIC_` prefix. Paste the Firebase JSON value into Vercel without dotenv's enclosing single quotes.
3. Ensure the `domains.name` ascending collection index is ready, then deploy the compatible server/client source and restrictive Firestore rules as a coordinated release. The new rules reject old direct portfolio writes; the new endpoint requires the server credentials. Keep payment enrollment unavailable until that release is ready.
4. Confirm real sign-in, Free signup, both quota boundaries, Starter Checkout, verified webhook entitlement, renewal/failure handling, and Portal cancellation. Use a separate Subscriber account: active Owners bypass enrollment. Use sandbox coverage before any explicitly authorized live payment. Do not grant access from a success URL.

Vercel is linked to `strawhat19/Domains-Database`, production branch `main`, with automatic deployments and custom-domain assignment enabled. A successful deployment after a push to `main` updates production. Local edits and local commits alone do not deploy.

The provisioning script is `node scripts/sync-stripe-billing.cjs`. It reuses app-marked products, exact recurring prices, the dedicated Portal, and the existing webhook. It refuses duplicate mappings and does not create customers, subscriptions, invoices, or charges.

## Approved Checks

- `npm run export:web` passed: 79 static routes and 18 API routes, including all billing endpoints and the portfolio commit endpoint.
- The resulting public client output (511 files) was scanned for eleven configured private credential patterns, including the Firebase private key material. No matches were found.
- `node --test --test-reporter=spec tests/billing.test.cjs` passed 46/46 tests using isolated Stripe/Firestore doubles. Coverage includes paid period/price/identity validation, trials, duplicate subscriptions, Checkout retry/recovery, account leases/versioning, event deduplication, Portal binding, allowed redirect hosts, and actual Stripe SDK raw-body signature verification/tamper rejection.
- `node --test --test-reporter=spec tests/portfolio.test.cjs` passed 19/19 tests against the actual portfolio handler, domain normalization, and public projection with isolated transactions. Coverage includes Free 32→33/33→34 and Starter 332→333/333→334 boundaries; expired paid access; trusted Owner bypass; over-limit edits/deletes without growth; actual record-count bootstrap; stale/concurrent revision fencing; fresh identity binding; and exclusion of private properties from public projections.
- `node tests/rules/billing-permissions.cjs` passed 112/112 mocked Firebase Rules API cases (32 allowed, 80 denied). Rule compilation has no errors or warnings. The suite sends the local rule source and synthetic documents to the stateless Rules test API; it does not deploy rules or write production data.
- `tsc --noEmit --pretty false` still fails with 46 diagnostics. An in-memory compilation of committed HEAD `cd5f3e400be5297f7066f64b7ebe76a2765a3739`, using identical installed dependencies/options, reports the exact same file/line/column/code/message diagnostics. There are zero new diagnostics. Two access-check placement errors caught in the first run were fixed before the successful export and final comparison. Unrelated baseline errors were preserved.

The tests do not create Stripe customers, subscriptions, invoices, or charges. Real Firestore concurrent transactions, deployed webhook transport, browser/device behavior, and an end-to-end paid subscription remain separate validation steps.

See [Subscription Flow](../subscription-flow.md) and [Entitlement Enforcement](billing-entitlement-enforcement-2026-10-23.md) for source contracts and limitations. Source review and external resource configuration are distinct from deployment and verified payment behavior.
