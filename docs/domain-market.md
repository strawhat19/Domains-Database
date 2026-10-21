# Free Domain Market Research

The shared Domain Analytics dialog includes two independent, on-demand tools:

- Ahrefs Domain Rating: current backlink strength on a logarithmic 0–100 scale.
- Google Trends through SerpApi: relative search interest for one editable phrase, one country, and the past 12 months.

Search results, auction listings, watching rows, domain cards, and the portfolio table's Analytics icon open the same dialog. Registration/DNS failures do not hide the research panel. Opening the dialog, rendering rows, changing a phrase, and choosing a country do not request either research provider. There is no background polling or paid fallback.

## Free Account Setup

Set these private variables in ignored `.env.local`, or merge them into the existing ignored `.env` without overwriting its other values:

```dotenv
AHREFS_FREE_API_KEY=
SERPAPI_API_KEY=
```

1. Create a [free Ahrefs account](https://ahrefs.com/), then generate a free APIv3 key in Account Settings → API Keys. Only [`GET /v3/public/domain-rating-free`](https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free) is called. No paid Site Explorer/traffic endpoints are used. The displayed score retains the linked **Domain Rating by Ahrefs** attribution required by its [license](https://ahrefs.com/legal/domain-rating-license).
2. Create a [SerpApi Free account](https://serpapi.com/pricing) and copy the key from Your Account. The currently published free allowance is 250 successful searches per month, shared across this app's users and any other use of that account. No paid subscription or extra-credit purchase is needed.
3. Restart the Expo server after changing local variables. For hosted use, configure both as private environment variables and deploy the updated app and Expo Node server together. Never prefix either key with `EXPO_PUBLIC_`, put it in client configuration, or paste it into Profile Connections.

Before every uncached Trends search, the server calls SerpApi's [free Account API](https://serpapi.com/account-api). It requires a numeric `plan_monthly_price` of zero, `extra_credits` of zero, and at least one remaining `plan_searches_left`. Missing/unrecognized account fields, paid plans, extra-credit balances, or exhausted free searches stop the lookup. Account responses, email addresses, keys, and raw provider errors are never sent to the client. There is no automatic upgrade, top-up, purchase, or alternate paid endpoint.

Without keys, each tool reports that setup is needed when selected. The external Google Trends research link works without app API credentials and opens the currently entered phrase and region on Google's site. This link does not fabricate an in-app chart or establish API connectivity.

## Meaning And Coverage

The [SerpApi Google Trends adapter](https://serpapi.com/google-trends-api) requests a single phrase with `TIMESERIES`, `today 12-m`, English labels, UTC, and the selected region. Supported regions are Worldwide, United States, United Kingdom, Canada, Australia, and India. The phrase initially comes from the domain's first label, replacing digits and hyphens with spaces; users can edit it. The app does not guess how to split concatenated brand names.

Search-interest values are normalized 0–100 for that query, region, and period. They are not monthly search counts, visitor totals, revenue, or domain valuations. Separate charts have separate normalization and cannot establish an absolute demand ranking between domains. Empty/all-zero series are reported as insufficient data. Malformed responses and provider failures remain unavailable instead of becoming zero.

Domain Rating is backlink strength, not measured traffic, search demand, or a guarantee of ranking. A valid returned rating of zero remains visible. Imported auction metrics remain separate source snapshots; available monthly volume/CPC/traffic labels retain their original inventory provenance. Existing PageSpeed scores and Tranco ranks retain their existing meanings. No Google Analytics or Search Console connection is added by this change.

## API And Caching

`POST /api/domain-market` accepts only JSON:

```json
{ "provider": "ahrefs", "domain": "example.com" }
```

```json
{ "provider": "serpapi", "domain": "example.com", "keyword": "example", "country": "US" }
```

Use an empty country string for Worldwide. Arbitrary provider URLs, unknown fields/query parameters, comma-separated comparison phrases, unsupported countries, invalid domains, and oversized inputs are rejected. The endpoint supports public domain research; it neither reads private account data nor writes Firestore.

The existing Expo Node runtime performs the provider requests. Fixed HTTPS endpoints, redirect rejection, bounded response parsing, safe error messages, origin checks, timeouts, and a two-request concurrency limit constrain the relay. Input bodies are limited to 1,024 bytes and upstream responses to 256,000 bytes. Client responses are limited to 128 KiB.

Confirmed results and insufficient-data outcomes are cached for seven days in a bounded 512-entry server memory cache. Identical in-flight requests share one lookup; Trends cache keys include the phrase, country, fixed range, and credential identity so the same phrase can be reused across domains. Temporary failures have a 60-second cooldown and quota failures a five-minute cooldown. Fetch dates and expiry metadata retain their original values; selecting Analyze again within the cache window reuses that result.

Client memory caches hold up to 128 entries per provider and never outlive server expiry. No domain model migration, local storage, new database, or Firestore rule/index deployment is required. These are instance/session caches: server cold starts, separate instances, browser reloads, and cache eviction can lead to additional lookups. They are not a durable global monthly quota counter. SerpApi's own free-plan allowance and the account preflight remain the usage boundary.

Native builds use the existing `EXPO_PUBLIC_SITE_URL` setting to reach the hosted `/api/domain-market` endpoint. A static Apache/XAMPP document root alone cannot run Expo API routes; the existing Expo server or deployed Node adapter is required.

## Completion And Connectivity

The source includes the server adapters, typed client facade, web/native controls, chart, source dates, configuration example, and integration into Domain Analytics. No provider accounts, keys, subscriptions, cloud resources, deployments, or paid services were created. Provider credentials and live connectivity have not been exercised. Per the workspace instructions, no tests, typechecks, builds, or UI checks were run; changes remain uncommitted for review.
