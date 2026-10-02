# Domains Database

Domains Database is a domain inventory built with Expo, React Native, TypeScript, and Sass, with a read-only server relay for registrar APIs. The landing page uses the v8 logo and opens with a compact portfolio. The full portfolio brings records from Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap into one device-local list.

## Run locally

Use Node.js 22.20.0 or another version supported by Expo SDK 57. Node 22.20.0 is already installed on this computer through nvm-windows.

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
- Add, edit, remove, and CSV import/export using local device storage
- Loading skeletons and optional fictional sample records, disabled by default
- Selectable table columns with saved preferences and counts of populated rows
- About, Terms, Contact, Privacy, and a local API directory page
- Mobile screens and EAS configuration for future native builds
- Local sign-up, sign-in, session restoration/expiry, and an avatar menu with sign-out
- Account-scoped portfolios, table preferences, and grouping, with a protected Profile page
- Public Home and Domains tables, including an empty table, with isolated guest records
- Home, Domains, Search, and Community navigation, plus account Profile and Connections pages
- Private-by-default profiles, opt-in domain sharing, posts, follows, and audience-filtered local feeds
- A Markdown editor with bold, italic, code blocks, previews, and public HTTPS image URLs; no image uploads
- Five private account-scoped connections: GoDaddy, Hostinger, Namecheap, Porkbun, and NameSilo
- Connected-registrar availability/price comparison with external registrar purchase links
- Hostinger external-website discovery and owner-confirmed imports with RDAP registrar identification
- Free PageSpeed mobile performance and Tranco rank columns, with source dates and missing-data states
- Automatic connection checks and domain imports after saving connections, signing in, and restoring a session
- An Owner-only Dashboard showing real device-local account counts and your own portfolio statistics

Registrar connections use the credentials saved in your account to read domains through the Expo server. Local accounts and inventories remain device-only demos, with no remote account database. Auto-renew controls update inventory records only; change the actual setting in your registrar account. GoDaddy Auctions is a source label retained on existing records; GoDaddy's domain portfolio does not identify auction acquisitions separately. The documented public Auctions API cannot enumerate all account bids, wins, or purchase history, so this app has no automatic Auctions activity import. See the [GoDaddy Auctions operations](https://developer.godaddy.com/en/docs/api-users/auctions).

## Local data and future API

`src/shared/config.ts` contains the master `useLocalStorage` flag, set to `true`. AsyncStorage uses browser storage on web and device storage on mobile. Setting the flag to `false` keeps the auth screens but submission asks you to connect a backend; it does not enable one. The existing domain service retains its session-only mode for a future authenticated integration.

`src/api/index.ts` provides asynchronous local domain operations and a route directory. The `/api` page documents this interface; most listed operations remain local services. `POST /api/registrars/sync`, `POST /api/registrars/search`, and `POST /api/website-insights` are actual Expo HTTP endpoints. `src/shared/domainContext/` owns shared state. Domain records receive an app-owned ID and a monotonic integer `number`.

`useSampleData` defaults to `false`, so the portfolio starts empty and saved sample rows are removed while your own records remain. Your portfolio is not synchronized across devices. Export a CSV before clearing browser data or uninstalling the app.

`src/shared/models/Data.ts` owns common fields, identity, ISO timestamps, and typed color data. `User`, `Notification`, and `models/domains/Domain.ts` extend it. `common/ids.ts` generates `Type_Number_Name_11_36_PM_10_22_25_UUID` IDs; services allocate monotonic numbers and preserve identities during edits. Use `model.toRecord()` to get a plain JSON-compatible record for a future Firestore adapter. Credentials remain separate from public models.

`src/shared/models/domains/Domain.ts` adds provider ID/status, registration dates, lock/privacy/DNSSEC settings, nameservers, currency, and registrant details. Provider-specific values and original CSV columns stay in `meta`. Missing optional values appear as an em dash in the table.

