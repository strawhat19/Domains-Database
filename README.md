# Domains Database

Domains Database is a frontend domain inventory built with Expo, React Native, TypeScript, and Sass. The landing page uses the v8 logo and opens with a compact portfolio. The full portfolio brings records from Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap into one device-local list.

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
- 29 selectable table columns with saved browser preferences and counts of populated rows
- About, Terms, Contact, Privacy, and a local API directory page
- Mobile screens and EAS configuration for future native builds
- Local sign-up, sign-in, session restoration/expiry, and an avatar menu with sign-out
- Account-scoped portfolios, table preferences, and grouping, with a protected Profile page
- Public Home and Domains tables, including an empty table, with isolated guest records
- Home, Domains, and Community navigation, plus account Profile and Connections pages
- Private-by-default profiles, opt-in domain sharing, posts, follows, and audience-filtered local feeds
- A Markdown editor with bold, italic, code blocks, previews, and public HTTPS image URLs; no image uploads
- Three private account-scoped fields for GoDaddy, Hostinger, and Namecheap connection values
- An Owner-only Dashboard showing real device-local account counts and your own portfolio statistics

No registrar accounts, external domain discovery, or remote backend are connected. Local accounts are device-only demos. Auto-renew controls update inventory records only; change the actual setting in your registrar account. GoDaddy Auctions is a source label you can use for auction acquisitions; the app does not infer which account currently holds those names.

## Local data and future API

`src/shared/config.ts` contains the master `useLocalStorage` flag, set to `true`. AsyncStorage uses browser storage on web and device storage on mobile. Setting the flag to `false` keeps the auth screens but submission asks you to connect a backend; it does not enable one. The existing domain service retains its session-only mode for a future authenticated integration.

`src/api/index.ts` provides asynchronous local domain operations and a route directory. The `/api` page documents this interface; it is not an HTTP API endpoint. `src/shared/domainContext/` owns shared state. Domain records receive an app-owned ID and a monotonic integer `number`.

`useSampleData` defaults to `false`, so the portfolio starts empty and saved sample rows are removed while your own records remain. Your portfolio is not synchronized across devices. Export a CSV before clearing browser data or uninstalling the app.

`src/shared/models/Data.ts` owns common fields, identity, ISO timestamps, and typed color data. `User`, `Notification`, and `models/domains/Domain.ts` extend it. `common/ids.ts` generates `Type_Number_Name_11_36_PM_10_22_25_UUID` IDs; services allocate monotonic numbers and preserve identities during edits. Use `model.toRecord()` to get a plain JSON-compatible record for a future Firestore adapter. Credentials remain separate from public models.

`src/shared/models/domains/Domain.ts` adds provider ID/status, registration dates, lock/privacy/DNSSEC settings, nameservers, currency, and registrant details. Provider-specific values and original CSV columns stay in `meta`. Missing optional values appear as an em dash in the table.

First imported and first exported timestamps are saved when those actions occur and retained on later imports, edits, and exports. Existing records without history receive timestamps on their next import or export. Column counts cover the entire saved portfolio, including meaningful values such as `0` and `false`.

Domains start in alphabetical order. The button beside Columns switches between table and cards, with the view saved on this device. Monthly cost is annual renewal cost divided by twelve; selecting that column also shows the monthly portfolio total beside the yearly total. Site icons load from each domain's `/favicon.ico`, with a globe fallback.

Dark mode is the default. The saved theme is applied in the document head before the page paints. Search controls and table headings use CSS sticky positioning, with header widths and horizontal scrolling kept aligned with the table.

Use Group to organize domains by a field or create custom groups and assign their members. Manual order clears the active column sort and enables dragging and move buttons within each group. Column sorting disables manual reordering; clicking a heading cycles ascending, descending, and manual order. Group membership and manual ordering are saved locally and restored when Manual order is active. Position numbers reflect the current filtered display. Check all and Uncheck all affect the visible domains, and selection carries between table and cards.

## CSV format

