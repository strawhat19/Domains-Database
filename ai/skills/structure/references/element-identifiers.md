# Element Identifiers And Collection Parents

Apply this contract to actual app-owned rendered elements when creating or changing views and shared inspection helpers. Keep the destination's framework, platform, existing architecture and authorized scope. Persistent record IDs follow the separate database/model contract; these identifiers describe rendered occurrences.

## Semantic Classes And Unique IDs

Every app-owned web element needs a descriptive actual `class`/`className` and a unique descriptive `id`. Reuse a stable generic semantic class for the same purpose, including repeated siblings: a collection can use `record-list`, each item `record-row`, and its title `record-title`. Add state classes separately when needed. Preserve existing classes and public anchors, accessible relationships, styling selectors and behavior IDs; extend compatible helpers rather than silently renaming them.

Scope an ID by component instance, record identity and local element role. The same record can appear in a board, modal and preview at once, and a reusable component can render several times. A record ID alone or a repeated literal ID does not distinguish those occurrences. Use the stable record ID when available, and a stable local index only for an ordered collection without record identity. Include a role for each child, such as title, icon or action. Give non-record repeated controls their stable option identity and occurrence scope too.

React `key` identifies reconciliation siblings and is not a rendered ID or semantic class. Framework-generated style hashes, `data-*` attributes, test IDs and accessibility labels also do not replace an actual semantic web class. Preserve accessible names and label/control relationships as their own requirements.

Keep classes generic and readable rather than unique per record or instance. Do not derive classes by stripping digits from runtime IDs, incrementing counters or using random values. Use a deliberate shared semantic name at the component/helper call site. Avoid introducing private user details, credentials or other sensitive values into either IDs or classes; an inspection helper must not expose new private identifiers.

Use the framework's stable instance mechanism. In React, call `useId` at the top level of a component or custom hook, then combine its instance scope with safe record and role tokens as needed. Never call a hook inside a map, loop or condition; extract a reusable item component when it needs its own hook. Avoid render-time counters and random IDs that drift across renders or server hydration. Preserve established public anchor IDs and exact drag/drop registry identities; adding a suffix only to the rendered DOM ID can disconnect code that expects that ID to equal its registered source ID.

## Web And Native Adapters

Use supported public props, host components or a focused public platform adapter to put semantic classes on the actual web node. Confirm what an existing helper renders before treating metadata as DOM class coverage. A React Native Web generated CSS class may provide styles without providing the requested semantic class. Do not depend on private library internals or a global React factory patch as the default solution.

If a supported integration uses markers and a DOM bridge to add semantic classes after hydration, document that limit: server-rendered markup does not yet contain those semantic classes, and classes appear only after the bridge runs. Keep server/client identity stable and preserve existing class tokens. Such a bridge is not proof of complete server-rendered coverage; use a direct public host adapter when initial markup coverage is required and supported.

Native views have no DOM CSS class attribute. Use `nativeID` and the platform's supported test/accessibility/inspection metadata through the app's shared helper, while keeping native style objects and accessible labels intact. Do not force web-only `className` props into native components or claim native metadata is a CSS class. Library-generated editor content, glyph internals and native widgets may require supported extension surfaces; distinguish those from app-owned nodes and state any actual coverage limits.

## Logical Parents For Repeated Collections

Give each repeated rendered collection a dedicated logical named parent. Prefer its existing semantic or layout container and add the class/ID there before inserting another node. A list, `ol`, `ul`, `tbody`, table row, option group, `ScrollView`, virtualized list or existing grouped `View` can already supply that parent. Static and mapped entries that form one collection, such as None followed by saved options, can share the same parent.

Add a small named wrapper when a collection otherwise mixes directly with unrelated headings, toolbars, forms or sections. Keep each item's own semantic class/unique ID. Transfer spacing and layout deliberately so the collection keeps the same gaps, direction and width; omit an unnecessary empty wrapper when it would add spacing. Do not split a deliberate single collection merely because it is produced by two adjacent maps.

Classify the map's output before changing structure. Data normalization, promises, styles, geometry and prop transforms do not create rendered lists. Mapped cells already belong to their `tr`, rows to `tbody`, inline text to its valid text/inline parent, and SVG children to a valid SVG group. Do not add arbitrary HTML/View wrappers that break table structure, text nesting or SVG namespaces. Reuse or add a valid semantic grouping element only when the actual collection needs one.

Preserve drag/drop source and drop-zone refs, exact registry IDs, measurement containers, hit regions and scroll context. Preserve virtualized-list item ownership, keys, row measurement and windowing; an extra wrapper around rendered rows can break virtualization. Preserve horizontal scroll flow, flex/grid geometry, positioned containing blocks and absolute coordinates. In particular, a new default-column View must not replace a horizontal list's item flow, and positioned chart/table/overlay pieces must not acquire an unintended containing block.

## Source Review And Handoff

Review both helper definitions and their rendered call sites for duplicate instance/record/role combinations, lost existing class tokens, invalid host props, hook placement and accidental collection layout changes. Inspect maps as rendered structures rather than applying a blanket wrapper transform. Source review can identify implementation limits but does not prove actual DOM or native output. Follow the repository's authorized validation scope and report source changes, adapter/hydration limitations and performed checks separately; this contract does not authorize UI checks, builds or deployment.
