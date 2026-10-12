# Shared Account Shell And Reporting Layout

Use this reference for account Profile, Admin, Dashboard, analytics, and chart work. It defines reusable geometry and interactions independently of branding or business records. Match the layout unless the user requests another layout; retain the destination app's existing colors, font families, feature labels, route registry, and authorization. Translate the same layout to its framework rather than copying framework-specific source. These are shared design and interaction defaults, not evidence that a destination's services or every platform implementation are connected.

## Account Canvas And Sidebar

| Detail | Reference Contract |
| --- | --- |
| Desktop breakpoint | At least 651 px wide |
| Mobile breakpoint | At most 650 px wide |
| Account canvas | Width 100%, max-width none, no centered marketing-page container |
| Header height | One shared measured height H, including enabled attached top bars |
| Expanded sidebar | Match the shared header brand-width token; reference desktop width is 220 px |
| Collapsed sidebar | 56 px wide |
| Sidebar placement | Fixed left 0, top H, bottom 0; height calc(100dvh - H); z-index 20 |
| Sidebar edge | Flush against the viewport, square corners, right border only |
| Sidebar padding | Expanded 9 px 8 px 5 px; collapsed 16 px 8 px 0 |
| Content columns | sidebar-width minmax(0, 1fr) |
| Content gutter G | clamp(18px, 2.4vw, 40px) |
| Column gap | max(28px, G) |
| Main content padding | Top 32 px, right G, bottom clamp(32px, 4vw, 56px), left 0 |
| Footer | Offset its left edge by the active sidebar width |
| Width motion | 300 ms cubic-bezier(.22, 1, .36, 1) for sidebar, content columns, and footer offset |

The desktop page starts immediately beneath the header at H. Measure the actual header, enabled attached bars, marquee rows, and safe-area insets together; use that same value for page top, sidebar top, and remaining viewport height. Observe size changes so hiding a feature-controlled marquee, wrapping navigation, or resizing the window recalculates the offset. A header's sticky variable defaults to true; keep attached bars within the same sticky surface and apply a semi-transparent background and blur on scroll, with -webkit-backdrop-filter before backdrop-filter. The sidebar stays visible through scrolling as a full-height fixed rail. Its body has min-height 0, flex 1, vertical scrolling, and hidden scrollbars; the bottom controls stay anchored with margin-top auto. Let main content scroll normally and keep min-width 0 on grids, panels, chart wrappers, and record values.

At mobile widths the sidebar becomes an inline navigation panel above the content, the page is one column, and navigation/content gap is 24 px. Use the same G for horizontal padding and 24 px outer block padding beneath the actual header; do not introduce a separate fixed top offset. Top-level navigation groups use two columns, while parent groups span the row and their submenu children stay in one column. Collapsing hides the navigation body and leaves the bottom controls visible; it does not become a separate drawer by default. With no sidebar, main content and footer occupy the full width with G on both sides.

## Navigation State And Interactions

Keep collapsed state and expanded submenu keys in one shared account-navigation provider so Profile and Admin routes do not reset the shell. Persist those preferences through the browser/device storage adapter, scope them to the current account, and clear old account state before hydrating the next account. Maintain separate expanded submenu sets for desktop and mobile. The reference starts with Dashboard expanded when eligible and Feedback closed on both; user choices can leave either or both open. Hydrate only recognized, eligible menu keys and keep storage failures visible without discarding a choice made while hydration was pending.

The shared account menu has this reusable arrangement. Map business-specific sections to real destination modules; do not create empty pages simply to reproduce a menu.

| Group | Parent/Links | Reference Children In Order |
| --- | --- | --- |
| ACCOUNT | Profile, Connections | Own account details and private connection settings |
| ADMIN | Dashboard | Users, Events, Plans, Notifications, Reports, Analytics, Health, Features |
| ADMIN | Feedback | Forms, Reviews, Chats, Messages |

Filter every parent and child by the same current active-account capability as its direct route. Features is last in the Dashboard submenu and Owner-only. Preserve narrower review/user-management permissions and hide a parent that has no permitted purpose. Connections counts describe verified account connections; other badges describe their actual loaded scope, never guessed totals. The bottom Profile identity action is separate from this menu hierarchy.

