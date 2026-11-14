# Responsive Table Implementation Contract

Use with [Responsive Data Tables](../SKILL.md) for column sizing, shared state, overflow, virtual rows and adoption review. These are adaptable behaviors, not one app's column schema or universal pixel breakpoints.

## One Model, Several Layouts

Keep a stable table ID and stable column IDs. The shared definition describes label, value/formatter, sorting, required/eligible visibility, content group, priority and width limits. Related subrecords retain their own stable IDs and group headings. Separate records and service state from user presentation preferences and temporary interaction state.

| State | Purpose |
| --- | --- |
| Column definitions | Canonical IDs, labels/units, render/sort behavior, required/eligible fields, groups and readable bounds |
| Saved presentation | Column order, optional visibility, preferred widths, stretch selection, compact density and field-label preference |
| Query/record state | Actual search/filter/sort/page coverage, selected record, expanded groups and current permitted actions |
| Transient layout | Container size, derived rendered widths, current row/card mode, drag/resize preview and focus |

Normalize old preferences by stable IDs: ignore unknown IDs safely, retain hidden-column order, append new eligible definitions, restore required fields and clamp invalid widths. Absence of a visibility override can use the destination's current eligible default; a permission change must not make an ineligible field visible. Required fields remain available through every presentation. Do not replace saved user choices merely because the screen became narrow.

Use the destination's existing shared state/adapter. Scope private preferences to project, account and table, and guest preferences to the documented device boundary. Do not copy another person's table preferences or silently upload guest state. Debounce or commit deliberate settings changes through the existing service; display Saving and failures truthfully. Layout width measurements are ephemeral and do not require cloud writes. A presentation-only task does not authorize a new database schema or provider connection.

## Allocate Width Intentionally

Compute the budget from the table container, subtracting real inline padding, borders, scrollbar allowance, column gaps and any fixed leading/trailing action tracks. A viewport can remain wide while a sidebar or inspector makes the table narrow.

1. Resolve each visible column's preferred width from valid saved input or a useful default, then clamp to its declared readable minimum/maximum.
2. Derive content minima from the actual headers and representative current records where useful, including badges, icons, sort indicators, currency/units, signs, formatted quantities and grouped subrecords. Protect essential numbers and actions; constrain prose independently with accessible full-value access.
3. If the sum exceeds the budget, shrink columns toward those minima using an explicit destination-appropriate priority. Preserve meaningful identity and numeric readability. If minima still cannot fit, transition to the next layout mode or use the scoped comparison fallback below; never use a page-wide overflow hack or `transform: scale()`.
4. Distribute surplus through the selected stretch/flexible columns, respecting useful caps. Keep header and row tracks synchronized and let the row surface span its container. If none are selected or all reach their caps, retain intentional surface space rather than overriding that choice or stretching fixed numeric/action tracks.
5. Recompute derived layout when the container, font readiness, density, labels, visible/order choices or relevant content changes. Avoid observer feedback loops and do not persist every live quote/content update as a new user width preference.

An automatic layout can compress below a preferred width without destroying that saved preference. If the destination offers an explicit locked-width comparison mode, preserve the user's lock and use local table scrolling instead. Make the difference visible in its settings rather than silently overriding it.

## Resize, Fit And Stretch

| Control | Meaning And Required Behavior |
| --- | --- |
| Resize | A real handle or width control updates one column's preferred width within bounds. Preview locally, commit on completion, support cancel, and keep header/body geometry identical. Separate its hit area from sorting and row clicks. |
| Fit Columns To Contents | Measure the actual formatted headers and useful available row content with the active fonts, padding, badges and controls, then save bounded preferred widths. Account for font readiness and unmounted/virtual rows through a bounded data sample or explicit loaded-data scope; measuring only one short mounted row is not full-dataset fitting. |
| Stretch | Allocate spare space to selected eligible columns, usually descriptive content or an existing visualization. Preserve a column's minimum/preferred basis; do not stretch every numeric/status/action cell indiscriminately. Multiple stretch selections share available surplus deliberately. |
| Reorder | Move eligible columns by stable ID, preserve hidden-column order and required slots, and update header/body/card ordering together. Include Earlier/Later or equivalent keyboard/touch controls when drag is provided. |
| Reset Table | Restore the declared order, visibility overrides, preferred widths, stretch selection and relevant display defaults. State what resets; never clear records, account data or unrelated query/preferences. |

For pointer resizing, use a dedicated handle, pointer capture and cleanup on release/cancel/unmount; throttle visual updates when needed and avoid a storage write for each pixel. Provide keyboard width adjustments or an accessible size control, with the column label/current width and disabled limits. State whether a manually resized column retains a stretch basis or becomes fixed; implement that choice consistently. Header double-click autosizing can supplement, rather than replace, the explicit Fit action.

Fit is a deliberate measurement action, not an alias for Equal Widths, Stretch, reset, a hardcoded number or a screenshot-derived guess. Preserve the previous confirmed settings after a failed save. A new width is not confirmed cloud state merely because local CSS changed.

Native can implement measurement using supported text/layout APIs and renderable content. Do not expose web-only DOM/canvas sizing as a working native feature; preserve a useful native layout and document any unsupported control. A drag helper, unused resize CSS or typed callback alone is not evidence of a working interaction.

## Compress Rows Before Stacking Everything

| Available Container | Presentation |
| --- | --- |
| Roomy | Dense aligned horizontal rows with useful visible columns, compact supporting labels and shared header tracks; charts/long descriptions can take surplus width |
| Constrained | Smaller gaps/padding, supporting text wraps, related facts become a labelled two-/three-column grid, and secondary groups move below the primary band as needed |
| Narrow | Compact record cards with identity, primary value/status and actions in the first band; related labelled facts below; dense comparison detail remains a deliberate group/disclosure |

