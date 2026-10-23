# Account And Stripe Subscription Flow

Free and Starter cards provide account creation and a separate Sign In link for guests. Free returns to `/domains` after authentication. Starter preserves `plan=starter` through email signup/signin, Google authentication on the website, and switching account screens, then continues to `/subscription?plan=starter`. These allowlisted navigation values never assign a plan or enter signup credentials.

## Plans And Access

Free includes up to 33 domains and GoDaddy/Hostinger connections. Starter is USD $1.33 per month for up to 333 domains, its additional supported registrar connections, annual/monthly costs, website research, hosted-domain discovery with registrar lookup, registrar price comparison, and Community. Provider credentials, supported provider capabilities, and applicable feature settings still apply. Domain Auctions remain Planned for subscribers; active Owners can use the existing preview. Other future catalog tiers remain enquiries or planned offers and cannot be purchased through this integration.

Active Owner accounts bypass plan limits and feature eligibility without a paid subscription. Every other account uses the protected `billingUsers/{appUserId}` mirror: Starter requires an eligible Stripe subscription status and an unexpired server-confirmed access date. Client-selected plans, legacy subscription-request snapshots, `users.plan`, catalog publication, and a successful browser return cannot grant paid access. The server updates `users.plan` as display metadata; operational gates use the protected mirror.

Domain additions/imports are checked against the current 33/333 limit by the shared service and an authenticated server transaction. Feature services, applicable HTTP handlers, and Firestore rules enforce paid/provider eligibility independently of the visible controls. Existing records are not deleted automatically when access returns to Free; adding more records remains subject to the lower limit. Owner bypass does not remove private record audiences or ownership boundaries.

## Checkout And Billing Management

The subscription page reads the published Starter offer through `plansAPI` and displays its current name, description, amount, interval, and Included/Planned features. After signing in, a user reviews the offer and explicitly chooses **Subscribe For $1.33/Month**. The browser opens hosted Stripe Checkout; native clients use the canonical `https://domaindatabases.com` API and open Checkout in the browser. Firebase email/password works on both targets; Google authentication remains web-only until native OAuth is configured.

Checkout validates the selected app-owned plan ID, USD 133-cent monthly amount, active catalog record, and configured live Stripe Price before creating a subscription session. The account and Stripe customer are bound server-side. A per-account lease, persisted attempts, Stripe idempotency keys, and recovery of previous sessions prevent retries from intentionally starting a second concurrent subscription. An account with an existing continuing subscription is directed to Manage Billing instead.

Existing subscribers can choose **Manage Billing** from `/subscription?plan=starter`, reached through the Starter card's **Manage Subscription** action. The configured Stripe Portal supports payment management and cancellation at the end of the billing period. The page shows current subscription status and any scheduled cancellation date. Starter access continues through its confirmed paid period, then Free limits apply. Payment failures, paused/ended subscriptions, and expired access do not keep paid features unlocked.

Billing management remains reachable when the public Starter catalog record is unavailable. Active Owners see Owner Access and do not need to buy Starter; an Owner with an existing Stripe customer can still open Manage Billing.

## HTTP Contracts And Private Records

`src/api/subscriptions.ts` exposes the shared `subscriptionAPI`. Account operations use a Firebase bearer token, validate the current Firebase UID/app account before and after requests, and reject stale-account results. The server independently verifies the token, linked app identity, active user, and request origin. Local demo mode cannot create real subscriptions. Returned navigation URLs are restricted to HTTPS Stripe Checkout or Billing Portal hosts.

| Endpoint | Request | Result |
| --- | --- | --- |
| `GET /api/billing/status` | Authenticated account | Confirmed billing status |
| `POST /api/billing/checkout` | `planId`, `priceCents`, `currency`, `billingInterval` | Hosted Checkout `url` |
| `POST /api/billing/portal` | Empty JSON object | Hosted Portal `url` |
| `POST /api/billing/reconcile` | `sessionId` | Confirmed billing status after account-bound session validation |
| `POST /api/billing/webhook` | Raw signed Stripe event | Acknowledgement after supported event processing |

Billing status contains `plan` (`free` or `starter`), `owner`, `checkoutAvailable`, `portalAvailable`, and a nullable `subscription` with `status`, `cancelAtPeriodEnd`, and `currentPeriodEnd`. Errors return `error` and `code` with an appropriate non-success HTTP status.

Private `billingAccounts` documents use app-owned IDs and atomic numbering. Named Stripe reference fields identify customers, subscriptions, Checkout sessions, and events; private mappings and event-processing records support account binding and retries. `billingUsers` exposes only the current account's protected access projection to the client. Client writes to billing records are denied. Billing credentials and webhook signing secrets are server-only.

Stripe hosts the payment form and handles entered payment information. The app supplies account references, name, email, and the selected offer, and stores private billing references/status/access dates. Card numbers and card security codes are not stored in the app's profile or portfolio records and do not enter exports.

## Confirmation And Lifecycle

Checkout returns to `/subscription?plan=starter&checkout=success&session_id=...`; cancellation returns with `checkout=cancelled`. Portal returns with `billing=updated`. These parameters select feedback and reconciliation only. The server verifies session ownership and rereads live subscription state; the return URL never writes access directly.

Supported lifecycle webhooks cover subscription changes, Checkout completion/expiration, and invoice payment outcomes. The raw request is signature-verified and must be live mode. Event deduplication and retryable leases handle repeated deliveries. Under the account lease, synchronization reads current Stripe state rather than trusting event order. Access follows the configured single Starter price and a matching paid invoice line with a valid current period, or a genuine server-confirmed Stripe trial period; Checkout does not offer a trial.

The UI distinguishes cancelled Checkout, unavailable configuration, failed requests, incomplete/payment-attention states, scheduled cancellation, ended subscriptions, and confirmed active access. After a successful Checkout return, bounded status polling allows confirmation to finish; otherwise the user can refresh billing status manually. Protected feature access waits for the confirmed Firestore mirror. Account switches abort or discard old requests and redirects, and confirmed mirror eligibility changes refresh the displayed billing state.

## Data Reset And Release Evidence

Deleting app data, deleting data plus registrar connections, signing out, clearing browser storage, or removing the app does not cancel a paid subscription. Both cloud data-reset confirmation dialogs direct the user to the Starter subscription page and **Manage Billing** before clearing data. Private billing records remain separate from portfolio cleanup. Cloud account deletion/deactivation remain unavailable.

The server requires its live Stripe key, approved Starter Price, webhook signing secret, Firebase service account, and canonical site URL. A dedicated Portal configuration can be selected. Production environment configuration, the published catalog, webhook delivery, deployed rules, deployment, and a complete purchase/cancellation flow are separate evidence from these source changes; missing configuration is shown as unavailable rather than a saved or successful purchase.

The approved focused billing and Firestore permission tests and production export passed. TypeScript reports 46 diagnostics identical to the committed-source baseline, with none added by this change. See [the billing release record](deployments/live-billing-2026-10-23.md) for commands, coverage, and limitations. Deployment, real webhook delivery, and a complete purchase/cancellation flow still require separate verification.