| Element | Size And Spacing |
| --- | --- |
| Navigation body | Expanded heading gap 9 px shared with top padding, 12 px collapsed; scroll padding 4 px with compensating -4 px margin |
| Group | Gap 8 px expanded, 4 px collapsed |
| Navigation row | Radius 8 px; padding 11 px 10 px; icon/label gap 10 px; 15 px rendered icons |
| Child links | Gap 6 px; inline padding 8 px |
| Expanded desktop children | One column, gap 6 px; margin 8 px 0 0 10 px; left border; padding 4 px 4 px 4 px 10 px |
| Collapsed rows | Minimum height 38 px; centered icons; padding 8 px 0; route/group heading minimum 36 px |
| Collapsed children | Visible icon rows, gap 4 px; margin 4 px 0 0; no left border or indentation |
| Separate chevron toggle | Width 34 px, margin 4 px, radius 6 px |
| Bottom controls | Minimum row height 43 px, gap 8 px, padding 4 px 0 |
| Bottom Profile action | Height 38 px, flex 1, padding 4 px 8 px |
| Profile avatar | 28 px circle; provider photo or themed initial |
| Collapse button | 38 px square; fills available rail width while collapsed |

Separate parent navigation from expansion: selecting a parent link navigates, while its chevron opens or closes children. A group without a direct route uses its whole heading as the toggle. Mark the parent current when its route or one of its children is active. Hide labels and section titles visually in the collapsed rail while retaining accessible names. Keep all eligible child icons visible while collapsed, with hover/focus tooltips; restore the saved expanded state on expansion. Do not replace these child icons with a different flyout for layout parity.

Use the same heading-gap token for header-to-ACCOUNT, ACCOUNT-to-first-link, and the gaps above and below ADMIN; reference expanded desktop spacing is 9 px. In light mode, inactive link labels use the theme's ink token, matching the header wordmark's primary ink. Active links and active submenu parents use accent/contrast colors; inactive icons use accent and selected icons follow contrast. Dark mode uses the existing themed surfaces and readable ink. Apply these same tokens and spacing to loading placeholders.

Animate submenu grid rows from 0fr to 1fr over 320 ms cubic-bezier(.22, 1, .36, 1), opacity over 240 ms, and chevrons over 300 ms. Closed groups are inert or unfocusable and aria-hidden; toggles expose aria-expanded and aria-controls. Collapse chevrons rotate 180 degrees on desktop, and between 90 and -90 degrees on mobile. Show actual count loading/error states and use the same capability filter as protected routes.

The bottom identity/Profile action and collapse control remain separate. When an account popup is requested, reuse the common account menu behavior: open by click/tap, dismiss on navigation, outside pointer, or Escape, restore trigger focus on Escape, and put Sign Out last. Reference popup sizing is width 260 px, max-width calc(100vw - 36px), radius 14 px, padding 9 px; menu rows have padding 12 px and icon gap 10 px. Anchor a bottom popup above its trigger and keep it within the viewport. The shared Profile action can remain a direct link where that is the chosen reference interaction.

## Profile And Dashboard Content

Profile uses a main editable details column plus a 240 px metadata/settings card, gap clamp(20px, 3vw, 36px). Stack the card below details at widths up to 1100 px. Above 1100 px, the card is sticky below the actual header, scrolls internally within the remaining viewport, and has radius 12 px, padding 20 px, and a 22 px title-to-content gap.

Editable profile rows use 100 px labels and minmax(0, 1fr) values, gap 15 px, vertical padding 20 px, and a dividing border. Metadata card rows use 48 px labels, gap 10 px, and padding 14 px vertically. At widths up to 480 px, editable labels become 65 px with a 12 px gap and inputs use 16 px text. Profile inputs have minimum height 42 px, radius 8 px, padding 10 px 13 px. Name input/actions wrap with a 12 px gap; metadata values wrap safely.

