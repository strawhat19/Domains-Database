# Account And Subscription Enrollment

Free and Starter cards offer account creation and a separate Sign In link for guests, even when pricing feedback/upvotes are displayed. Free returns to `/domains` after authentication. Starter preserves `plan=starter` through email signup/signin, Google authentication, and switching between the two account screens, then continues to `/subscription?plan=starter`. These selections are allowlisted internal navigation values; they never enter signup credentials or assign account access.

The internal subscription page reads the active catalog through `plansAPI`. It shows the current plan name, description, price, interval, and saved Included/Planned features. Signed-out visitors can create an account or sign in; authenticated visitors review the offer before explicitly choosing Save Subscription Request. Existing trusted Starter-or-higher accounts and Owners receive a portfolio action instead of a redundant request. Loading, unavailable plans, account-access errors, failed saves, and retry remain distinct states.

`subscriptionAPI.getRequest(userId)` and `saveRequest(userId, plan)` use the existing private account storage adapter. The key is `domains-database:subscription-request:v1:user:{appUserId}`. Connected storage uses the existing `users/{appUserId}/data`, `storageKeys`, and `snapshots/storage` mechanism, including generated Data IDs and atomic numbering; no public User fields or new collections are required. Existing explicit local mode labels its request as saved on this device. Configured cloud failures do not fall back to local storage.

The saved version-one request contains the account and plan references, catalog price/currency/interval, request timestamp, and the fixed `awaiting-payment-setup` state. The service checks the active nonanonymous account before and after storage operations, rereads the active Starter offer from the server in connected mode, rejects changed pricing, and confirms the saved record by rereading it. Repeating the same request preserves its original timestamp. The UI restores saved requests after refresh, and a changed catalog quote must be reviewed and saved again.

This completes account enrollment and a persisted subscription request. No payment method is collected, no Stripe object is created, and no charge or paid subscription is claimed. The request is client-writable intent and is never trusted as evidence of payment. `User.plan`, role, entitlements, and provider-access rules remain unchanged. The user can continue using the Free portfolio while payment setup is pending.

## Future Stripe Connection

Connect a server-owned Billing/Checkout boundary after Stripe is configured. Authenticate each request, reread the authoritative catalog, and map stable app plan IDs to Stripe Products and recurring Prices using named external-ID fields or a private mapping. Each paid tier has its own Product; its currency and billing variants use Prices. Verify the current offer again before creating a Checkout Session and use retry-safe request identities. Keep provider credentials and webhook signing secrets server-only.

Subscription lifecycle webhooks are required for activation, renewals, failed payments, and cancellation. Verify signatures, handle duplicate/out-of-order events, bind provider records to the authenticated account, and update trusted entitlements only after confirmed provider state. A success-page URL, saved request, browser return parameter, or catalog publication cannot activate access.

Tax configuration must be decided alongside Billing before accepting payments. Confirm applicable registrations and supported regions before enabling Stripe Tax; do not assume that enabling automatic tax alone establishes registrations or tax collection.

Source review covered shared navigation, authentication continuation, account-scoped request persistence, and web/native rendering. No tests, builds, browser/device checks, live signup, cloud request write, Stripe operation, or deployment was performed for this change.
