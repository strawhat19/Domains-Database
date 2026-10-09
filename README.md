# Domains Database

Domains Database is a domain inventory built with Expo, React Native, TypeScript, and Sass, with Firebase Authentication, private Firestore account storage, and a read-only server relay for registrar APIs. The landing page uses the v8 logo and opens with a compact portfolio. The full portfolio combines registered domains and their custom project details in the signed-in account.

## Run locally

Use Node.js 22.20.0 or another version supported by Expo SDK 57. Node 22.20.0 is already installed on this computer through nvm-windows.

The npm scripts check the minimum Node version and preload a Windows limit of 32 concurrent file reads and writes to reduce Metro's EMFILE errors while retaining its disk cache.

```powershell
nvm use 22.20.0
npm install
npm run web
```

For mobile, run `npm start` and open the project with an Expo Go version supporting SDK 57. `npm run android` opens an available Android emulator. iOS development requires a compatible device or a Mac for the simulator.

## What the MVP includes

- An ivory, navy, and teal landing page with the supplied v8 SVG logo
- A compact portfolio preview and a full portfolio page
- Search, registrar filters, renewal status, owner names, auto-renew preferences, and estimated yearly costs
- Add, edit, remove, and CSV import/export with private Firestore account storage
- Loading skeletons and optional fictional sample records, disabled by default
- Selectable table columns with saved preferences and counts of populated rows
- About, Terms, Contact, Privacy, and an API directory page
- A public contact form with private Firestore submissions and an Owner-only review table
- Mobile screens and EAS configuration for future native builds
- Firebase email/password sign-up and sign-in, Google sign-in on web, session restoration, and avatar sign-out
- Account-scoped portfolios, table preferences, and grouping, with a protected Profile page
- Public Home and Domains tables, including an empty table, with isolated guest records
- Home, Domains, Search, and Community navigation, plus account Profile and Connections pages
- Private-by-default profiles; public profiles, domain sharing, and Community are unavailable in cloud mode
- Optional local-mode Community with Markdown posts, follows, and public HTTPS image URLs; no image uploads
- Private account-scoped registrar connection values, stored separately from profile records
- Connected-registrar availability/price comparison with external registrar purchase links
- Automatic Hostinger external-website discovery with RDAP registrar identification
- Free PageSpeed mobile performance and Tranco rank columns, with source dates and missing-data states
- Automatic connection checks and domain imports after saving connections, signing in, and restoring a session
- An Owner-only Dashboard showing saved account counts and your own portfolio statistics

Registrar connections use the credentials saved in your account to read domains through the Expo server. Signed-in data is saved in Firestore and can be loaded on another device using the same Firebase account. Guest records remain separate on the current device. Auto-renew controls update inventory records only; change the actual setting in your registrar account. GoDaddy Auctions is a source label retained on existing records; GoDaddy's domain portfolio does not identify auction acquisitions separately. The documented public Auctions API cannot enumerate all account bids, wins, or purchase history, so this app has no automatic Auctions activity import. See the [GoDaddy Auctions operations](https://developer.godaddy.com/en/docs/api-users/auctions).

## Firebase account data and API

`src/shared/firebase/config.ts` contains the public Firebase web app configuration for `domainsdatabase-e62a3`, with optional `EXPO_PUBLIC_FIREBASE_*` environment overrides. `src/shared/config.ts` sets the master `useLocalStorage` flag from Firebase availability; the checked-in configuration selects Firebase by default. These public Firebase identifiers are client configuration, not registrar secrets. Guest records and unscoped device settings still use AsyncStorage. Explicit local mode uses browser/device storage and the existing demo authentication.

`src/api/index.ts` provides asynchronous domain operations and a route directory through the shared storage adapter. The `/api` page documents this interface; most listed operations are internal services backed by Firestore for signed-in accounts. `POST /api/connections/environment`, `POST /api/registrars/sync`, `GET /api/registrars/search`, `POST /api/registrars/search`, `POST /api/registrars/extensions`, and `POST /api/website-insights` are actual Expo HTTP endpoints. `src/shared/domainContext/` owns shared state. Domain records receive an app-owned ID and a monotonic integer `number`.

