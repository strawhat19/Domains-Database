# Optional Web Advertising

Use only when the user requests advertising. Copying this guide authorizes no external actions. Preserve the destination's framework, account policy, billing authority, and placement scope. Keep resolved publisher/site identifiers and setup evidence outside ai/.

## Serving Prerequisites

A verification meta tag or ads.txt seller record does not initialize advertising. Auto ads needs an approved, eligible site, Auto ads enabled, and the actual publisher loader. Manual placements need configured ad-unit code. Approval alone does not enable a missing loader or disabled setting; correct installation does not guarantee fill. Read the account's settings before reporting readiness.

Deduplicate one asynchronous publisher loader per document, with the official client identifier and crossorigin attribute. Preserve canonical HTTPS origin and publisher configuration. Verification and ads.txt remain available independently of account eligibility or advertising consent.

## Positive Account And Page Eligibility

Require positively resolved identity, feature settings, and trusted billing eligibility where the destination has those services. A public site without accounts or billing may use an explicit guest/baseline advertising policy; do not add infrastructure merely to resolve a plan. Where accounts exist, a cached plan, pricing selection, checkout parameter, expired subscription, failed read, malformed mirror, or unresolved account is not confirmed Free. A trusted service may explicitly confirm baseline access; a missing browser cache cannot. Unknown applicable state stays ad-free.

Honor designated ad-free tiers and Owner exemptions according to destination policy. Do not copy tier names, prices, role hierarchy, or billing IDs. Re-evaluate account swaps, deactivation, entitlements, and settings; cached advertising eligibility is never authority.

Default to an editorial allowlist excluding auth, private accounts, payments, administration, errors, thin search/results, and unreviewed user content. Suppress sensitive query/hash URLs; pathname alone is insufficient. Restrict placements and formats to approved scope.

PWAs retain web consent/eligibility requirements. Native advertising needs separately requested platform SDK and consent integration; web AdSense is not an automatic native substitute.

## Consent Before Requests

Personalized ads in the EEA, UK, and Switzerland require a Google-certified TCF CMP. Publish the site's message with refusal, privacy-policy URL, and revocation controls. Reuse the CMP; do not create another consent store. [CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en)

Withhold the loader until account/page eligibility is confirmed. Set `adsbygoogle.pauseAdRequests=1` before initialization; resume with `0` only after positive consent evaluation. Pausing still loads scripts and may read existing cookies. NPA is not consent-free. [Request pausing and NPA](https://support.google.com/adsense/answer/7670312?hl=en)

Register TCF listeners through Funding Choices `CONSENT_API_READY`; availability is not consent. Do not assume universal `CONSENT_DATA_READY` callbacks outside regulated regions. Require successful explicit non-applicability or a final `tcloaded`/`useractioncomplete` decision: purpose 1 and current Google vendor consent, plus applicable grounds. When purposes 3/4 are declined but basic ads are permitted, set `requestNonPersonalizedAds=1`. Let Google consume complete signals. Unknown/loading/error, refusal of required consent, or timeout stays ad-free.

Use `INITIAL_US_STATES_OPT_OUT_DATA_READY` for known initial US applicability/opt-out. Suppress unknown/opted-out states. Observe subsequent GPP changes only when signals are ready; the initial snapshot is not permanently current. [Funding Choices API](https://developers.google.com/funding-choices/fc-api-docs)

Match installed SDK contracts and numeric API versions. TCF API integer `2` differs from policy/string revisions; GPP has its own signature. Resolve sample discrepancies against [TCF](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md) and [GPP](https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform/blob/main/Core/CMP%20API%20Specification.md) standards.

## SPA Document Boundaries

Removing a script element does not unload executed advertising code. Do not CSS-hide served ads, manipulate their content, invent unload APIs, or repeatedly initialize Auto ads.

Pause immediately on account, route, eligibility, or consent uncertainty. Defer document navigation while authentication settles to preserve OAuth/account creation; remain paused.

For ordinary internal links, navigate to a clean document before SPA dispatch. Use one app-owned marker across HTML links and React Native Web Pressables through its supported attribute adapter. Respect modifiers, targets, downloads, and prevented events. Never hijack all anchors: CMP controls may be same-origin fragment links. Avoid private provider classes.

For imperative routing, capture the atomically serialized destination including query/hash before browser history commits. Pathname may update first; reloading the old browser URL can bounce signup home. Validate internal paths/origin before assigning. Hash-only assignment needs a hard reload; identity/consent-only resets use the actual browser URL.

Back/forward and persisted BFCache restoration prioritize the actual URL over stale router intent. Clear previous reset latches before persisted-page resets. Cleanup pauses/unsubscribes; ordinary disposal neither unloads executed code nor forces reload.

## Authorized Evidence

When authorized, use isolated fixtures for unknown/Free/ad-free accounts, failed billing, refusal/revocation, US opt-out, router-before-history timing, query/hash, back/forward, BFCache, and untouched CMP links. Preserve the observed regression before accepting repairs.

For release, confirm exact production SHA/canonical assignment, then check authorized HTTP artifacts and browser navigation separately: Home → header Sign Up stays at its destination; excluded pages have zero advertising scripts/requests. Block provider networking or use fixtures when live requests are outside scope. Form submissions, accounts, charges, and live ad traffic require covering authorization. Report configuration, Google readiness, deployed guards, navigation evidence, and fill separately.

Copyright 2026 strawhat19. Licensed under [MIT](../../../LICENSE).