Dashboard has a one-column main body with gap clamp(20px, 3vw, 36px). Its heading aligns title/breadcrumb copy on the left and current section actions on the right, gap 24 px, bottom margin 28 px; stack at widths up to 850 px. Analytics headings retain a wrapping horizontal arrangement with a 16 px gap and actions aligned right. Record-page headings use 12 px bottom spacing and may show three summary cards in a maximum 480 px group, gap 10 px, padding 14 px, radius 12 px; stack those cards at widths up to 480 px.

Retain the app's fonts while matching typography sizes: Profile title clamp(34px, 5vw, 56px), Dashboard title clamp(34px, 4vw, 52px), both line-height 1.15; dashboard title margins 15 px 0 12 px. Use existing theme tokens for foreground, accent, surface, muted, borders, and chart series. Keep feature-specific record names and summaries in the app's own modules.

The overview is Traffic, Health, business activity/distribution charts, then concise count links. Adapt business record labels and dimensions to the destination's real data. Keep the overview free of redundant database-source copy and appended recent-record/intake tables; dedicated Reports and review pages retain their relevant source and record details. This does not hide actual errors, missing configuration, or loaded-window coverage.

Business charts wrap in an 18 px gap. The activity chart has flex 1.6 1 280px; distribution chart has flex 1 1 220px. Chart panels have radius 12 px, padding 22 px (18 px at widths up to 480 px), heading bottom gap 20 px, and legend gap 12 px. Activity bars use a 140 px plot, six period columns with gap 10 px, and maximum 12 px bars with 3 px between series. A distribution donut is 132 px with a 104 px center and 14 px ring. Feature count links are 40 px minimum-height pills in an auto-fit grid with minimum 160 px columns, gap 8 px, margin 18 px 0 24 px.

## Loading Shapes And Theme

Web account loading uses the same full-width account shell and persisted collapsed navigation geometry as the loaded page. Use theme tokens for surfaces, ink, borders, accent, and skeleton fills in light and dark modes rather than a permanently dark loading card. Announce one loading status; hide decorative placeholders from assistive technology and give them no interactive behavior.

Profile placeholders follow the editable label/value rows, name actions, privacy/sharing choices, account actions, and 240 px metadata/settings card with its existing responsive stack. A Connections placeholder follows the supported connection tabs, credential field shapes, and save/clear actions. Only show a theme-control placeholder where the effective feature setting allows it. Dashboard placeholders follow Traffic/Health headings, country chips, tabs, controls, KPIs, neutral plot surfaces, thin timeline tracks, business chart shapes, and count pills. Use report placeholders for analytics and table placeholders for record pages; refine the selected view's shape when extending a loader. Skeletons communicate pending structure, not sample metrics or a successful connection. Respect reduced-motion settings for shimmer and pulses.

## Record Lists, Notification Editors, And Saved Status Controls

Use the same record-list arrangement for relevant administrative records and request review pages. Align a 26 px record heading with three summary cards in the existing maximum 480 px group. Keep filters above the table: a search field with maximum width 320 px and 40 px height, 40 px status select, and right-aligned Add action when creation is supported. The Add action has minimum height 38 px, padding 10 px 14 px, and a labelled icon; mobile filter actions fill the row. Summaries and filters describe their actual loaded page/window.

Web record lists use a semantic table within a horizontally scrollable bordered wrapper, radius 12 px. Header cells use 9 px text and padding 13 px vertically/18 px horizontally; body cells use 11 px text and padding 15 px vertically/18 px horizontally. Number badges are 24 px squares. At widths up to 480 px, cell padding becomes 13 px and search/select text becomes 16 px. Put paging in a full-column table footer where possible, and keep equivalent paging visible beneath an empty filtered list. Native may use accessible row cards with the same fields, actions, and density adapted to its platform.

Notification columns are No., Title, Kind where supported, Status, Updated, and Actions; show actual body/link details without forcing them into every table cell. Use actionsCell, rowStatus, statusDotWrap, statusDot, and statusText consistently. The status wrapper is 16 px, the dot is 6 px, and status text is 11 px; use green Active, gray Inactive, and red destructive/error states. A permitted status control is a real labelled button, works by keyboard/tap, and reports Saving while its persisted change is pending. Read-only status displays have no misleading click affordance.