`useSampleData` defaults to `false`, so the portfolio starts empty and saved sample rows are removed while your own records remain. Firebase accounts do not automatically adopt or upload guest portfolios, old local accounts, connection values, or preferences. Export local domains and import the CSV while signed in to migrate them explicitly; enter connection values again. Clearing browser data removes local guest data and session state, but does not delete saved Firestore account records.

`src/shared/models/Data.ts` owns common fields, identity, ISO timestamps, and typed color data. `User`, `Notification`, and `models/domains/Domain.ts` extend it. `common/ids.ts` generates `Type_Number_Name_11_36_PM_10_22_25_UUID` IDs; services allocate monotonic numbers and preserve identities during edits. `model.toRecord()` supplies plain JSON-compatible records to the local and Firestore adapters. External Firebase identities use `firebase_uid`; account documents retain their app-owned IDs and matching numbers.

Firestore stores the account profile in `users/{appUserID}`. Its private `domains`, `connections`, and `auctionInventory` subcollections hold individual records. Private `data`, `storageKeys`, and `snapshots` records preserve account preferences, columns, custom groups, collections, project statuses, counters, and related saved account state. Domain custom fields, links, tags, and provider metadata stay with their domain records. Account access is enforced by `firestore.rules`; the account and trusted Owner role can access private account data. The repository's rules and indexes have been deployed to `domainsdatabase-e62a3`.

The public Contact page uses `formSubmissionsAPI.submitContact()` to save name, email, subject, message, status, and submission timestamps in `formSubmissions/{FormSubmission_ID}`. Contact IDs use the fixed name `Contact`, with a matching auto-incremented `number`; the `counters/formSubmissions` document contains no contact details. The counter and submission are saved together, enforced with [Firestore atomic-write rules](https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents). Visitors can create validated submissions but cannot read or edit them. Owners can review all submissions in Dashboard and mark them New, Read, or Archived. Submission data is independent of account portfolio resets. Explicit local mode retains a separate device-local intake. Email delivery, uploads, and Cloud Functions remain deferred.

Cloud saves check snapshot revisions to detect conflicting edits. Large record changes are saved in sequential atomic chunks, without a 400-record total cap. A later network failure or conflict can leave earlier chunks saved; the error asks you to refresh and retry. Cross-device updates are loaded through the existing read/refresh flow rather than a live subscription.

`src/shared/models/domains/Domain.ts` adds provider ID/status, registration dates, lock/privacy/DNSSEC settings, nameservers, currency, and registrant details. Provider-specific values and original CSV columns stay in `meta`. Missing optional values appear as an em dash in the table.

First imported and first exported timestamps are saved when those actions occur and retained on later imports, edits, and exports. Existing records without history receive timestamps on their next import or export. Column counts cover the entire saved portfolio, including meaningful values such as `0` and `false`.

Domains start in alphabetical order. The button beside Columns switches between table and cards, with the view saved for the current portfolio. Monthly cost is annual renewal cost divided by twelve; selecting that column also shows the monthly portfolio total beside the yearly total. Site icons load from each domain's `/favicon.ico`, with a globe fallback.

Dark mode is the default. The saved theme is applied in the document head before the page paints. Search controls and table headings use CSS sticky positioning, with header widths and horizontal scrolling kept aligned with the table.

Use Group to organize domains by a field or create custom groups and assign their members. Manual order clears the active column sort and enables dragging and move buttons within each group. Column sorting disables manual reordering; clicking a heading cycles ascending, descending, and manual order. Group membership and manual ordering are saved for the current account and restored when Manual order is active. Position numbers reflect the current filtered display. The table's column-header checkbox selects or clears visible domains, the selected count sits beside the registrar filter, and selection carries between table and cards.

## CSV format

Use Import CSV in the portfolio or drop one CSV (up to 5 MB) into the Add Domain wizard before reviewing it. Include domain, registrar, and expiry columns; unknown registrar or expiry values can be blank. GoDaddy exports are recognized from their export columns; the wizard supplies a registrar when the file has no registrar column. Common domain fields and extra CSV columns are retained. A template is available at `public/domain-import-template.csv`.

```csv
domain,owner,registrar,expiresAt,autoRenew,renewalPrice,notes
example.com,Your Name,Namecheap,2027-10-01,true,14.98,Replace With Your Domain
```

