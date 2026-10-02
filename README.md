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

No registrar accounts, login, external domain discovery, or backend are connected. Auto-renew controls update inventory records only; change the actual setting in your registrar account. GoDaddy Auctions is a source label you can use for auction acquisitions; the app does not infer which account currently holds those names.

## Local data and future API

`src/shared/config.ts` contains the master `useLocalStorage` flag, set to `true`. AsyncStorage uses browser storage on web and device storage on mobile. Setting the flag to `false` uses an in-memory session; it does not enable a backend.

`src/api/index.ts` provides asynchronous local domain operations and a route directory. The `/api` page documents this interface; it is not an HTTP API endpoint. `src/shared/domainContext/` owns shared state. Domain records receive an app-owned ID and a monotonic integer `number`.

`useSampleData` defaults to `false`, so the portfolio starts empty and saved sample rows are removed while your own records remain. Your portfolio is not synchronized across devices. Export a CSV before clearing browser data or uninstalling the app.

`src/shared/models/Domain.ts` defines common registrar fields: provider ID/status, registration dates, lock/privacy/DNSSEC settings, nameservers, currency, and registrant details. Provider-specific values and original CSV columns stay in `meta`. Missing optional values appear as an em dash in the table.

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

This MVP needs no API keys or passwords. `.env.example` lists private placeholders for future backend integration only. When a backend is added, enter its required keys in that backend's private `.env` file. Never prefix registrar secrets with `EXPO_PUBLIC_` or put them in frontend code, local notes, or CSV files.

## Web and mobile publishing

The web app is configured for static export. When you are ready to package it, `npm run export:web` writes the web deployment files to `dist/`. Serve those files with a static host or your own Apache setup; the TypeScript source is not directly executable by Apache.

`eas.json` supplies preview and production profiles for a future Expo EAS mobile build. Store publication still needs your Expo project, signing credentials, final app icons, and store details.

No tests, UI verification, or build commands were run, as requested in `AGENTS.md`.