Use Import CSV in the portfolio or drop one CSV (up to 5 MB) into the Add Domain wizard before reviewing it. Include domain, registrar, and expiry columns; unknown registrar or expiry values can be blank. GoDaddy exports are recognized from their export columns; the wizard supplies a registrar when the file has no registrar column. Common domain fields and extra CSV columns are retained. A template is available at `public/domain-import-template.csv`.

```csv
domain,owner,registrar,expiresAt,autoRenew,renewalPrice,notes
example.com,Your Name,Namecheap,2027-10-01,true,14.98,Replace With Your Domain
```

Dates use `YYYY-MM-DD` or ISO timestamps. Registrar labels are `Hostinger`, `GoDaddy`, `GoDaddy Auctions`, `Namecheap`, or `Squarespace`. Leave an unknown expiry or registrar blank; the record is retained and displayed as unknown. The web import wizard preserves each CSV row's registrar, including files with multiple providers. Re-importing an existing domain updates its details while retaining its app ID and saved notes. Duplicate names within one file and invalid nonempty values are rejected with a message. Export includes common fields and JSON `meta`; values are quoted and protected against spreadsheet formula execution.

## Credentials

Create your local account at `/signup`, then sign in at `/signin`. Password verifiers use PBKDF2-SHA256 with a unique salt; raw passwords are not saved in public User records. The avatar menu opens Profile and Sign Out. Every sign-up defaults to Subscriber; Owner access is assigned separately by a trusted administrator when a backend is connected, and no public form can grant it.

The first local account adopts the existing portfolio, columns, and grouping preferences. Original storage keys remain as a backup; later accounts start with their own records. Sessions expire after thirty days. Local storage is editable by someone with access to the device, so this flow is not a production security boundary or a cloud login.

Add Domain includes Connect Registrar. Guests can sign in or sign up; signed-in users open Profile → Connections. Its three fields accept `.env`-style values for GoDaddy, Hostinger, and Namecheap. Values persist separately for the current account, can be revealed, edited, or removed, and never appear in public profiles, Community, domain notes, or CSV exports. Saving these values prepares a connection; it does not call a registrar or enable automatic sync.

`.env.example` lists the same private variables for a future backend. Credentials saved through Connections remain in local browser or device storage; the frontend does not write a `.env` file. Local storage is readable by someone with access to the device. For production integration, move credentials into a private backend's environment or secret store. Never prefix registrar secrets with `EXPO_PUBLIC_`.

## Local Community

Community is shared between accounts saved on this browser or device; it is not a remote social network. Profiles start private. Profile lets each user choose Public or Private and separately opt in to showing domain names and registrars. No owner details, registration contact data, notes, prices, or credentials are included in public domain summaries.

Public profiles appear in Discover. Public posts appear in the public feed; follower-only posts appear to followers in Following, while private posts and posts from private profiles remain author-only. Sign in to post or follow. Making a profile private hides it and its posts from other accounts, including previous followers. The editor supports Markdown formatting, code blocks, previews, and external public HTTPS image URLs, without upload controls. External images contact their hosting site when viewed.

Guest domains use their own storage. The first local account can adopt guest records; other accounts do not inherit them. Home and Domains always show the table, including its empty state, with no account gate.

`ai/skills/structure/structure.md` documents the reusable folder tree and imports. The numbered guides in `ai/skills/` and AGENTS.md are portable to another repository and keep application-specific schemas out of shared instructions.

## Web and mobile publishing

The web app is configured for static export. When you are ready to package it, `npm run export:web` writes the web deployment files to `dist/`. Serve those files with a static host or your own Apache setup; the TypeScript source is not directly executable by Apache.

`eas.json` supplies preview and production profiles for a future Expo EAS mobile build. Store publication still needs your Expo project, signing credentials, final app icons, and store details.

The social and account-connections update passed TypeScript checking and 23 focused checks against the actual local services using an isolated in-memory storage adapter. No browser UI verification or build commands were run.