Reuse the shared segmented-control geometry for mutually exclusive choices: themed input surface, 1 px border, 6 px radius, 2 px padding, 3 px option gap, 28 px minimum option height, 4 px/10 px option padding, and 12 px labels. Selected options use accent/contrast colors; preserve the last confirmed selection, keyboard focus, labelled icons, disabled and pending states. A slim table variant uses 1 px container padding, 2 px gaps, 22 px options, 3 px/6 px option padding, 10 px labels, and 12 px icons. Feature tables retain Description, Value, Plans, and Actions; the Actions cell pairs Enable/Disable segments with a 26 px labelled settings gear. Settings holds role selectors and useful feature details. Keep feature semantics in [the Features contract](references/features.md), not duplicated in layout rules. Native may increase touch targets without making the visible segments thick.

Add/Edit opens one shared accessible editor dialog. Reference geometry is a centered panel with width min(760px, 100%), radius 18 px, 24 px outer viewport padding, and independently scrolling content with maximum height calc(100dvh - 48px). The editor has 24 px inner padding, a 26 px title, a 34 px close control, and a two-column field grid with 18 px gaps; title/body fields span both columns. Inputs are at least 42 px high, radius 8 px, padding 10 px 12 px. At widths up to 600 px, use a single field column, 18 px editor padding, 16 px input text, 12 px viewport padding, radius 14 px, and maximum content height calc(100dvh - 24px).

Keep Save/Cancel controls together at the bottom; Save is at least 40 px high. Show the supported Active/Inactive field and explain where active records appear. Trap dialog focus and return it to its trigger on dismissal, support Escape/outside dismissal while idle, and prevent dismissal or conflicting actions during a pending save. Show validation/provider errors inside the dialog and preserve the draft after failure. Delete uses explicit Delete/Cancel confirmation on the selected record and dismisses only after successful persistence. Give repeated rows, controls, fields, errors, and confirmations descriptive IDs containing the record ID.

Layout parity includes working behavior: search/filter, refresh/paging, permitted editor actions, and Active/Inactive controls must connect to the actual services described in [admin.md](admin.md). Distinguish a genuinely empty list from no filter matches, denied access, missing connection, and a failed read. Preserve direct routes for existing request review actions and their privacy rules; do not render unrelated or unconfigured reference modules as completed functions.

Private contact/request review uses the same heading, 40 px search/filter controls, table wrapper, status-cell pattern, and paging placement. Include Name, Email, Subject, Message expansion, Submitted/Updated dates, Status, and permitted actions where the schema supports them. Keep New, Read, and Archived controls labelled, keyboard/tap accessible, and connected to persisted review status. Native row cards retain the same fields and actions. Show saving feedback on the affected row and preserve the last confirmed status after a failed update. Keep Loaded Page search/filter coverage visible, with refresh and paging accessible even when no rows match.

Preserve the public contact form's existing theme and layout. Give fields real labels, concise inline validation/errors, and a submit control with pending state; keep the honeypot hidden from keyboard and assistive navigation. Announce success and clear the draft only after the persistence service confirms the save. Present optional email delivery feedback separately from Submission Saved, and keep a failed-save draft available for retry. Private review visibility follows the app's explicit capability, including a stricter Owner-only policy where one exists.

## Compact Reporting Panels

Place Traffic and Health as separate full-width panels before business charts and count links. Compact panels have radius 12 px, padding 20 px, gap 12 px, margin-bottom 20 px, with rows auto auto auto minmax(0, 1fr). List/filter/ranking modes use a 470 px panel with a scrollable report viewport, or 560 px at viewport widths up to 700 px. Chart modes use auto height with the same minimum height, visible report overflow, and enough plot/reading/timeline space to fit without an internal vertical scrollbar. Let the page grow for real warnings or errors instead of clipping them. Padding becomes 15 px at widths up to 460 px.