Dates use `YYYY-MM-DD` or ISO timestamps. Registrar labels are `Hostinger`, `GoDaddy`, `GoDaddy Auctions`, `Namecheap`, `Squarespace`, `Porkbun`, or `NameSilo`. Leave an unknown expiry or registrar blank; the record is retained and displayed as unknown. The web import wizard preserves each CSV row's registrar, including files with multiple providers. Re-importing an existing domain updates its details while retaining its app ID and saved notes. Duplicate names within one file and invalid nonempty values are rejected with a message. Export includes common fields and JSON `meta`; values are quoted and protected against spreadsheet formula execution.

## Authentication and credentials

Create a Firebase email/password account at `/signup`, then sign in at `/signin`, or use Google sign-in on the website. Google and email/password providers are enabled in Firebase Authentication. Firebase manages passwords and session credentials separately from Firestore profile records. Native email/password authentication uses persisted device sessions; native Google sign-in still requires native OAuth configuration and is unavailable until that setup is added. The avatar menu opens Profile and Sign Out.

New accounts start with `role: Subscriber`, `roles: [Subscriber]`, `plan: free`, private profiles, and domain sharing off. A trusted administrator can assign Owner in the Firebase console by setting `users/{appUserID}.role` to `Owner`. Client profile updates cannot change roles, plans, or identity fields. Pricing gates, payments, file storage, uploads, and Cloud Functions are not integrated.

Profile supports deleting saved cloud data, either keeping connections or also deleting them; it resets profile sharing and signs out after cleanup. Firebase Auth account deletion and deactivation are not connected. Export a backup before deleting data. Optional local mode retains device-only accounts, salted password verifiers, thirty-day sessions, and the first local account's guest adoption; none of that automatically migrates into Firebase.

Add Domain includes Connect Registrar. Guests can sign in or sign up; signed-in users open Profile → Connections. Connector tabs provide a separate labeled input for each connection key for Vercel, GoDaddy, Hostinger, Namecheap, Porkbun, NameSilo, and Squarespace. Enter only each value, without its variable name or `=`. Profile Connections and the embedded widget show one connector at a time and preserve drafts while switching tabs. Values persist separately for the current account, can be revealed, edited, or removed, and never appear in public profiles, Community, domain notes, or CSV exports. Saving starts a read-only portfolio request for each configured inventory connector; the same check runs on sign-in and session restoration. Squarespace Developer Apps credentials are saved only and do not enable sync. Each successful result updates the current account's table immediately. Connection statuses show counts or actionable failures, while errors at one registrar do not discard successful results from another.

Profile connector tabs appear as Vercel, Hostinger, GoDaddy, Namecheap, Squarespace, Dynadot, Porkbun, NameSilo, Cloudflare, and Name.com. Porkbun and NameSilo have **On Pro Plan** badges and require the stored Pro plan or Owner role to open, import, edit, and manually sync through Profile Connections. Saving the available connectors preserves previously saved Pro credentials. Cloudflare, Dynadot, and Name.com are locked upcoming Pro options; their connection setup is not implemented. These controls do not integrate pricing, payments, or change automatic account-restoration sync.

`.env.example` lists private variable names and setup instructions for the server's `.env` and account Connections. Public domain search and extension catalogs can use complete server-side credential groups; restart the Expo server after editing `.env`, or configure private environment variables on the deployed server. Inventory sync always uses the current request's account credentials and never falls back to `.env`.

Any signed-in user can choose **Import From .env** on Profile → Connections. Dropping a local file on that button or its open panel, or choosing a file, immediately fills the connection fields for review. For pasted `NAME=value` lines, choose **Load Keys**. Supported registrar keys populate the fields, including incomplete groups that can be finished before saving. Existing connections and unsaved edits are kept; duplicate connections are skipped. Choose **Save All Connections**, or **Save & Sync** on one connection, to persist the loaded keys and check domains. File imports accept one `.env` or text file at a time. Parsing happens locally, with a 256 KB input limit; unrelated variables, Firebase keys, and Vercel OIDC tokens are ignored. On native devices, use the paste field.

The same panel offers **Import Server .env** to load allowlisted registrar credentials from the app's server environment into the signed-in user's editable connection fields for review, including incomplete groups. Locally this uses `.env`; on Vercel it uses the deployment's configured private environment variables. The endpoint verifies Firebase authentication and the stored active account identity before returning supported registrar keys. Existing connections and unsaved edits are kept; duplicates are skipped. Imported fields stay masked until revealed, with a success toast for each added key. Choose **Save All Connections**, or **Save & Sync** on one connection, to persist the reviewed keys and check domains. Firestore permission failures are reported separately from confirmed deactivated accounts.