Choose transitions from actual readability and group minima, not a fixed device-name breakpoint. A card can still use horizontal space efficiently; it need not be a decorative box or a long single-column stack. Keep the app's existing radius/border/surface language and alternate-row/selection/status cues. Do not import another app's palette, financial fields or branding.

For genuinely comparative data, a locally scrollable nested table can remain inside the row/card. Keep its own headings, units and account/category identities, a sticky leading identity when supported, and a visible overflow cue or explicit Scroll For More hint. Give it bounded width (`min-width: 0` on ancestors), keyboard/touch access and contained horizontal overscroll. Avoid an invisible gesture-only path to required actions. Large indivisible matrices can retain an explicit comparison-table mode rather than being forced into incoherent cards.

Use the same formatter and optional-field eligibility in every mode. Preserve null, zero, stale, loading and error meanings; changing density must not turn unknown values into zero. Provide visible field labels when the shared desktop header is no longer visible. Keep full critical numbers readable; shorten long descriptive text only with accessible full content or a genuine detail action.

Sorting, search and filter changes affect the same records in wide and card renderers. Use stable tie-breakers where needed. When desktop headings disappear, retain a visible mobile sort control with a readable selected field and direction; hidden focusable heading buttons are insufficient. Distinguish a server-filtered result from a loaded-page search and distinguish No Records, No Matches, Loading, Denied, Setup Needed and Failed Read. Paging/counts describe their actual coverage and stay available when a filtered result is empty. A different view cannot widen record or action authorization.

## Toolbar, Search And Footer Budget

Keep the existing top-to-bottom relationship of filters/actions, search, data and footer. Use a compact row/rail rather than allowing many tall toolbar rows to consume a small viewport. Keep settings and primary actions reachable beside the rail; the search field flexes into the remaining space with a real clear action. Allow short labelled controls to wrap when that is clearer than scrolling. Do not turn every filter into an unlabelled icon or shrink touch targets to create apparent space.

Filter menus/popovers can portal outside an overflow rail on web or use the platform's supported overlay. Track anchor scroll/resize, constrain the popup to the visible viewport, preserve keyboard focus/dismissal and respect reduced motion. Changing to a scroll rail must not clip an open menu or lose the focused control. Show active filters and an explicit clear action without confusing filter selections with field-visibility settings.

Keep existing status, page/count, source/freshness and attribution/footer content readable in its current area. Shorten date/secondary display formats with full accessible context when appropriate; do not add clocks or attribution fields to tables that never had them. Keep errors visible. Measure remaining list height from actual header/toolbar/search/footer sizes and safe-area insets where the workspace uses a bounded viewport. Ordinary document-flow pages can continue growing normally.

## Virtual Rows And Interaction

If the list is virtualized, one shared measurement/layout calculation must agree with the rendered row/card mode, density, optional groups, labels and expanded subrecord count. Recalculate height/offsets after width, font, settings, expansion, pending/error/validation messages or asynchronous row-content changes; include group headings and loading rows. Do not keep desktop fixed heights after switching to cards, or content will clip, overlap or leave false blank space. Keep a stable scroll anchor when practical and request only the data needed under the existing service policy.

Preserve stable record keys, current selection, open details, per-record drafts, editor/validation state, pending saves and keyboard/touch actions across mode changes, including renderer remounts. Keep one in-flight operation keyed by record identity; a breakpoint change must not replay, cancel or retarget it, and conflicting row actions remain disabled. Handle a removed/hidden control's focus deliberately. Nested resize, sort, checkbox, menu and scroll interactions must not accidentally trigger row navigation or destructive actions. Native hit areas and gesture arbitration should support vertical list scrolling beside horizontal detail inspection.

## Review Matrix

First inspect source to map each requested behavior to its actual consumer. For authorized runtime verification, review the following with real edge cases; a listed review case does not authorize executing it. Follow `AGENTS.md` for test/build/UI scope.

| Requirement | Evidence To Inspect |
| --- | --- |
| Large screens use space | Table is measured inside its actual shell; shared header/row geometry and eligible flex columns use surplus width with realistic long values |
| Progressive compression | Intermediate widths preserve readable identity/numbers/actions; sidebar/detail changes can trigger a new mode without changing viewport size |
| Mobile cards | Same eligible fields/units and permitted actions, clear labels, compact related grids, accessible dense-detail fallback; no page overflow |
| Settings really work | Visibility/order/density/labels/Resize/Fit/Stretch/reset change their actual consumers; required columns survive; no fake capability |
| Persistence is scoped | Reload/account switches retain only intended preferences; invalid/old settings normalize; failed saves keep the confirmed state |
| Controls leave data room | Filter/search/settings/footer remain in position, touch/keyboard accessible, menus unclipped and errors visible |
| Query behavior is honest | Sorting/filter/search/clear/paging use real coverage; empty/no-match/error/denied states remain distinct |
| Virtualization stays correct | Card/group/expanded heights and scroll positions match content after width/settings/fonts, asynchronous content and validation/error messages |
| Row operations survive | Drafts, editor/validation state and one record-keyed pending operation survive layout changes without replay or retargeting |
| Platforms/themes agree | Real native interaction coverage, shared records/preferences, destination colors/fonts/icons, reduced motion and accessible semantics |

Document destination-specific mappings and remaining gaps outside `ai/`. Report source review, automated checks, observed responsive behavior, confirmed persistence and deployment as separate evidence. Reusing the pattern in a different project requires mapping its own columns, state and service capabilities; copied guidance alone does not implement them.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
