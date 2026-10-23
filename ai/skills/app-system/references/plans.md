# Plans Catalog And Public Pricing

Read this for requested plan/pricing management or the full App System. A catalog describes offers; it does not process payment or grant account access. Preserve an app's existing free/pro labels, entitlements, and billing integration as separate concerns.

## Catalog Model And Permissions

Use app-owned stable ID/number, immutable unique slug, name, description, ordered features, nonnegative integer price in the declared currency's minor units, supported currency, billing interval, active/publication state, highlighted flag, displayOrder, and timestamps. Existing field names such as priceCents can remain when their unit is defined. Support only the app's explicit currency/interval set; common intervals are month, year, and one-time. Format the declared amount/currency correctly rather than assuming every currency has two minor digits.

Create records through the atomic ID/counter and unique-slug mechanism described in Admin. Edits preserve ID, number, slug, and created time. Validate name/features/description lengths, supported values, safe integer amounts, booleans, and order at the persistence boundary. Empty/unconfigured prices must not become invented paid offers. Import existing legitimate catalog content through an explicit compatible operation instead of automatically reseeding deleted/empty data.

Grant management through the active trusted Owner catalog capability by default, shared by navigation, direct routes, services and rules. Grant another role catalog access only when the user explicitly chooses that destination policy; preserve stricter existing permissions. Ordinary users cannot edit prices, publication state, identities, or configuration. Public reads return only active catalog display fields. Keep private notes, internal provider IDs, or credentials out of those documents; a component hiding fields does not secure a public document.

## Working Views And Publication

Provide a bounded realtime authorized catalog list with search/filter scope disclosed, Add/Edit, saved Activate/Inactivate, and Archive mapped to inactive. Archive retains stable catalog identity rather than deleting references or scanning users. Start a new plan inactive unless the app deliberately chooses publication. Disable conflicting controls while saving, preserve failed edits and the last confirmed state, and show pending/error feedback. Follow Admin's record/editor layout and status cells.

Use the same active-only source for a public Pricing page and the home pricing section. Order cards consistently by displayOrder and a stable secondary key. Show real name, description, price/currency/interval, features, and highlight state; updates/publication flow through onSnapshot. Queries and indexes match the public active constraint and bounded limit. Render No Plans Published, Loading, Connection Needed, and Load Failed honestly. A selected period changes displayed offers only if the catalog actually supports that interval.

Keep plan CTAs truthful: View Details, Contact, or the app's already supported purchase flow. Do not add fake checkout, claim a purchase, write user.plan, assign paid roles, or unlock features when someone clicks a pricing card or an Admin edits/publishes a price. A requested payment/entitlement system needs its own trusted provider/webhook workflow and authorization. Catalog management must not silently replace that existing boundary.

For that explicitly requested connection, use [Payments](../../payments/SKILL.md). Maintain the destination's private approved catalog-to-provider mapping and amount/currency/interval checks; a display-price edit does not silently mutate an immutable provider price or migrate existing subscribers. Use the destination's intended pricing-change policy and keep billing readiness separate from catalog publication.

The common signed-in avatar popup displays a role pill for every role and a plan pill only for non-Owners. Hide the plan pill whenever the actual role is Owner, even if inactive, unverified or denied administrative capability; leave Profile Account Details and entitlement policy unchanged. Resolve its label from trusted account entitlement and actual catalog metadata; show Free only when the baseline is confirmed. Loading or Plan Unavailable must remain explicit when unresolved. Administrative role, public pricing publication, provider hosting plan and account entitlement are separate values.

Put the destination's currency set, schema/route mapping, catalog migration, and entitlement relationship in project docs outside ai/. A new starter can have an empty published catalog with a working editor; record owner-supplied prices/content as setup needed rather than pretending they are configured.

## Feature Tier Targeting

For requested feature flags or the connected starter, follow [Owner Features](../../admin/references/features.md). The Features table offers actual paid catalog tiers as a single minimum selection, with no Free button; no selection means Free And Above, and selecting the highlighted tier again clears it. Roles are configured separately in the feature settings modal. Eligibility is the saved global boolean AND permitted current role AND an already trusted user plan at or above the threshold.

Compare current catalog `displayOrder`, then immutable app-owned `number`; Free is the baseline. Do not hardcode paid names, rank by price, or persist a list of only today's higher tiers. New higher catalog tiers qualify dynamically for users whose trusted entitlement already references them. Editing rank can change this explicit eligibility policy, while editing/publication never assigns an entitlement or processes payment.

Maintain a bounded public-safe slug/rank index containing only ID, slug, number and displayOrder, including inactive tiers still referenced by entitlements. Pricing remains active-only; drafts/private notes and provider metadata never enter the rank projection. Create/edit/status operations atomically maintain matching rank/reservation metadata, with rules checking catalog equality. Backfill existing metadata and migrate legacy exact feature allowlists through the Owner-authorized confirmed operation described in Features before enabling plan changes. Preserve unknown saved thresholds as unavailable/recoverable instead of guessing a tier.

