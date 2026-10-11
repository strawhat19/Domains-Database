# Plans Catalog And Public Pricing

Read this for requested plan/pricing management or the full App System. A catalog describes offers; it does not process payment or grant account access. Preserve an app's existing free/pro labels, entitlements, and billing integration as separate concerns.

## Catalog Model And Permissions

Use app-owned stable ID/number, immutable unique slug, name, description, ordered features, nonnegative integer price in the declared currency's minor units, supported currency, billing interval, active/publication state, highlighted flag, displayOrder, and timestamps. Existing field names such as priceCents can remain when their unit is defined. Support only the app's explicit currency/interval set; common intervals are month, year, and one-time. Format the declared amount/currency correctly rather than assuming every currency has two minor digits.

Create records through the atomic ID/counter and unique-slug mechanism described in Admin. Edits preserve ID, number, slug, and created time. Validate name/features/description lengths, supported values, safe integer amounts, booleans, and order at the persistence boundary. Empty/unconfigured prices must not become invented paid offers. Import existing legitimate catalog content through an explicit compatible operation instead of automatically reseeding deleted/empty data.

Grant management through a deliberate active Admin/Owner catalog capability, shared by navigation, direct routes, services, and rules; preserve stricter existing permissions. Ordinary users cannot edit prices, publication state, identities, or configuration. Public reads return only active catalog display fields. Keep private notes, internal provider IDs, or credentials out of those documents; a component hiding fields does not secure a public document.

## Working Views And Publication

Provide a bounded realtime authorized catalog list with search/filter scope disclosed, Add/Edit, saved Activate/Inactivate, and Archive mapped to inactive. Archive retains stable catalog identity rather than deleting references or scanning users. Start a new plan inactive unless the app deliberately chooses publication. Disable conflicting controls while saving, preserve failed edits and the last confirmed state, and show pending/error feedback. Follow Admin's record/editor layout and status cells.

Use the same active-only source for a public Pricing page and the home pricing section. Order cards consistently by displayOrder and a stable secondary key. Show real name, description, price/currency/interval, features, and highlight state; updates/publication flow through onSnapshot. Queries and indexes match the public active constraint and bounded limit. Render No Plans Published, Loading, Connection Needed, and Load Failed honestly. A selected period changes displayed offers only if the catalog actually supports that interval.

Keep plan CTAs truthful: View Details, Contact, or the app's already supported purchase flow. Do not add fake checkout, claim a purchase, write user.plan, assign paid roles, or unlock features when someone clicks a pricing card or an Admin edits/publishes a price. A requested payment/entitlement system needs its own trusted provider/webhook workflow and authorization. Catalog management must not silently replace that existing boundary.

Put the destination's currency set, schema/route mapping, catalog migration, and entitlement relationship in project docs outside ai/. A new starter can have an empty published catalog with a working editor; record owner-supplied prices/content as setup needed rather than pretending they are configured.

