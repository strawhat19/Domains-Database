# Adopt Traffic And GitHub Reporting In Another Project

Use this for a focused reporting request after copying `ai/` and `AGENTS.md`, or as the reporting part of connected-account/full-app adoption. Apply the [analytics/server contract](analytics.md), [GitHub contract](github.md) and [layout](../layout.md). Reuse the destination's working modules and framework. Implement the requested reporting and its necessary authorization/server boundaries without adding unrelated starter modules.

## Map The Destination Before Connecting Reports

Resolve available values from the destination's code, theme, route registry, Git remote and authorized hosting configuration. Ask only for unresolved or conflicting choices that affect scope. Record concrete bindings in project docs/configuration outside `ai/`.

| Concern | Destination Mapping |
| --- | --- |
| Appearance | Existing light/dark palettes, semantic ink/muted/accent/surface/border/status tokens, fonts, spacing, radii, density, loading styles and reduced-motion behavior |
| Navigation | Existing account shell, measured header/sidebar, route metadata and available Analytics/runtime paths; preserve aliases and narrower policies |
| Identity/access | Current auth/session provider and authoritative active Owner capability; protect menu, direct view, services and server/cache reads consistently |
| Website traffic | Intended analytics provider, hosting project/team or equivalent site/property, canonical host, selected environment and actual report entitlement |
| Repository | Intended GitHub owner/repository, confirmed against Git and hosting connections; never derive it solely from the display name |
| Server transport | Actual private API/function runtime, credential loader, authenticated client transport and any native hosted API origin |
| Artwork | Served/bundled output paths, installed icon library, local catalogs/notices, resolver metadata and native asset mappings |

A reused token may access several projects or repositories; each adapter still binds this destination's own scope. Do not reuse another app's repository, hosting IDs, analytics property, origin, filters, counters, metric values, screenshots or cached responses. Preview, production and local activity remain distinct where the provider supports that distinction. Document any provider limitation that prevents separation.

## Connect Collection And Reports

Reuse one existing website analytics collector, or install the selected provider's supported collector once in the web shell. Adapt SPA route tracking and privacy handling to the destination; native rendering does not make a web collector collect native sessions. Existing working collection and custom reports should not be replaced solely to match a reference implementation.

Bind protected traffic/runtime adapters to the selected project/site/environment and GitHub reporting to the selected repository. Resolve current provider permissions, API capabilities, retention and plan limits before constructing requests. Collection, dashboard read access and runtime metrics are separate capabilities: a working collector does not prove the custom report API can read its data.

Use the destination's existing private server credential names where established. Add secret-free example variable names and per-environment setup instructions outside `ai/`; keep real values in the authorized private runtime environment. Follow [GitHub credential reuse/setup](github.md#reuse-or-create-a-reporting-credential) for an existing classic PAT or multi-repository token. Reuse the user's identified local source only within their authorization, and distinguish local loading from hosted secret configuration and deployment. Complete source and setup guidance even when a provider capability remains unavailable; show the actual missing prerequisite.

## Preserve Behavior And Adapt The Visual System

Use **Traffic** and **GitHub** tabs on Analytics when the repository is identified. Runtime keeps its separate existing **Health**, **Usage** or **Observability** destination. Put the active tab's Refresh/Export JSON actions once in the heading. Reuse shared date/metric controls, Chart/List inspection, UTC timelines, null gaps, ranking bars, appropriate donuts, source/freshness/coverage and responsive loading states from the detailed contracts.

Traffic includes the supported overview/daily/country/source/page/device views, real provider filters and meaningful metric totals. GitHub includes repository identity/current counters, scoped commits/views/clones trends, language/author rankings, published release versions/asset downloads and recent commits. Retain available data when a section fails and disclose unsupported metrics instead of filling charts with invented values. Keep independent dataset state and reject stale responses after account, project, range or filter changes.

Map these behaviors to the destination's semantic theme tokens and installed components. Keep its colors, fonts, logo, product labels and surface hierarchy; do not paste a reference app's hardcoded teal/ivory/dark palette or font stack. Match the destination in light/dark mode, compact/full panels, skeletons, hover/focus/selection states and native style objects. Data-key/brand colors may identify actual countries, sources or languages; they do not replace readable names, values or accessible state.

Place relevant decorative visuals to the left of readable labels across cards, headings, chart controls/readouts, ranking legends and lists. Use the combined bar-and-trend Analytics icon, country flags, source brands, device/page glyphs, GitHub/language marks, supplied validated contributor avatars and metric/release/commit icons from the focused contracts. Copy/adapt the complete [local artwork bundle](../assets/analytics/) with notices or reuse equivalent installed catalogs. Keep resolver metadata importable from source, allowlist asset keys, and create supported static native mappings; files under `ai/` are not automatically served or bundled. Missing artwork and avatars retain themed code/person/initial/category fallbacks.

Avoid pulling an entire icon catalog into a development bundle for a few labels. Prefer the destination's supported individual imports or import optimization while preserving aliases/types and public package entry points. Check its existing bundler and deployment packaging before adding build helpers. Keep any machine-specific heap limits, worker counts or local startup workarounds in that project's configuration/docs rather than imposing them on every copied pack.

## Completion And Handoff

Provide the implemented/reused reporting modules and a project-specific setup map outside `ai/`: provider/site/project/environment, repository, route/transport, credential variable names, required access/plan, artwork paths and remaining prerequisites. Do not include secret values. Include the actual effective ranges, retention, freshness/cache/refresh behavior and metric meanings in typed reports and exports.

Distinguish source completion, configured credentials, actual provider connectivity, deployment and observed rendering. Follow `AGENTS.md` for checks and live changes. When checks are authorized, review the destination binding, authorized/denied account flow, report values/coverage, Refresh/Export, icon fallbacks, theme changes and supported web/native behavior; do not claim those outcomes from copied instructions or source inspection alone.
