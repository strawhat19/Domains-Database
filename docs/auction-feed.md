# Free Auction Feed

## Using The Page

`/auction` is publicly browseable from the main navigation. Choose **Load Free Auctions** for GoDaddy's public Most Active inventory, then use the existing name, extension, price, bids, age and closing-time filters. **Refresh Free Auctions** checks the current cached feed. The page displays the provider's build time separately from the server fetch time and the next eligible upstream check.

**Saved Inventory** opens the current account/device's existing imports. **Reload Saved** reloads that snapshot. Importing still accepts an unzipped GoDaddy JSON file and replaces only saved inventory. **Show Preview** remains an explicit fictional demonstration. Public feed results never overwrite saved inventory, portfolio domains or account settings, and do not create per-user Firestore copies.

Refresh failures keep the last successful public snapshot visible, with an error and its original dates. Failed first loads show an explicit error with a retry action. They do not load fictional records. Known ended listings are excluded on the server; the page also ages out known closings once per minute while displaying the feed. Unknown values remain unknown. The provider listing opens for bidding and purchasing; the app does not submit bids or buy domains.

## Source And API

- Source: [GoDaddy Auctions inventory](https://inventory.auctions.godaddy.com/).
- Fixed archive: `https://inventory.auctions.godaddy.com/most_active_feed_all.json.zip`.
- Format: one JSON file containing `meta.lastBuildDate` and a `data` array. GoDaddy documents [downloading inventory](https://www.godaddy.com/help/download-inventory-files-for-godaddy-auctions-41284), and its [metadata](https://inventory.auctions.godaddy.com/metadata.json) lists available files.
- Application endpoint: `GET /api/auction-inventory`, implemented by an Expo API route using the existing Node server adapter. It accepts no caller-selected URL or query parameters and needs no account or provider key.

Implementation uses the existing GoDaddy importer for domain normalization, supported auction types, USD amounts, dates, safe listing links and available provider metrics. Public IDs are deterministic source references such as `godaddy:example.com`; these transient external listings do not allocate app-owned record numbers. Saved imports retain their existing numbered app-owned IDs.

The public archive was downloaded and read to establish its real format during implementation. No application endpoint, browser, test or build was run. That source lookup does not establish deployed connectivity.

## Cache And Limits

The server shares a pending request and a confirmed 15-minute in-memory cache. Concurrent requests in one process reuse the same download. Server restarts and separate function instances can each fetch independently. There is no durable global cache or scheduled job. Refresh is user-initiated; passing the next-check time makes a new source request eligible on the next load.

Successful responses are CDN-cacheable for up to 60 seconds, capped by the remaining upstream cache window and the nearest known closing time. Browser responses require revalidation. The original `fetchedAt` stays unchanged when cached results are served. Failed loads return an explicit non-cacheable error; expired cache contents are not silently returned as a fresh success.

| Boundary | Limit |
| --- | --- |
| Upstream request | 12 seconds |
| Compressed archive | 2 MiB |
| Uncompressed JSON | 8 MiB |
| Parsed source rows | 10,000 |
| Application response | 3,500,000 UTF-8 bytes |
| Client request | 20 seconds |
| Client response reader | 8 MiB |
| Display page | 25 rows |

The response contains `totalCount`, `skippedCount`, `endedCount` and `limitedCount`; their sum with the returned row count describes source coverage. The size cap can omit a suffix of eligible source rows, with that omission disclosed in the page. The output budget stays below Vercel's documented [4.5 MB Function payload limit](https://vercel.com/docs/functions/limitations#request-body-size). Empty valid source arrays are successful empty feeds; nonempty unsupported feeds are errors.

ZIP processing supports a single bounded stored or deflated JSON member, validates central/local headers, sizes and CRC32, rejects unsupported/encrypted/multipart/ZIP64 archives, and never extracts files to the filesystem. Download redirects are rejected. Client responses validate record identity, source, URLs, amounts, dates and coverage before display.

## Deployment Scope

Deploy the updated Expo client and Node server together using the existing server-output configuration. A static Apache directory cannot execute this API. No new dependency, paid data service, database collection, Firestore rule or cloud resource is required. Server hosting/bandwidth still use the deployment's plan allowances.

Native builds use the existing `EXPO_PUBLIC_SITE_URL`/`absoluteSiteUrl` convention to call the deployed HTTPS endpoint. Configure that value for the intended deployment before creating a native release.

The changes are uncommitted and undeployed. Tests, type checks, builds, emulator runs and UI checks were intentionally left to the user under the workspace instructions.