Both panels use a title/icon row with actions opposite and horizontally scrollable tabs with a 2 px active bottom border. Traffic's toolbar wraps; Health's toolbar can scroll horizontally. Tabs are minimum 32 px tall, padding 7 px 10 px, gap 5 px. Toolbar gap is 7 px; segmented controls have 2 px gap/padding, radius 7 px; options are minimum 26 px tall, padding 5 px 7 px, radius 5 px. The separate Filters button matches the complete segmented group's 32 px height. Compact action buttons are 32 px, with labelled icons. Provide Chart/List presentation controls, refresh, export, and access to the full report; retain truthful range, source, cache, and capability states without restoring redundant overview text.

Traffic compact tabs cover Overview, Daily, Countries, Sources, Pages, and Devices when supplied. Toolbar includes the reporting period, Visitors/Page Views, presentation, Filters/Clear, then relevant comparison/percentage/fill/inspection switches aligned to the right and allowed to wrap. Overview has no additional Traffic Overview heading row. Retain headings for Daily and segment views, and share report/filter state across views.

At panel widths of at least 700 px, Countries moves into a compact right-aligned row in the top title/actions heading, above the tabs and controls. Its horizontal country chips retain identities, counts, optional percentages, filtering, and a labelled explore action. Use a 156 px KPI column plus minmax(0, 1fr) trend with a 14 px gap; hide the lower duplicate country panel and allow the chart to fill its available width without the 620 px cap. At narrower panel widths, keep KPIs across the top and a flexible chart beside a 240 px country panel; at 560 px and below stack these with a 230 px country area. The narrow fallback trend can keep its existing 620 px maximum and natural aspect ratio. At viewport widths up to 700 px, base KPIs become three columns. Use the panel's measured width rather than screen size to decide whether Countries fits above the chart.

Runtime tabs cover Compute, Memory, Requests, Latency, Routes, Statuses, and Cache according to provider capability. Toolbar includes 24 Hours, 7 Days, and 30 Days; the active view's metric; Chart/List presentation. Selecting a summary metric selects its trend view; selecting a ranking view keeps only compatible metrics and resets its search. Compact summary uses Requests, Invocations, Active CPU Time, and 5xx Errors in four columns, gap 9 px, card padding 10 px; use two columns at viewport widths up to 700 px or panel widths up to 520 px. Compact trend plot has a 132 px minimum and can flex into available space. Keep warnings and provider failures available; chart fitting must not conceal them.

## Full Reporting Controls And Responsive Grids

Full Analytics uses a top Traffic/Health switch, fit-content width, wrapping gap 4 px, radius 9 px, padding 4 px, margin-bottom 18 px; each switch is minimum 34 px, padding 8 px 12 px. Put the active report's Refresh/Export JSON actions in the page heading rather than duplicating action rows.

Full traffic summary has filter and KPI columns in a 1:1.15 ratio, gap 18 px; stack at panel widths up to 840 px. The filter panel has radius 12 px, padding 16 px, gap 14 px. Date controls use 7/30/90 day presets and a separate From/To/Apply form; inputs are minimum 34 px, date width 128 px, and controls wrap with gaps 8-12 px. Four segment selects become two columns at viewport widths up to 620 px or summary widths up to 560 px. Show removable active filter chips and Clear Filters.

Traffic KPI cards use three columns with gap 12 px, padding 18 px, radius 12 px, internal gap 9 px; padding becomes 13 px below 620 px. At widths up to 420 px, KPIs become single horizontal rows with values on the right and the date form fills the width. Full trend/breakdown panels have radius 12 px, padding 20 px (16 px below 620 px), heading gap 18 px. Breakdown panels use two columns with gap 18 px, becoming one below 620 px. Application outcome summaries use only the app's real feature records and relevant destinations.

