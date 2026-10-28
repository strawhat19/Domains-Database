# Responsive Hierarchical Lists

Read this when a requested list combines records, groups, apps, collections, nested expansion, favorite/star filters or compact facet summaries. Reuse the destination's actual hierarchy and shared state; a layout fix does not authorize a new data model or a wider refactor.

## Empty States And Expansion

Choose onboarding from the confirmed underlying dataset, including grouped and directly contained records. An empty ungrouped section, collapsed container, hidden record, filtered projection, loading state or read failure does not prove the account has no records. Keep first-use, no matches, no records in this section, loading and denied/error states distinct across screen sizes.

Omit an empty synthetic ungrouped/root section when real collections or groups already contain the records, unless the requested manager needs that empty destination. Keep meaningful empty user-created containers and filter/visibility recovery controls available. Render column names when the relevant expanded table actually exposes record rows; avoid an orphan header above only collapsed container cards. Preserve the existing loading behavior and any wrapper/ref needed for width measurement or sticky positioning when hiding its visual content.

Derive visibility from the actual content container and the shared expansion projection. A desktop sidebar or pane can change available width without changing viewport breakpoints. Keep web/native projections, counts and empty-state conditions aligned rather than building a separate mobile interpretation of the dataset.

## Starred Containers And Visible Context

Use one mutually exclusive All / Starred / Not Starred value for advanced controls and quick filters. Include supported records and containers in the matching model; do not silently limit a requested hierarchy filter to leaf records.

Keep saved stars separate from derived container matches. For the requested behavior "a container with any stars shows all its records," aggregate the relevant direct and descendant stars, then include the matching container's eligible subtree. This is a view projection: do not persist stars onto siblings or ancestors. Preserve other search, facet, ownership and visibility constraints when including contextual descendants.

Retain parent structure needed to display matched records and explicitly matching empty containers where the existing product supports them. Define Not Starred against the intended matching entities; adding contextual descendants can make the two displayed leaf sets overlap. Do not assume visible Starred rows and Not Starred rows must partition the source dataset. State which badges count explicit/aggregate matches, visible records or all eligible items, deduplicate by stable ID, and do not call every contextual row starred.

## Compact Filter Rows And Labels

Share selected values and counts between advanced filters and their quick controls. Respect the requested visual order and row budget. When a summary must stay within two rows, give each row its own nonwrapping layout and contained horizontal overflow rather than allowing a third wrapped row. Ensure individual pills do not shrink into unreadable controls, and keep focus outlines visible inside the scroll region.

Shorten status/favorite/attention pills to an icon and count where needed, retaining a full accessible name, tooltip where supported, selected state and a reachable reset or advanced-filter control. Short labels and visible/total counts must preserve their units and coverage; formatting cannot change the underlying count or hide an unavailable state. Keep configurable ordering and concrete breakpoint values in destination code rather than copying one app's categories or pixel thresholds into this contract.