Connections values are stored in private Firestore account records, readable by that account and trusted Owners, and sent by the authenticated account's client to the existing read-only registrar relay. This is not a server-only secret vault or app-managed credential encryption. A user-selected `.env` file is read locally to fill the connection fields; the app does not upload the original file or write a `.env` file. Never prefix registrar secrets with `EXPO_PUBLIC_`.

GoDaddy accepts a PAT with domain-read scope or a production key/secret pair. Hostinger accepts an API token. Namecheap requires API-enabled credentials and the relay server's outbound public IPv4 in the account's whitelist; `NAMECHEAP_CLIENT_IP` must match that address, not a private LAN IP. See the [GoDaddy auth guide](https://developer.godaddy.com/en/docs/api-users/auth), [Hostinger API overview](https://docs.hostinger.com/api-reference/overview), and [Namecheap global parameters](https://www.namecheap.com/support/api/global-parameters/).

Sync is an upsert by normalized domain name. It preserves app IDs, numbers, owner labels, notes, CSV and manually entered annual costs, and fields the provider does not supply. It never deletes a row because it is absent from a later response. Hostinger does not supply auto-renew in its portfolio response. Unknown annual costs appear as `—` until supplied or edited manually. The relay rejects incomplete pagination and malformed inventory results instead of importing a truncated or empty success response. Requests are bounded to 10,000 domains per provider; timeouts, rate limits, expired tokens, and eligibility or IP restrictions appear as errors.

GoDaddy imports an additional **Renewal estimate** through the read-only v2 domain-detail API. The quote uses its returned currency and micro-unit amount, excludes taxes and fees, and provides no renewal period. It stays separate from Annual cost and Monthly cost, does not enter annual/monthly totals, and never overwrites a CSV or manual annual cost. Its source and checked date are stored in `meta.registrarSync.renewalEstimate`, retained in CSV exports, and shown in the estimate tooltip or native card. The new column is enabled once for existing saved column preferences; later show/hide choices remain saved.

The relay tries `GET /v1/shoppers/MY?includes=customerId` to resolve the account UUID. If automatic lookup is unavailable, enter your customer UUID in the GoDaddy Customer UUID field, or provide the classic API key and secret in their fields alongside the PAT for lookup. This is the customer UUID, not the numeric shopper ID. Pricing is optional: lookup and quote failures produce warnings while successful inventory still imports. Each check reads at most 120 domain estimates, spaces quote requests at least one second apart, and stops at access, rate, or time limits. Quotes not refreshed retain their previous checked date. See [GoDaddy renewal pricing](https://developer.godaddy.com/en/docs/api-users/domains/manage/renewals).

## External Hostinger Domains

Hostinger's registration portfolio does not include every domain hosted there. The relay also reads the token's accessible hosting websites, filters temporary names/subdomains, and queries registry RDAP for the actual registrar. Eligible hosted domains join the portfolio automatically, including external registrations such as migrated Google Domains accounts now managed by Squarespace. The profile connection no longer requires a review or per-domain include action. Existing `HOSTINGER_EXTERNAL_DOMAINS` values remain compatible, but an allowlist is no longer required. Previously cached hosted discoveries are imported automatically on the next sync.

Imported external rows use the actual registrar when identified, with hosting/source provenance in `meta`; unknown registrars remain blank. Hosting creation dates are not registration dates, and this discovery does not invent expiry, annual cost, or auto-renew values. RDAP lookup failures preserve registered inventory and show warnings. Squarespace's documented reseller API covers reseller-associated domains, not an ordinary customer's existing personal portfolio. See [Hostinger's API](https://developers.hostinger.com/), [IANA's RDAP bootstrap](https://data.iana.org/rdap/dns.json), and [Squarespace reseller account linking](https://developers.squarespace.com/reseller/account-linking).

## Additional Connectors And Domain Search

Porkbun and NameSilo provide account APIs without a separate API subscription; domain purchases still cost money. Porkbun uses `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY`. NameSilo uses `NAMESILO_API_KEY` from a main account; subaccounts cannot use it. API scoping, access switches, and IP restrictions can limit the visible inventory. See [Porkbun's official API](https://porkbun.com/api/json/v3/documentation) and [NameSilo API Manager](https://www.namesilo.com/support/v2/articles/account-options/api-manager).

Squarespace's Client ID and Client Secret fields save generic `SQUARESPACE_CLIENT_ID` and `SQUARESPACE_CLIENT_SECRET` credentials from the [Developer Apps dashboard](https://account.squarespace.com/developer-apps). This app does not implement their OAuth consent or authorization-code flow, so saving these values does not connect an account or sync domains. See [Squarespace OAuth](https://developers.squarespace.com/commerce-apis/oauth).

Squarespace domain sync uses only `SQUARESPACE_RESELLER_CLIENT_ID` and `SQUARESPACE_RESELLER_CLIENT_SECRET`, the app's dedicated names for credentials issued by a Partner Solutions Architect through an approved reseller agreement. Enter each value in its matching Reseller Client ID or Reseller Client Secret field. Existing generic client values stay generic and are never automatically reclassified; if those saved values are approved reseller credentials, enter them in the dedicated reseller fields. The server exchanges the reseller credentials for a short-lived OAuth token and reads the reseller's provisioned domains in bounded pages. It imports supplied registration/expiry dates, identifiers, and statuses, excludes pending registrations and inactive/cancelled reseller relationships, and preserves existing values for fields the list endpoint does not supply, including auto-renew and costs. The connector is inventory-only and does not enable public Domain Search. Personal domain portfolios and website Commerce API keys cannot be imported through this reseller flow; use manual entry, CSV, or automatic Hostinger hosting discovery for those domains. See [Squarespace reseller authentication](https://developers.squarespace.com/reseller/api-fundamentals), [domain inventory](https://developers.squarespace.com/reseller/domains), and [account-linking limitations](https://developers.squarespace.com/reseller/account-linking).

**Search** appears for everyone when at least one supported registrar has complete, validly formatted credentials in the server's environment. The discovery endpoint returns provider names only; signed-out searches use those server credentials. GoDaddy needs `GODADDY_PAT` or both `GODADDY_API_KEY` and `GODADDY_API_SECRET`; Hostinger needs `HOSTINGER_API_TOKEN`; Porkbun needs both API keys; NameSilo needs `NAMESILO_API_KEY`; Namecheap needs its API key, username, and whitelisted server IPv4. Incomplete or invalid groups are ignored. Signed-in users' saved credentials take priority for each connector, for both search and extension catalogs. The server environment is used only for connectors without saved account credentials. Account credential loading or API failures are reported instead of silently switching those connectors to server credentials. Without either source, connect a registrar through Profile → Connections.

Enter a name such as `youridea` to explore the union of available registrars' extension catalogs, including suffixes such as `co.uk`. Popular extensions appear first; **Show more variants** continues through the catalog in batches of 12. Enter a full domain such as `youridea.com` to check just that address. Catalog failures are reported; common extensions provide a fallback if every catalog fails. Server configuration enables discovery without checking provider eligibility or making a live registrar request; access and quota errors appear when a catalog or search runs.

`GET /api/registrars/search` returns `{ providers: [...] }`. `POST /api/registrars/search` accepts `{ provider, domain }` to use the server environment, while `POST /api/registrars/extensions` accepts `{ provider }` for the same credential source. An explicit `values` string uses the existing account credential format; an empty or malformed explicit value is rejected instead of falling back. Only search and extension catalogs support server credentials; public browsing does not import or reveal the server account's inventory.

Each available domain has one card containing only registrars that explicitly confirm availability, with registration/renewal prices, currency, reported term, and purchase links. Unavailable, unconfirmed, pending, and failed registrar offers are omitted. Skeletons indicate pending checks; completed searches without confirmed available offers show empty or error feedback. Pagination counts all checked variants, including those hidden from the cards. Purchase links open the registrar in a new browser tab, where you complete the purchase yourself. The application does not register domains or charge accounts. The initial generic-extension ranking follows the [DNIB Q2 2026 report](https://www.dnib.com/articles/the-domain-name-industry-brief-q2-2026), followed by familiar country/technology extensions and the alphabetic remainder.

- GoDaddy PAT searches use v3 prices in cents; classic key searches use v1 micro-unit prices. v3 API discounted prices can differ from retail website checkout. Terms and currency are retained; quotes remain indicative.
- Hostinger reports availability without a price in this endpoint; its result links to Hostinger for pricing. Flexible catalog metadata is not guessed into an exact domain quote.
- Namecheap checks availability and retrieves TLD registration/renewal pricing, using the domain-specific premium price for premium names. Extra fees/taxes may apply.
- Porkbun reports per-year USD pricing and the minimum registration duration; a first-year promotion is disclosed separately.
- NameSilo's response omits currency. Returned amounts retain their reported duration when supplied and clearly say the currency was not supplied; confirm it with the registrar.

Sources: [GoDaddy search](https://developer.godaddy.com/en/docs/api-users/domains/search), [GoDaddy pricing](https://developer.godaddy.com/en/docs/api-users/domains/pricing), [Hostinger OpenAPI](https://developers.hostinger.com/openapi/openapi.json), [Namecheap availability](https://www.namecheap.com/support/api/methods/domains/check/), [Namecheap pricing](https://www.namecheap.com/support/api/methods/users/get-pricing/), [Porkbun specification](https://porkbun.com/api/json/v3/spec), and [NameSilo availability](https://www.namesilo.com/api-reference/available-operations/domains/check-register-availability).

## Free Website Information And Traffic Limits

Select domains or filter the table, then choose **Refresh Website Info**. Each run checks up to 10 domains, oldest checked first, with a pause between domains. A remaining-domain count is shown. This is a deliberate action, not an automatic batch at every login. Requests contact Google PageSpeed Insights and Tranco; domain names are sent to those services. Public-DNS checks, fixed upstream hosts, response limits, and deadlines constrain the relay. Quotas or unavailable websites produce source-specific missing-data messages.

The **Mobile performance** column is Google's mobile lab score out of 100. **Tranco rank** is the latest returned daily popularity rank, with its actual list date. Unlisted/unknown values never mean zero visitors. The optional **Insights checked** column and tooltips/native hints show source dates. Results persist in `meta.websiteInsights` and are retained in CSV exports. The new columns are enabled once for existing preferences; later visibility choices stay saved.

There is no reliable free universal API that reveals actual visits, visitors, or organic search traffic for any arbitrary URL. Owner-authorized Google Analytics and Search Console can provide their own measured data, but require separate OAuth/property access and are not connected in this MVP. Public traffic estimates from commercial providers require paid access. UI subscriptions are not automatically API subscriptions.

| Source | What it supplies | API pricing / access |
| --- | --- | --- |
| [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started) | Mobile performance; not traffic | Public API with quota limits; a key is recommended for frequent use |
| [Tranco](https://tranco-list.eu/api_documentation) | Domain rank history; not visits | Free anonymous lookup, limited requests |
| [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1) | Measured users/sessions for authorized GA4 properties | Standard Google Analytics is free; requires property access and quotas |
| [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index) | Google search clicks/impressions for authorized properties | Free API, OAuth/property access and quotas; not all website visits |
| [Similarweb API](https://www.similarweb.com/packages/web/) | Estimated website traffic | Business/standalone API is custom priced; contact sales for an API quote |
| [Semrush Trends API](https://developer.semrush.com/api/v3/trends/overview/) | Estimated traffic and audience analytics | Paid Basic API can be purchased separately; Premium uses a custom sales quote; no free API trial |

Provider access/pricing was reviewed October 2, 2026; final paid API costs depend on the quoted plan and requested data. The current app uses only the public performance/rank lookups. [firestore-plan.md](firestore-plan.md) remains the historical planning document; the Firebase behavior implemented now is described above.

## Reusable Carousel

`src/components/Carousel` accepts a unique `scope`, an accessible `label`, and `slides` with `id`, `label`, and React Native `content`. It defaults to automatic rotation every 7 seconds; `interval` and `autoplay` can be configured. It includes chevrons, connected pagination dots, keyboard navigation, web pointer dragging, and native horizontal swipes. Autoplay pauses during hover, focus, gestures, hidden/background states, and reduced motion. `ConnectionsInputGuide` supplies the registrar-specific text and title icons.

```tsx
<Carousel
  scope={`setup-guide`}
  label={`Setup Guide`}
  slides={[
    { id: `start`, label: `Getting Started`, content: <Text>{`Start Here`}</Text> },
    { id: `next`, label: `Next Steps`, content: <Text>{`Continue Here`}</Text> },
  ]}
/>
```

## Community and public sharing

Cloud Community, public profile discovery, and public domain sharing are deliberately unavailable until a safe public projection and its audience rules are implemented. Profiles start private. Saving a Public preference does not publish a Firebase profile or portfolio. Private account records are not exposed through public queries.

In optional local mode, Community is shared only between accounts saved on the same browser or device. Public profiles appear in Discover; public posts appear in the public feed, follower-only posts appear to followers in Following, and private posts remain author-only. Making a profile private hides it and its posts from other local accounts. Local domain sharing is a separate opt-in projection. The editor supports Markdown formatting, code blocks, previews, and external public HTTPS image URLs, without uploads. External images contact their hosting site when viewed.

Guest domains use their own device storage and are not adopted by Firebase accounts. Home and Domains always show the table, including its empty state, with no account gate.

`ai/skills/structure/structure.md` documents the reusable folder tree and imports. The numbered guides in `ai/skills/` and AGENTS.md are portable to another repository and keep application-specific schemas out of shared instructions.

## Blog Resources

The blog includes a full-width history of the Internet and domain names, followed by portfolio/search actions, Reddit community links and recent discussions, and YouTube channel links and recent videos. `src/shared/blog/resources.ts` owns the curated sources; `GET /api/blog-feeds` reads their public publisher feeds with bounded requests and a 15-minute server cache. No API keys are required. Feed cards open the original discussion or video; source links remain available when feeds cannot load.

Reddit [announced that RSS support ends November 13, 2026](https://support.reddithelp.com/hc/en-us/articles/54353370049684-Changelog-October-8-2026). After that cutoff, its community links remain usable but recent-discussion cards depend on Reddit providing an approved replacement. YouTube feed support is separate. No tests, builds, or UI checks were run for these blog changes.

## Web and mobile publishing

The current web deployment is [domains-database.vercel.app](https://domains-database.vercel.app/) in the Piratechs Vercel team. `vercel.json` builds Expo's server output, serves client assets, and sends page/API requests through `api/index.ts` using the Expo Node adapter. The function has a 240-second limit for the existing bounded registrar requests. `.vercelignore` excludes local `.env` files from uploads; no registrar keys are configured in Vercel.

To redeploy the current working tree, run `npx vercel deploy --prod --scope piratechs` after linking with `npx vercel link --project domains-database --scope piratechs`. The GitHub repository is connected; commit the deployment configuration before relying on deployments from future pushes. Use Node 22.13 or later for Expo. See [Expo's Vercel adapter guide](https://docs.expo.dev/router/web/api-routes/#vercel).

Use the `development` branch for active iteration. Commit and push changes to `origin/development` for Vercel Preview deployments, or run `npx vercel deploy --scope piratechs` on that branch. Keep using the stable branch preview URL for consistent guest storage and add the deployed hostname to Firebase Authentication's authorized domains for Google sign-in.

Signed-in accounts, domains, connection values, and portfolio preferences use the configured Firebase project across hosted origins. Guest/local records and browser session state remain specific to their origin; use explicit CSV migration for existing local portfolios. Deploying the web app is separate from deploying Firebase rules and indexes with `firebase deploy --only firestore --project domainsdatabase-e62a3`. No custom-domain DNS changes were made.

The web app uses Expo server output so registrar API routes can run. Restart `npm start` after changing this configuration. When you are ready to package it, `npm run export:web` writes client and server artifacts to `dist/`. Deploy the Expo server with an appropriate runtime; serving only static files from Apache cannot run the registrar relay. Production native builds need the deployed HTTPS server URL in the `expo-router` plugin's `origin` setting. See [Expo API route deployment](https://docs.expo.dev/router/web/api-routes/).

`eas.json` supplies preview and production profiles for a future Expo EAS mobile build. Store publication still needs your Expo project, signing credentials, final app icons, and store details.

Earlier TypeScript, local-service, deployment, HTTP, and browser checks covered the preceding local MVP and October 2, 2026 deployment. They do not verify this Firebase integration. No new tests, builds, or UI checks were run for the Firebase changes; deploying Firestore rules performed the Firebase CLI's required rules compilation. Existing worklets peer-dependency and Node engine-range warnings remain in the earlier build log.