Full runtime keeps panel padding 20 px, gap 12 px, radius 12 px, margin-bottom 30 px. Summary KPIs use five columns, gap 9 px, padding 12 px, radius 9 px; reduce to three at viewport widths up to 1000 px or panel widths up to 760 px, and two at viewport widths up to 700 px or panel widths up to 520 px. At widths up to 460 px use 15 px panel padding and 10 px KPI padding. Metric selection is minimum 150 px wide, minimum height 32 px. Rankings have an inline search and Chart/List controls; full ranking and bucket tables scroll within a maximum 440 px height with sticky headers. Table cells use padding 9 px 7 px; ranking rows have radius 8 px, padding 9 px, gap 6 px 9 px, and a 4 px value bar.

Use container-width rules where reference panels depend on their available width: collapsing a sidebar changes chart space even when the viewport stays the same width. Native views can derive those breakpoints from onLayout and use density-independent units; keep safe-area accommodation, keyboard operation, and touch inspection.

## Analytics Identity Icons

Render local country flags, device glyphs, referral/app source brands, and the app's page-route icons beside readable row labels. Share the identity resolver and asset catalog across full breakdowns, compact Overview/Countries panels, other segment tabs, Chart/Bars and List presentations, and native rows. Switching presentation or expanding results must retain each identity; do not reduce native reports to raw country codes or plain source/device text. Built-in select options may remain text labels where the platform cannot render icons; keep their labels consistent with the report rows.

Country flags use a 24 x 18 px footprint with a 4:3 image, 2 px radius, and a subtle themed border. Standard device/page/fallback icons occupy a 20 x 20 px centered slot; reference glyphs are 15 px. Brand marks are 18 x 18 px inside that slot. Use flex-none slots so long labels do not shrink or distort assets. Native uses the same logical footprints with its supported local SVG/image renderer and vector icon library. Preserve brand color or a theme-aware currentColor mark as specified by the local registry, and use a readable system color in forced-color modes.

Known country codes resolve against the complete vendored catalog; unsupported/unknown codes use a neutral location icon. Unknown devices use a combined-device glyph, unknown pages a document icon, unknown sources a globe, and direct traffic a link icon. Use explicit aliases and domain-bound matches for known brands; an unrelated hostname containing a brand name must retain its own identity. A missing or failed asset also falls back to the appropriate neutral glyph while retaining its text label. Reset failure state when the row identity changes, and keep country/brand file paths constrained to catalog keys.

Icons beside labels are decorative: hide them from assistive technology and use empty alt text for flag images. Row/button accessible names include the identity label, useful raw caption, actual metric values, and filter action where applicable. Pages labels, raw paths, and available destination hostnames share one baseline row when space permits and wrap when necessary; keep raw source/path captions available when a friendly label replaces them. Only show a destination hostname supplied by validated provider data or an actual URL value, never one inferred from the app's configured domain or a referrer. Give each icon, image, label, caption, and repeated row a descriptive ID containing its segment and stable record value or index. Keep local asset licenses, disclaimers, source manifests, and pinned provenance when copying the catalog; do not replace complete coverage with emoji flags or unrelated remote favicons.

The portable catalog is [assets/analytics/](assets/analytics/) relative to this guide, with flags/, brands/, their code/source manifests, and notices. For a new project, reuse an equivalent installed catalog or copy this bundle to its supported artwork output path, commonly public/analytics/. Import resolver JSON/TypeScript catalog metadata from the source tree, preferably colocated with the resolver, and keep its allowed country/brand keys synchronized with the artwork files; do not assume a served public asset path is also a resolvable module import. Web artwork URLs point to the served path rather than ai/. Native bundled artwork uses literal static requires or the framework's asset manifest from module paths visible to its bundler/watch roots, with the supported SVG/image renderer. Preserve the full catalog, licenses, and provenance when transferring it. Copying the asset bundle does not install component code or native rendering dependencies.

## Chart Inspection, Missing Data, And Motion

Traffic trend uses an SVG viewBox 0 0 800 244 with plot left 48, right 780, top 18, bottom 204, width 100%, and natural height. Runtime measures its actual plot container and uses that width/height as the SVG viewBox; plot margins are left 76 px, right 18 px, top 18 px, bottom 30 px. Its full plot is 220 px high and compact plot starts at 132 px with flex growth. Preserve SVG aspect ratio rather than stretching text and circles with preserveAspectRatio=none. Observe runtime plot size changes, adapt y-axis tick density to available height, and use fewer time labels below 400 px plot width. Translate these sizing decisions to the destination's installed chart library instead of imposing an unrelated fixed width.

