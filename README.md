# Domains Database

Domains Database is a frontend domain inventory built with Expo, React Native, TypeScript, and Sass. The landing page uses the v8 logo and opens with a compact sample portfolio. The full portfolio brings records from Hostinger, GoDaddy, GoDaddy Auctions, and Namecheap into one device-local list.

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
- Clearly marked fictional sample records and loading skeletons
- About, Terms, Contact, Privacy, and a local API directory page
- Mobile screens and EAS configuration for future native builds

No registrar accounts, login, external domain discovery, or backend are connected. Auto-renew controls update inventory records only; change the actual setting in your registrar account. GoDaddy Auctions is a source label you can use for auction acquisitions; the app does not infer which account currently holds those names.

## Local data and future API

`src/shared/config.ts` contains the master `useLocalStorage` flag, set to `true`. AsyncStorage uses browser storage on web and device storage on mobile. Setting the flag to `false` uses an in-memory session; it does not enable a backend.

`src/api/index.ts` provides asynchronous local domain operations and a route directory. The `/api` page documents this interface; it is not an HTTP API endpoint. `src/shared/domainContext/` owns shared state. Domain records receive an app-owned ID and a monotonic integer `number`.

The initial sample portfolio is created only when no saved portfolio exists. Your portfolio is not synchronized across devices. Export a CSV before clearing browser data or uninstalling the app.

## CSV format

Use the import control with a CSV containing a domain name, registrar, and expiry date. Owner, auto-renew, price, and notes can also be included. A template is available at `public/domain-import-template.csv`.

```csv
domain,owner,registrar,expiresAt,autoRenew,renewalPrice,notes
example.com,Your Name,Namecheap,2027-10-01,true,14.98,Replace With Your Domain
```

Dates use `YYYY-MM-DD`. Registrar labels are `Hostinger`, `GoDaddy`, `GoDaddy Auctions`, or `Namecheap`. Duplicate names and invalid records are rejected with a message. Exported values are quoted and protected against spreadsheet formula execution.

## Credentials

This MVP needs no API keys or passwords. `.env.example` lists private placeholders for future backend integration only. When a backend is added, enter its required keys in that backend's private `.env` file. Never prefix registrar secrets with `EXPO_PUBLIC_` or put them in frontend code, local notes, or CSV files.

## Web and mobile publishing

The web app is configured for static export. When you are ready to package it, `npm run export:web` writes the web deployment files to `dist/`. Serve those files with a static host or your own Apache setup; the TypeScript source is not directly executable by Apache.

`eas.json` supplies preview and production profiles for a future Expo EAS mobile build. Store publication still needs your Expo project, signing credentials, final app icons, and store details.

No tests, UI verification, or build commands were run, as requested in `AGENTS.md`.
