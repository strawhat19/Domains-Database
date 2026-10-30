# Domains Portfolio Pagination

The `/domains` portfolio now renders 50 expanded domain rows at a time, with 25, 50 and 100 per-page choices. Web has Previous/Next controls above and below the records; native has controls above the records. Using the bottom web controls returns focus and scroll to the top pager, respecting reduced-motion preferences. Compact landing-page previews keep their existing limits.

## Rendering Boundary

Paging runs after the existing search, facets, star-container projection, grouping, hidden-record settings and expansion state. Desktop follows the configured Database/Collections order; mobile and native retain their main-records-first order. Collapsed descendants do not consume page slots. Web retains closing rows for the existing 240 ms collapse transition, then unmounts them; reduced-motion mode releases them immediately. Native group rows remain through the existing close transition.

Only domain rows/cards are paged. Full container headings, counts, descriptions, copy actions and move destinations remain available, so a group with off-page records does not become an empty group. Container headings and the existing domain-link pills in collapsed headings are not themselves limited by the domain page size.

Search and filters still cover the complete loaded portfolio. The active page resets when the query, relevant filters, sort/view or ordered expanded record IDs change, including expansion, deletion, moving and synchronization that changes those IDs. Record-only edits that leave this identity/order unchanged retain the page. Page-size changes return to page one.

Selections persist across pages. Select All, visible selection counts and Shift selection use the current page. Bulk actions retain the full explicit selection. Copy, CSV export, totals and reorder validation continue using their existing full datasets; changing pages does not truncate saved data or exports.

The web renderer also builds each group's reorder ID list once per group instead of allocating it for every domain row.

## Data Loading And Limits

This is client-side rendering pagination. The current portfolio API stores/loads a complete serialized portfolio snapshot, so this change does not reduce storage reads, network transfer, record normalization or full-dataset search/filter work. A server-side page API would require a separate storage/data-model change and a design for full-portfolio summaries, search, grouping, exports and ordering.

The expected gain is fewer mounted rich domain controls, layout observers and row elements for larger portfolios. No measured performance improvement is claimed.

## Review Status

Implementation received source review only. No tests, compiler/lint checks, build, UI session or performance benchmark was run, following the requested review-first workflow. Nothing was committed or deployed.

Suggested manual review: more than 100 ungrouped domains; mixed collections/groups/apps; table/grid/mobile/native; page-size changes; search and Starred/Not Starred context; collapse/expand; cross-page selection; moving/deleting records; copy and CSV export.
