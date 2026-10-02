# Domains Database — Production Plan

Temporary planning document, safe to delete. Prepared October 2, 2026. This describes future work; Firebase resources, cloud authentication, secret storage, deployment, and scheduled jobs have not been provisioned.

## Intended Product

Keep the existing Expo, React Native, TypeScript, and Sass application. Deploy the web app at **domains-database.com**, with public browsing and private signed-in portfolios. Users can connect registrar accounts, synchronize domains, compare availability and prices, and open the registrar to complete purchases. Preserve the mobile application path.

The current application stores portfolios, accounts, preferences, and connection values on the device. Its local sign-in system is suitable for development, but it is not production identity or server authorization. Current registrar/search routes are stateless relays using supplied credentials; public launch requires the controls below.

## Recommended Architecture

- **Firebase Authentication:** email/password first; optional Google sign-in later. Verify Firebase ID tokens on every private server route and derive the account from the verified token. Never trust a submitted user ID, editable local role, or local session as authorization.
- **Firestore:** private portfolios, preferences, connection metadata, synchronization summaries, and explicit public profile fields. Continue using the current shared contexts and API facade, replacing storage implementations behind them.
- **Secret Manager:** registrar credentials stored and read only by server code. Firestore contains masked labels, provider, secret reference, connection status, and last check time. Client forms submit replacement credentials through authenticated HTTPS; subsequent reads never return the full key.
- **Firebase Hosting + Cloud Run:** serve the custom domain and Expo server output/API routes through a Node service. The current `web.output: server` supports this direction. Hosting serves static assets and rewrites dynamic/API traffic to Cloud Run. Static Apache hosting alone cannot execute the server routes.
- **Background worker later:** private Cloud Run service with Cloud Scheduler using OIDC and a dedicated service account. Interactive requests start bounded jobs; status documents report completion. Hosting's request timeout makes long portfolio/price enrichment unsuitable for one long browser request.

Firebase client configuration, including its project API key, identifies the project and may be public. Registrar keys, Firebase Admin credentials, secret encryption keys, and private service credentials must never use `EXPO_PUBLIC_` variables or ship in the browser bundle. If encrypted Firestore credential storage is preferred instead, design server-only KMS encryption and access controls separately; do not store plaintext keys in client-readable documents.

## Data Shape And Ownership

| Location | Contents | Access |
| --- | --- | --- |
| `Users/{User_ID}` | App ID, matching integer `number`, public display/profile fields, named `firebase_auth_uid` | Public fields explicitly selected; private account fields separate |
| `Accounts/{Account_ID}` | App ID/number, owning app User ID, named Firebase UID | Account owner; server controls identity mapping |
| `Accounts/{Account_ID}/Domains/{Domain_ID}` | Normalized domain, source metadata, manual costs/notes, registrar estimates, website insights | Account owner only |
| `Accounts/{Account_ID}/Connections/{Connection_ID}` | Provider, masked key label, secret reference, status, last successful sync | Owner sees safe metadata; server owns secret references/writes |
| `Accounts/{Account_ID}/Preferences/{Preference_ID}` | Columns, view, grouping, theme where applicable | Account owner only |
| `Accounts/{Account_ID}/SyncJobs/{Job_ID}` | State, per-provider counts/errors, timestamps, retries | Owner reads; server writes |
| `Counters/{Counter_ID}` | Next integer per collection/account scope | Server transactions only |

Use app-owned IDs shaped `Type_Number_Name_Date_UUID`, for example `User_1_Rakib1_11_36_PM_10_22_25_fjOQm4OD8`. Every collection document has an integer `number` matching its ID. Allocate numbers with server-side Firestore transactions, using a global User counter and account-scoped counters for private collections. Store outside identifiers in named fields such as `firebase_auth_uid`, `registrar_domain_id`, and `stripe_order_id`, never as the primary app ID. Avoid email addresses and secret values in IDs.