First imported and first exported timestamps are saved when those actions occur and retained on later imports, edits, and exports. Existing records without history receive timestamps on their next import or export. Column counts cover the entire saved portfolio, including meaningful values such as `0` and `false`.

Domains start in alphabetical order. The button beside Columns switches between table and cards, with the view saved on this device. Monthly cost is annual renewal cost divided by twelve; selecting that column also shows the monthly portfolio total beside the yearly total. Site icons load from each domain's `/favicon.ico`, with a globe fallback.

Dark mode is the default. The saved theme is applied in the document head before the page paints. Search controls and table headings use CSS sticky positioning, with header widths and horizontal scrolling kept aligned with the table.

Use Group to organize domains by a field or create custom groups and assign their members. Manual order clears the active column sort and enables dragging and move buttons within each group. Column sorting disables manual reordering; clicking a heading cycles ascending, descending, and manual order. Group membership and manual ordering are saved locally and restored when Manual order is active. Position numbers reflect the current filtered display. The table's column-header checkbox selects or clears visible domains, the selected count sits beside the registrar filter, and selection carries between table and cards.

## CSV format

Use Import CSV in the portfolio or drop one CSV (up to 5 MB) into the Add Domain wizard before reviewing it. Include domain, registrar, and expiry columns; unknown registrar or expiry values can be blank. GoDaddy exports are recognized from their export columns; the wizard supplies a registrar when the file has no registrar column. Common domain fields and extra CSV columns are retained. A template is available at `public/domain-import-template.csv`.

```csv
domain,owner,registrar,expiresAt,autoRenew,renewalPrice,notes
example.com,Your Name,Namecheap,2027-10-01,true,14.98,Replace With Your Domain
```

Dates use `YYYY-MM-DD` or ISO timestamps. Registrar labels are `Hostinger`, `GoDaddy`, `GoDaddy Auctions`, `Namecheap`, `Squarespace`, `Porkbun`, or `NameSilo`. Leave an unknown expiry or registrar blank; the record is retained and displayed as unknown. The web import wizard preserves each CSV row's registrar, including files with multiple providers. Re-importing an existing domain updates its details while retaining its app ID and saved notes. Duplicate names within one file and invalid nonempty values are rejected with a message. Export includes common fields and JSON `meta`; values are quoted and protected against spreadsheet formula execution.

## Credentials

Create your local account at `/signup`, then sign in at `/signin`. Password verifiers use PBKDF2-SHA256 with a unique salt; raw passwords are not saved in public User records. The avatar menu opens Profile and Sign Out. Every sign-up defaults to Subscriber; Owner access is assigned separately by a trusted administrator when a backend is connected, and no public form can grant it.

The first local account adopts the existing portfolio, columns, and grouping preferences. Original storage keys remain as a backup; later accounts start with their own records. Sessions expire after thirty days. Local storage is editable by someone with access to the device, so this flow is not a production security boundary or a cloud login.

Add Domain includes Connect Registrar. Guests can sign in or sign up; signed-in users open Profile → Connections. Its five fields accept `.env`-style values for GoDaddy, Hostinger, Namecheap, Porkbun, and NameSilo. Values persist separately for the current account, can be revealed, edited, or removed, and never appear in public profiles, Community, domain notes, or CSV exports. Saving starts a read-only portfolio request for each configured registrar; the same check runs on sign-in and session restoration. Each successful result updates the current account's table immediately. Connection statuses show counts or actionable failures, while errors at one registrar do not discard successful results from another.

`.env.example` lists the private variable names and setup instructions to paste into Connections. The relay uses only the current request's credentials; it never falls back to the machine's `.env`, stores secrets, or returns raw provider responses. Credentials saved through Connections remain in local browser or device storage; the frontend does not write a `.env` file. Local storage is readable by someone with access to the device. Before offering this to other users, replace local demo authentication and credential storage with authenticated server accounts and a private secret store. Never prefix registrar secrets with `EXPO_PUBLIC_`.

