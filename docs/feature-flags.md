# Features

`/features` appears last in the Dashboard submenu and requires an active Owner at navigation, direct-route, service, and Firestore-rule boundaries. `/admin/features` redirects to it. The four flags default to true only when no settings record exists.

| Flag | False Behavior |
| --- | --- |
| `themeToggle` | Hide header/profile theme controls and force dark mode, preserving the saved preference |
| `domainMarquee` | Remove the top marquee and remeasure the header |
| `notifications` | Hide the bell, public notification pages, and marquee announcements; stop public notification subscriptions |
| `contact` | Hide Contact navigation and contact actions, disable the public form, and reject new submissions |

Firebase mode subscribes to one public-safe `featureSettings/FeatureSettings_1_Global_12_00_AM_10_12_26_cb23b14255924fdd95957eac7ca7e35e` document. Its stable singleton identity is generated through `genID`, with number 1 allocated atomically alongside `counters/features` on the first Owner save. The counter cannot be changed afterward. Settings contain `id`, `number`, `type`, `name`, `version`, `created`, `updated`, the four boolean `flags`, and optional `audiences`; only flags, audiences, and the updated timestamp may change. No extra index is needed.

Each feature audience has a `roles` allowlist and a minimum `plans` selection with `planMode: minimum`. For roles, `null` allows every role and an empty list allows none. For plans, no selection means Free and above; a single selected slug allows that tier and every higher tier. Free has no selector button, and clicking the highlighted plan clears the selection. Paid tiers follow the saved catalog's `displayOrder`, then `number`; Free remains below paid tiers. Unknown paid tiers do not qualify until their catalog metadata is available. A feature is effective only when globally enabled and both the role and minimum plan match. Signed-out visitors match Guest/Free; inactive accounts fail the audience check. Both Admin and legacy Administrator remain separately selectable. Plan selection does not grant or alter account entitlements.

The owner table reads every configured plan page, including inactive plans, and retains valid historical audience slugs. It supports up to 200 plan choices and reports an unavailable/oversized catalog rather than silently omitting choices. Descriptions and plan selections appear in the table; role selections are in the gear-button feature settings modal. Per-choice writes merge against the current transaction snapshot.

Plan creation and updates maintain public-safe `{id, slug, number, displayOrder}` metadata in `planSlugs`; draft plan content remains private. Minimum-plan evaluation subscribes to that metadata, so future higher tiers and catalog order edits apply automatically. Loading the Owner Features page fills missing metadata on legacy indexes from the current saved plans, then migrates legacy plan allowlists to their lowest selected saved tier. Legacy empty/unrestricted/Free selections become Free and above; an unknown saved selection stays restricted. Until that migration, older audiences without `planMode` retain their prior exact-plan behavior. Existing records without audiences remain unrestricted.

The shared provider publishes confirmed snapshots and retains the last confirmed flags on read failure. Until its first successful read, public controls stay hidden and the document starts dark; the user's saved theme becomes effective only when the theme flag permits it. Features disables saving and offers Refresh for failed reads. Existing local mode stores the same validated record under `domains-database:features:v1`; those changes apply only to that device.

Deploy the updated `firestore.rules` with the matching client before using the new controls in Firebase mode. Source changes do not deploy rules or confirm a live connection. Public notification reads and Contact creation respect their flags; authorized notification management and Owner submission review remain available.