Map the verified Firebase UID to an app User/Account on the server. Enforce immutable ownership in Firestore Rules, and repeat authorization checks in server handlers because Admin SDK operations bypass Rules. Public profiles and public domain summaries must use explicit field allowlists; do not expose the full private Domain or User model. Community, notifications, profile privacy, and account roles need their own cloud access design, or can be deferred from the first beta.

## Connection And Synchronization Flow

1. A signed-in user submits credentials to an authenticated connection endpoint. Validate fields without logging raw values, store the secret privately, and return masked metadata.
2. Saving a connection, signing in, or restoring a session requests a sync subject to a short cooldown. The server loads that account's secret, queries its provider, and upserts by normalized domain name while preserving app IDs, numbers, costs, notes, and first-import dates.
3. Provider failures remain independent. Preserve previous records on partial failures and do not delete domains simply because an API omitted them. Report the successful count, candidates, and warnings accurately.
4. External Hostinger website records require confirmation before joining the portfolio; shared/client hosting access does not prove registration ownership. RDAP can identify the registrar, but private renewal/auto-renew settings still require that registrar's account data.
5. Search queries supported connected registrars server-side. Store/cache safe quotes briefly with currency, term, source, and checked time, using account scope when prices are personalized. Quotes are indicative, and registrar checkout determines the charge.
6. Website information uses public lookup sources, with per-source dates and missing-data states. Tranco rank and PageSpeed performance are not visitor counts. Future Google Analytics/Search Console integrations use private OAuth refresh tokens and verified property permissions.

Add per-user/provider request limits, cooldowns, bounded concurrency, upstream timeouts, payload limits, and quota monitoring before public launch. Redact query parameters containing keys from application/proxy logs. App Check can help reduce abuse but does not replace authentication or ownership checks. Keep credential responses private and uncached. Do not add purchase, bid, renewal, or DNS-write endpoints for this beta.

Namecheap requires the **calling server's public IPv4** to be allowlisted. Cloud Run's default outbound IP is not stable. If enabling Namecheap in production, configure Direct VPC egress with Cloud NAT and a reserved static IPv4, publish that address for users to allowlist, and derive `ClientIp` on the server. NAT and IP costs must be included in the budget.

## Existing Device Data Migration

- Require genuine Firebase sign-in, then offer a one-time import preview of that user's local domains and preferences. Keep a local export/backup until the user confirms successful cloud storage.
- Preserve Domain IDs/numbers within the new account scope when valid, deduplicate by normalized domain, and advance the account counter beyond the highest imported number.
- Create a fresh cloud User ID/number. Local User counters collide across devices; do not promote local roles, password hashes, sessions, or another device's identity into cloud access.
- Ask the user to re-enter connection credentials into the secure account form. Do not silently upload all local storage or publish its contents.
- Preserve currency, estimate source/term uncertainty, manual annotations, and website-source timestamps. Offer data export, disconnect/key replacement, and account deletion flows.

## Anticipated File Changes

Approximately **30–45 core files**, depending on how much Community and notification functionality is included. This is an estimate, not a request to replace existing architecture.

| Area | Likely files / change |
| --- | --- |
| Firebase initialization | New `src/shared/firebase/client.ts`, `src/server/firebase/admin.ts`; public config and server secret configuration |
| Authentication | `src/shared/authentication/{service,types}.ts`, `src/api/auth.ts`, `src/shared/authContext/AuthContext.tsx`; current account forms and return routes |
| Private persistence | `src/api/index.ts`, new account/domain/preference repositories; existing shared Domain/column/portfolio preference contexts |
| Connections | `src/shared/connections/{service,types,values}.ts`, `src/api/connections.ts`, `src/components/AccountConnections/*`; new authenticated masked connection endpoints |
| Registrar jobs | `app/api/registrars/sync+api.ts`, `src/server/registrars/{http,sync}.ts`, `src/shared/registrarSync/*`; new job worker/repository while preserving provider parsers |
| Domain search | `app/api/registrars/search+api.ts`, `src/server/domainSearch/*`, `src/shared/domainSearch/client.ts`; replace browser-supplied keys with authenticated account connections |
| Website info | `app/api/website-insights+api.ts`, `src/shared/websiteInsights/*`; quota controls and optional verified-owner analytics connections |
| Migration | New account import route/service and one-time preview component |
| Cloud security | `firestore.rules`, `firestore.indexes.json`, counter allocation and ownership checks |
| Deployment | `Dockerfile`, Node server adapter/entry, `firebase.json`, `.firebaserc`, cloud deployment/worker configuration, `.env.example`, `README.md` |
| Launch content | Review existing About, Terms, Contact, Privacy pages for actual storage, providers, retention, and deletion practices |

