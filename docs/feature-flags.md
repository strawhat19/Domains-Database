# Features

`/features` appears after Plans in the Dashboard submenu, followed by Health and Analytics, and requires an active Owner at navigation, direct-route, service, and Firestore-rule boundaries. `/admin/features` redirects to it. The original four flags, Pricing Table and Name Switch default to true after a confirmed missing record; Ads defaults to false.

| Flag | False Behavior |
| --- | --- |
| `themeToggle` | Hide header/profile theme controls and force dark mode, preserving the saved preference |
| `domainMarquee` | Remove the top marquee and remeasure the header |
| `notifications` | Hide the bell, public notification pages, and marquee announcements; stop public notification subscriptions |
| `contact` | Hide Contact navigation and contact actions, disable the public form, and reject new submissions |
| `pricingTable` | Keep published plan previews; replace plan actions with signed-in interest and account-free upvotes |
| `ads` | Disable future ad eligibility for everyone; no ad placements are connected yet |
| `nameSwitch` | Display Domains Database; enabled by default to display Domain Databases in UI, page copy, and browser titles |

Firebase mode subscribes to one public-safe `featureSettings/FeatureSettings_1_Global_12_00_AM_10_12_26_cb23b14255924fdd95957eac7ca7e35e` document. Its stable singleton identity is generated through `genID`, with number 1 allocated atomically alongside `counters/features` on the first Owner save. The counter cannot be changed afterward. Settings contain `id`, `number`, `type`, `name`, `version`, `created`, `updated`, the seven boolean `flags`, and optional `audiences`; only flags, audiences, and the updated timestamp may change. No extra index is needed.

Existing four-flag documents remain readable. Missing new flags receive their release defaults, and missing new audiences use unrestricted minimum-plan targeting. Existing values and audiences remain intact; the next confirmed Owner save writes the compatible full configuration. Unknown keys and malformed saved values remain errors rather than being replaced with defaults.

Domain Databases is the default display name for the canonical domaindatabases.com site, including initial branding while feature settings load, metadata fallbacks, native blog imagery and the Expo display name. Existing saved Name Switch values and audiences still apply after settings are ready; an explicit saved false continues to select Domains Database. This default change does not rewrite stored settings or change the app's slug, scheme, package identifiers, repository or deployment.

Each feature audience has a `roles` allowlist and a minimum `plans` selection with `planMode: minimum`. For roles, `null` allows every role and an empty list allows none. For plans, no selection means Free and above; a single selected slug allows that tier and every higher tier. Free has no selector button, and clicking the selected plan clears the selection. Paid tiers follow the saved catalog's `displayOrder`, then `number`; Free remains below paid tiers. Unknown paid tiers do not qualify until their catalog metadata is available. A feature is effective only when globally enabled and both the role and minimum plan match. Signed-out visitors match Guest/Free; inactive accounts fail the audience check. Both Admin and legacy Administrator remain separately selectable. Plan selection does not grant or alter account entitlements.

The owner table reads every configured plan page, including inactive plans, and retains valid historical audience slugs. It supports up to 200 plan choices and reports an unavailable/oversized catalog rather than silently omitting choices. Descriptions and plan selections appear in the table; role selections are in the gear-button feature settings modal. Per-choice writes merge against the current transaction snapshot.

Plan creation and updates maintain public-safe `{id, slug, number, displayOrder}` metadata in `planSlugs`; draft plan content remains private. Minimum-plan evaluation subscribes to that metadata, so future higher tiers and catalog order edits apply automatically. Loading the Owner Features page fills missing metadata on legacy indexes from the current saved plans, then migrates legacy plan allowlists to their lowest selected saved tier. Legacy empty/unrestricted/Free selections become Free and above; an unknown saved selection stays restricted. Until that migration, older audiences without `planMode` retain their prior exact-plan behavior. Existing records without audiences remain unrestricted.

The shared provider publishes confirmed snapshots and retains the last confirmed flags on read failure. Until its first successful read, public controls stay hidden and the document starts dark; the user's saved theme becomes effective only when the theme flag permits it. Features disables saving and offers Refresh for failed reads. Existing local mode stores the same validated record under `domains-database:features:v1`; those changes apply only to that device.

Deploy the updated `firestore.rules` with the matching client before using the new controls in Firebase mode. Source changes do not deploy rules or confirm a live connection. Public notification reads and Contact creation respect their flags; authorized notification management and Owner submission review remain available.

The Plans Admin table has a Score column showing each plan's confirmed upvote total directly from Firestore. Clicking an existing upvote removes it; downvote actions are unavailable. The separate Plan Interest section was removed from Features. No pricing action grants a plan entitlement or processes a payment. Guest voting uses isolated Anonymous Authentication in the same Firebase project as described in `docs/plan-interest.md`; local mode labels its results as saved on this device.
