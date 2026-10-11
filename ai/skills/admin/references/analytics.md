# Analytics, Runtime Reports, And Identity Icons

Read this for requested traffic/observability work with [Admin](../admin.md) and [the chart/layout contract](../layout.md). Reporting source, provider capability and actual freshness remain visible.

Mount @vercel/analytics once through its supported web framework entrypoint and enable Web Analytics on the intended linked project. Use @vercel/speed-insights when requested. Collection and protected report querying are separate; do not introduce a duplicate tracker or raw Firestore traffic store merely to display existing reports. [Analytics SDK](https://vercel.com/docs/analytics/package)

## Typed Report And Server Contract

Keep website traffic, platform runtime, and business data as distinct typed reports. A normalized report includes source/provider, dataset, authorized environment, requested/effective UTC range, fetchedAt/generatedAt, cache age, warnings/capabilities, exact totals or null, time buckets, breakdowns, applied filters, and result coverage. Unavailable metrics retain null rather than artificial zero. Capture the actual provider response version in the adapter.

Analytics collection runs once in the supported web shell, uses the installed framework entrypoint, and scrubs personal query/path/event values. Native app activity requires its own chosen transport; rendering native reports does not make the web SDK collect native sessions. Model signed-in users, feature records, form conversions, pageviews, visitors, invocations, and runtime requests independently. Count a submission conversion only after confirmed persistence and without its personal fields.

Preserve the provider's anonymous visitor definition and any identity reset behavior; an exact provider total is not a count of persistent distinct people or an attribution to Firestore accounts. Do not join anonymous traffic to private profiles or submissions without a separately implemented permitted attribution service.

Private server routes validate method/body/query, verify Firebase ID tokens, resolve current active account/capability, select a fixed server-owned project/team scope, and then request provider data. Missing/expired identity is unauthenticated, denied capability is forbidden, missing setup is unavailable, and upstream/rate/plan/timeout failures remain distinguishable. Apply no-store/private response policy to protected reports and provider errors; authorize before reading any shared report cache. Never accept an arbitrary provider URL, Vercel project, owner, or bearer token from a report filter.

Key short caches and in-flight deduplication by authorized project/environment, effective range, filters, dimension/metric and adapter version. Respect configured freshness and request budgets, cap concurrency, abort stale client work, and prevent old account/filter results from returning to the screen. Refresh must visibly fetch/revalidate according to its documented policy; it must not merely change a spinner. A stale previously confirmed report can remain visible with its original range/source/error label while a permitted retry runs.

## Traffic Query Map And Range Semantics

| Display | Provider Group/Source | Correct Meaning |
| --- | --- | --- |
| Period Visitors/Page Views | Exact period count or one whole-period aggregate group | Provider-defined period visitors and total views; never sum daily unique visitors |
| Daily trend | day | Per-bucket visitors/views with actual UTC dates |
| Countries | country | Supported two-letter code plus resolved local country identity |
| Sources | referrerHostname | Actual source/host; direct/unknown/Others remain distinct |
| Pages | requestPath or route | Exact path versus framework route pattern are separate meanings |
| Devices | deviceType | Normalized desktop/laptop/mobile/tablet/unknown identity |
| Other dimensions | Verified browserName/osName/UTM/flags capability | Expose only supplied supported metrics/filters |

The documented visits aggregate endpoint is /v1/query/web-analytics/visits/aggregate; count is /v1/query/web-analytics/visits/count. Since/until select inclusive endpoints; aggregate by/limit/filter behavior must follow the current contract. Use URLSearchParams and properly escaped allowlisted OData literals instead of concatenating a caller's raw expression. Provider top-N results can contain Others, which is a coverage group rather than a country, hostname, or navigable page. [Aggregate reference](https://vercel.com/docs/rest-api/web-analytics/aggregates-page-views), [count reference](https://vercel.com/docs/rest-api/web-analytics/counts-page-views)

Each report has explicit UTC start/end day boundaries and an effective valid date range. From/To inputs remain draft until Apply; reject invalid/reversed/future/out-of-window ranges according to documented policy. Presets use the same boundary helper. Comparison uses the immediately preceding equal-length interval with no overlap. Treat a partial current day and provider retention gaps honestly. Return effective/clamped range metadata when provider limits change the request.

Do not label an undated lifetime count as a selected-period KPI. When a whole-period exact total cannot be obtained, show unavailable or a specifically labelled approximation and explain its coverage. Breakdown visitor totals are not necessarily additive across paths/days; rankings cannot be used as unique period totals. Percentages use the selected metric and an actual compatible denominator. A zero previous value produces a defined New/Unavailable comparison label rather than Infinity or a fabricated percentage.

Maintain normalized bucket keys/time positions. Fill a missing bucket with null unless a successful source contract proves an omitted bucket means zero activity. Comparison buckets align by relative position and retain their own dates. Status changes from stale/unavailable to error must not silently change the selected range. Exports include actual filters, ranges, units, source/freshness/warnings, nulls, coverage and comparison data; no tokens, private record details, or unrelated provider payload.

## Shared Country, Source, Device, And Page Identities

Use one safe resolver for every segment in compact/full reports, Overview/rankings, Chart/Bars/List, filter chips, and native views. Its result identifies the stable key, readable label, raw caption, allowed local asset/icon, and applicable filter action. Keep metric calculations independent of label/asset resolution.

| Input | Resolver Behavior |
| --- | --- |
| Country | Trim/normalize case, resolve supported code from codes.json, use readable localized name where supported, retain upstream extra codes |
| Country aliases | Explicit provider mapping, such as UK to GB, only when semantics are confirmed; unverified names do not generate guessed asset paths |
| Unknown/direct/Others | Neutral distinct sentinel identity; never resolve Others as a country/source or activate an invalid filter |
| Mobile/tablet | Corresponding installed mobile/tablet icon |
| Desktop/laptop | Corresponding installed desktop/laptop icon; preserve whichever distinction the provider actually supplies |
| Device aliases | Normalize supported phone/smartphone/computer/PC values deliberately, retaining raw data and unknown combined-device fallback |
| Referrer source | Parse supported URL/hostname, remove www where appropriate, match exact known hosts or true subdomains |
| Page | Normalize supported pathname safely, match canonical/alias route at segment boundaries, prefer longest match; retain raw path/pattern |
| Asset failure | Same category's neutral icon and real label; reset image-error state when the identity changes |

Known brand registry covers Google, Bing, DuckDuckGo, GitHub, Vercel, Facebook, Instagram, LinkedIn, Pinterest, Reddit, TikTok, WhatsApp, X/Twitter, and YouTube. Support known aliases/hosts deliberately, including provider referral redirect hosts only when mapped. A hostname merely containing google or reddit is not that brand; explicit domain-bound checks prevent misleading matches. Direct traffic uses the link icon, unknown sources a globe, unknown page a document, unknown country a location, and unknown device a combined-device glyph.

Use the complete local vendored country catalog, not a shortlist or emoji fallback. Preserve extra-code manifests, upstream pinned provenance and license notices. Use brand SVGs as safe local images/masks with registry color or currentColor policy; do not fetch arbitrary favicons or turn saved source text into an SVG path. Country codes and brand slugs must be allowlisted catalog keys, never unchecked path fragments.

Keep flags at 24 x 18 with 4:3 ratio, 2 px corners and themed border; glyph slot 20 x 20 with 15 px icon; brand mark 18 x 18 inside the slot. Keep slots flex-none. Icons beside labels are decorative, with empty image alt/aria-hidden; accessible row names include label, metric/unit, useful raw caption, and real filter action. Native uses supported local SVG/image/icon rendering and literal static asset mappings rather than dynamic require strings. Follow [the layout contract](../layout.md#analytics-identity-icons).

The source bundle lives in ../assets/analytics/ relative to this reference. Copy artwork and notices into a supported public/bundled output path and resolver metadata into an importable source path; ai/ is not an automatically served URL. Do not change bundler configuration or add a second icon library simply to copy reference JSX. Country/source/device icons persist when toggling Chart/List, changing compact/full tabs, expanding Top/All results, or switching theme/platform.

## Controls, Ranking, And Inspection

Full and compact panels share typed report controls within their relevant ranges. Traffic supports Overview/Daily/Countries/Sources/Pages/Devices, Visitors/Page Views, period selection, Chart/List, compatible comparison/percentage/area/inspection toggles, removable filter chips, Clear Filters, Refresh, and real JSON export. Source/category row selection applies the correct typed filter; Other/unknown coverage rows are only clickable when the provider supports that exact filter.

Use actual raw keys for filter values, friendly names for display, and page-only versus server-filtered search coverage labels. Top-N/expanded rows never change whole-period KPIs or erase Others; preserve result truncation and source limits. Reset incompatible filters/search/metric when changing dataset or view rather than sending invalid provider queries. Keep empty filtered results distinct from No Data and upstream failure.

Runtime supports Compute/Memory/Requests/Latency/Routes/Statuses/Cache only where discovered capability supplies them; use 24 Hours/7 Days/30 Days as supported by the effective window. Metric selections carry real units and available aggregation; route rankings, status distribution, error rates and cache summaries each retain compatible denominators. Application activity is not runtime traffic.

Chart selection defaults to the latest bucket, works by pointer/tap and accessible slider, retains explicit selection on leave, and exposes timestamp/value/unit or No Measurement. Preserve null gaps in line/area plots and the same time positions in the list. Tabs implement keyboard roving focus; chart/list/inspection controls have descriptive IDs and names. Use exact responsive dimensions, layout heights, sticky table headers, motion/reduced-motion and container breakpoints from [layout](../layout.md).

## Runtime Provider Compatibility

Prefer officially supported interfaces available to the configured project. Discover metric catalog, dimensions, units, aggregations and entitlements before constructing queries. The current CLI supports vercel metrics schema and JSON output; platform metrics beyond Web Analytics and Speed Insights require their applicable Observability entitlement. Recheck the actual plan rather than hardcoding pricing/retention into UI. [Vercel metrics](https://vercel.com/docs/cli/metrics), [Web Analytics plan limits](https://vercel.com/docs/analytics/limits-and-pricing)

If a server adapter follows an official CLI implementation such as /metrics/v1, record its reviewed installed version/source, validate the catalog/query/response shape, and treat it as a compatibility adapter rather than a promised public REST contract. Unsupported fields/catalog/plan states remain visible; a provider permission error must not become a random healthy runtime chart. Trusted scheduled ingestion into private summaries is an alternative with explicit source/freshness.

Keep raw logs/traces and credentials out of normal reports. Drains verify signatures on raw bytes, project/environment scope, payload size/schema and retry deduplication before aggregate writes; preserve retention, sampling and failure state. Runtime percentile, percentage, memory and CPU metrics use their documented units/aggregation rather than averaging averages or inventing total host uptime. Keep custom application metric emission independent of provider querying. Provider polling/ingestion is not automatically as live as a Firestore subscription.

## Validation, Import, And Browser/OS Dimensions

Reject unknown or repeated query parameters, incompatible preset/custom range modes, malformed dimension values and unsupported filter combinations. Preserve empty/default selection semantics explicitly. A practical traffic range cap is 90 inclusive days with its preceding comparison inside the supported historical window; derive actual retention from current provider access instead of assuming a year is guaranteed. Cap token/header lengths, request timeouts and report concurrency in the destination's server policy.

Browser and OS identities are separate from device type. Normalize known provider values through an explicit installed-icon/local-asset registry, keep readable original labels, and use neutral browser/system fallbacks when unsupported. Do not infer a visitor's browser/OS/device from a source logo, user account, or country. Only add those dimension tabs when the source actually returns them.

Report controls have deliberate persistence: project/environment and account scope for private preferences, stable versioned keys, valid selected metric/view/filter/range hydration, and reset of incompatible saved values. Cached user controls never confer data access. Keep business-window summaries independent of traffic segment filters unless an actual attributed conversion service exists.

Import/sync is optional and separate from JSON export. When explicitly requested, validate schema/version, actual project/environment, source range/timezone, dimension keys, numeric/null semantics, and source provenance. Define a deterministic source/range/bucket/dimension identity and overlap/upsert policy; repeated or overlapping imports must not double-count. Persist private ingestion status with last successful sync, effective coverage, failure and source update time. Do not turn local uploaded JSON into a claim of live Vercel access or add a raw Firestore traffic collection when direct authorized reports already satisfy the task.