## Delivery Order And Costs

1. Build Firebase Auth, private account/domain repositories, counters, and Rules; preserve local data as a backup.
2. Move connection secrets and authenticated sync/search handlers to the server; enforce quotas and masked reads.
3. Add migration preview, error/retry UX, account export/deletion, and observability with secret redaction.
4. Configure Hosting/Cloud Run, custom-domain DNS/HTTPS, Firebase authorized auth domains, and Namecheap static egress if required.
5. Before public beta, authorize and perform cross-account access checks, Rules/emulator tests, credential leakage checks, and deployment validation. Add monitoring, backups, and budget alerts.
6. Add scheduled sync and verified-owner analytics after the interactive product is stable.

Expect the **Blaze pay-as-you-go plan** for this server architecture. Free allowances are not a guarantee of a free deployed product. Firestore reads/writes/storage, Cloud Run execution, Secret Manager access/storage, egress, Scheduler, and particularly static NAT/IP networking can incur charges. Configure billing budgets and service quotas; budget alerts are notifications, not a universal hard spending cap. Domain registrations and registrar account requirements are separate costs.

## Product Limits To Preserve

- Ordinary Squarespace Domains accounts do not have a documented general portfolio-list API; the reseller API is for reseller-associated products and cannot simply recover a personal migrated Google Domains portfolio. Current external-domain discovery is via Hostinger hosting plus RDAP and owner confirmation.
- GoDaddy Auctions remains excluded until an API can automatically enumerate **all personal bids and wins**, as requested. A known-name watchlist does not fulfill that requirement.
- API renewal quotes are estimates with their own currency/source/term; they must not silently replace CSV/manual annual costs or enter annual-spend totals without a known billing term.
- Public website performance/rank sources do not provide actual visitors or search traffic. Those require authorized analytics or a paid estimated-traffic service.

## Official References

- [Expo Firebase guide](https://docs.expo.dev/guides/using-firebase/) and [Expo API routes/server deployment](https://docs.expo.dev/router/web/api-routes/)
- [Firebase ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Firestore ownership rules](https://firebase.google.com/docs/firestore/security/rules-conditions), and [Firebase API-key handling](https://firebase.google.com/docs/projects/api-keys)
- [Secret Manager best practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Firebase Hosting with Cloud Run](https://firebase.google.com/docs/hosting/cloud-run) and [custom domains](https://firebase.google.com/docs/hosting/custom-domain)
- [Cloud Run static outbound IP](https://docs.cloud.google.com/run/docs/configuring/static-outbound-ip), [Cloud NAT pricing](https://cloud.google.com/nat/pricing), and [Scheduler authenticated targets](https://docs.cloud.google.com/scheduler/docs/http-target-auth)
- [Firebase pricing](https://firebase.google.com/pricing), [Cloud Run pricing](https://cloud.google.com/run/pricing), and [Secret Manager pricing](https://cloud.google.com/secret-manager/pricing)
- [Namecheap API introduction](https://www.namecheap.com/support/api/intro/), [Squarespace reseller domains](https://developers.squarespace.com/reseller/domains), and [GoDaddy Auctions reference](https://developer.godaddy.com/en/docs/references/rest/auctions/auctions)