Put the current bucket's UTC date/time on the left and value/unit on the right above the plot in a minimum 36 px reading row, margin-bottom 4 px. Default to the last bucket, inspect on hover or supported touch interaction, show a vertical guide and selected marker, and retain an explicit slider/tap selection after pointer leave. Map pointer coordinates into the actual SVG coordinate system, particularly for measured plots. Include a range slider when there is more than one bucket. Label it Day Timeline or Time Timeline with a horizontal-move icon and Drag To Inspect hint; support arrow keys and announce the actual timestamp, metric, unit, and missing state. Use a 2 px visual track and 12 px outlined thumb within a 24 px interaction area, with a 12 px copy/control gap; align the track with the plot using 6% traffic or 76 px runtime indent. Keep focus visible. Tabs support ArrowLeft/ArrowRight/Home/End and roving focus.

Keep original time positions when a measurement is missing. Render null as an em dash in cards and tables, break line/area segments at missing buckets, and show individual measured points without connecting across gaps. The slider still visits missing buckets and announces No Measurement. Empty, unsupported, stale, loading, and error states remain distinct; chart sizing must not convert them to artificial zeroes. Include accessible SVG title/description and a List/table presentation.

Reference motion uses 550 ms panel entrance, 800 ms area fade, 1200-1250 ms line draw, and 850 ms business bar/donut transitions with small staggered delays. Value/ranking bars can animate over 650 ms. Disable entrances, pulses, spinners, drawing animations, and layout/color transitions under reduced motion. Reuse the app's installed animation/chart tools, descriptive IDs, and real typed data sources from [admin.md](admin.md).


## Native Translation And Parity Boundaries

Use the same eligible menus, persisted preferences, real report data, theme tokens, identities, and permitted actions on native. Derive geometry from onLayout, window dimensions, and measured header/safe-area values; adapt touch targets and use the framework's SVG/image renderer and accessibility roles. Web CSS container queries and a fixed rail are design targets to translate, not code to paste into a native screen.

Inspect the existing native rendering before claiming parity. A normal-flow card sidebar, generic account loader, previous/next chart inspection, reduced compact report controls, or chart that excludes missing buckets differs from the web contract above. Keep a supported interaction available while implementing a requested equivalent; report any remaining difference accurately. If missing native buckets are excluded, label that coverage rather than implying gaps retain their original positions. Route-specific loading, full report controls, measured plot sizing, and accessible timelines require their actual native implementation before they can be described as complete.

## Integration And Identity Parity

Use [the Firestore contract](references/firestore.md) for hydrated account/query state and [the workflow contract](references/workflows.md) for real persisted controls. The detailed [analytics contract](references/analytics.md#shared-country-source-device-and-page-identities) owns safe aliases, domain/path-bound matches, asset/catalog installation and browser/OS capability distinctions; keep visual sizing and interaction geometry here.

Use the same identity resolver in compact overview/rankings, full report, Chart/Bars and List, expanded results and native rows. Known source shortcut hosts such as t.co, redd.it, youtu.be, lnkd.in, fb.me, instagr.am, wa.me and pin.it resolve only through explicit brand mappings. Direct, unknown and Others retain distinct meanings; Others does not become a selectable fake country/referrer/page. Country/code labels stay readable if Intl.DisplayNames or an asset is unavailable.

Refresh shows the actual cache/revalidation result and original fetch time. Range inputs stay draft until Apply; switching datasets/views resets incompatible metrics/search rather than silently issuing invalid queries. Report exports preserve the displayed range/filter/unit/source/null/coverage states. Private preference keys are scoped to project/account, and read-state/loading errors do not become zero badges.

Keep private form/editor/read-state fields out of analytics row captions, logs and accessible report names. Accessible labels contain permitted display identity and actual metric/unit/filter action. Counters, selected-page matches and recent-window summaries state their actual coverage; this layout does not convert samples into whole-database totals.