GoDaddy accepts a PAT with domain-read scope or a production key/secret pair. Hostinger accepts an API token. Namecheap requires API-enabled credentials and the relay server's outbound public IPv4 in the account's whitelist; `NAMECHEAP_CLIENT_IP` must match that address, not a private LAN IP. See the [GoDaddy auth guide](https://developer.godaddy.com/en/docs/api-users/auth), [Hostinger API overview](https://docs.hostinger.com/api-reference/overview), and [Namecheap global parameters](https://www.namecheap.com/support/api/global-parameters/).

Sync is an upsert by normalized domain name. It preserves app IDs, numbers, owner labels, notes, CSV and manually entered annual costs, and fields the provider does not supply. It never deletes a row because it is absent from a later response. Hostinger does not supply auto-renew in its portfolio response. Unknown annual costs appear as `—` until supplied or edited manually. The relay rejects incomplete pagination and malformed inventory results instead of importing a truncated or empty success response. Requests are bounded to 10,000 domains per provider; timeouts, rate limits, expired tokens, and eligibility or IP restrictions appear as errors.

GoDaddy imports an additional **Renewal estimate** through the read-only v2 domain-detail API. The quote uses its returned currency and micro-unit amount, excludes taxes and fees, and provides no renewal period. It stays separate from Annual cost and Monthly cost, does not enter annual/monthly totals, and never overwrites a CSV or manual annual cost. Its source and checked date are stored in `meta.registrarSync.renewalEstimate`, retained in CSV exports, and shown in the estimate tooltip or native card. The new column is enabled once for existing saved column preferences; later show/hide choices remain saved.

The relay tries `GET /v1/shoppers/MY?includes=customerId` to resolve the account UUID. If automatic lookup is unavailable, add `GODADDY_CUSTOMER_ID=your_customer_uuid` to your GoDaddy connection, or provide the classic API key/secret pair alongside the PAT for lookup. This is the customer UUID, not the numeric shopper ID. Pricing is optional: lookup and quote failures produce warnings while successful inventory still imports. Each check reads at most 120 domain estimates, spaces quote requests at least one second apart, and stops at access, rate, or time limits. Quotes not refreshed retain their previous checked date. See [GoDaddy renewal pricing](https://developer.godaddy.com/en/docs/api-users/domains/manage/renewals).

## External Hostinger Domains

Hostinger's registration portfolio does not include every domain hosted there. The relay also reads the token's accessible hosting websites, filters temporary names/subdomains, and queries registry RDAP for the actual registrar. This includes external registrations such as migrated Google Domains accounts now managed by Squarespace. Hosting access can include clients' sites, so discovered names appear under Profile → Connections for review; choose **Include My Domain** only for domains you own. The action saves a comma-separated `HOSTINGER_EXTERNAL_DOMAINS` allowlist in your existing private Hostinger connection and resyncs. No repeated CSV export is needed.

Imported external rows use the actual registrar when identified, with hosting/source provenance in `meta`; unknown registrars remain blank. Hosting creation dates are not registration dates, and this discovery does not invent expiry, annual cost, or auto-renew values. RDAP lookup failures preserve registered inventory and show warnings. Squarespace's documented reseller API covers reseller-associated domains, not an ordinary customer's existing personal portfolio. See [Hostinger's API](https://developers.hostinger.com/), [IANA's RDAP bootstrap](https://data.iana.org/rdap/dns.json), and [Squarespace reseller account linking](https://developers.squarespace.com/reseller/account-linking).

## Additional Connectors And Domain Search

Porkbun and NameSilo provide account APIs without a separate API subscription; domain purchases still cost money. Porkbun uses `PORKBUN_API_KEY` and `PORKBUN_SECRET_API_KEY`. NameSilo uses `NAMESILO_API_KEY` from a main account; subaccounts cannot use it. API scoping, access switches, and IP restrictions can limit the visible inventory. See [Porkbun's official API](https://porkbun.com/api/json/v3/documentation) and [NameSilo API Manager](https://www.namesilo.com/support/v2/articles/account-options/api-manager).

Open **Search** in the header and enter a full domain such as `youridea.com`. Every saved supported connection is queried independently; a failed registrar does not hide the others. Results show availability, returned registration/renewal prices, currency and reported term, or an explicit missing price. **Open Registrar** completes a purchase on that provider's website. The application does not register domains or charge accounts.

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

Provider access/pricing was reviewed October 2, 2026; final paid API costs depend on the quoted plan and requested data. The current app uses only the public performance/rank lookups. See [firestore-plan.md](firestore-plan.md) for the production database, secret storage, authentication, hosting, migration, and anticipated file changes.

## Local Community

Community is shared between accounts saved on this browser or device; it is not a remote social network. Profiles start private. Profile lets each user choose Public or Private and separately opt in to showing domain names and registrars. No owner details, registration contact data, notes, prices, or credentials are included in public domain summaries.

Public profiles appear in Discover. Public posts appear in the public feed; follower-only posts appear to followers in Following, while private posts and posts from private profiles remain author-only. Sign in to post or follow. Making a profile private hides it and its posts from other accounts, including previous followers. The editor supports Markdown formatting, code blocks, previews, and external public HTTPS image URLs, without upload controls. External images contact their hosting site when viewed.

Guest domains use their own storage. The first local account can adopt guest records; other accounts do not inherit them. Home and Domains always show the table, including its empty state, with no account gate.

`ai/skills/structure/structure.md` documents the reusable folder tree and imports. The numbered guides in `ai/skills/` and AGENTS.md are portable to another repository and keep application-specific schemas out of shared instructions.

## Web and mobile publishing

The current web deployment is [domains-database.vercel.app](https://domains-database.vercel.app/) in the Piratechs Vercel team. `vercel.json` builds Expo's server output, serves client assets, and sends page/API requests through `api/index.ts` using the Expo Node adapter. The function has a 240-second limit for the existing bounded registrar requests. `.vercelignore` excludes local `.env` files from uploads; no registrar keys are configured in Vercel.

To redeploy the current working tree, run `npx vercel deploy --prod --scope piratechs` after linking with `npx vercel link --project domains-database --scope piratechs`. The GitHub repository is connected; commit the deployment configuration before relying on deployments from future pushes. Use Node 22.13 or later for Expo. See [Expo's Vercel adapter guide](https://docs.expo.dev/router/web/api-routes/#vercel).

Use the `development` branch for active iteration. Commit and push changes to `origin/development` for Vercel Preview deployments, or run `npx vercel deploy --scope piratechs` on that branch. Keep using the stable branch preview URL so browser storage persists across deployments at that address.

Hosting does not change persistence: accounts, domains, and private connection values still live in this browser's storage. The Vercel origin has separate storage from localhost; use CSV import/export for portfolio migration and enter connection values again. This remains a device-only demo until the production authentication, database, and secret-storage work in `firestore-plan.md` is implemented. No custom-domain DNS changes were made.

The web app uses Expo server output so registrar API routes can run. Restart `npm start` after changing this configuration. When you are ready to package it, `npm run export:web` writes client and server artifacts to `dist/`. Deploy the Expo server with an appropriate runtime; serving only static files from Apache cannot run the registrar relay. Production native builds need the deployed HTTPS server URL in the `expo-router` plugin's `origin` setting. See [Expo API route deployment](https://docs.expo.dev/router/web/api-routes/).

`eas.json` supplies preview and production profiles for a future Expo EAS mobile build. Store publication still needs your Expo project, signing credentials, final app icons, and store details.

The earlier social and account-storage update passed TypeScript checking and 23 focused local-service checks. The October 2, 2026 Vercel deployment passed the production export and server-entry compilation, HTTP checks for eight pages, invalid-input/no-store checks for all three API handlers, and a cross-origin rejection check. The landing and Search pages rendered in Chrome without console errors; Vercel reported no runtime errors. Live registrar credentials were not exercised during deployment. Existing worklets peer-dependency and Node engine-range warnings remain in the build log.
