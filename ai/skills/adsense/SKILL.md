---
name: adsense
description: Prepare a web app for Google AdSense submission and publisher verification, or implement consent-aware ad serving and trusted ad-free plans when requested. Does not enable ads by default or cover Google Ads campaigns or native ad SDKs.
---

# Google AdSense Readiness And Serving

Preserve the destination's framework, content, theme, public navigation and existing account/billing boundaries. Identify the requested stage: source preparation, publisher verification, account submission, serving configuration, or release. A submission-preparation request does not enable ads; copying this pack does not create a publisher account, submit a site, publish consent messages or deploy code. Reuse existing authorization and follow AGENTS.md for checks, credentials, account actions and publishing.

## Choose The Relevant Contract

- Read [Submission And Verification](references/submission.md) for original content, public policies/contact, crawler access, actual HTML metadata, publisher configuration, ads.txt and review handoff. An absent publisher ID is a supported preparation state.
- Read [Consented Serving And Ad-Free Access](references/serving.md) only when implementing or debugging actual advertising, paid ad removal, consent or advertising-related navigation. Verification tags and a seller record are separate from a loader, Auto ads/placements and permission to request ads.
- For paid ad removal, reuse the destination's trusted entitlement and effective feature settings. Read [Payments](../payments/SKILL.md) only if billing itself is requested, and [feature flags](../admin/references/features.md) when the app has or requests those controls. Do not require a database, Stripe or an account system for a public site that does not need them.
- Use [Deployment](../deployment/SKILL.md) for authorized releases and custom origins. AdSense website setup does not enable a native SDK; distinguish a web/PWA experience from app-store advertising.

Use [the submission prompt](../../adoption.md#google-adsense-submission-prompt) for preparation and [the serving prompt](../../adoption.md#consented-ads-and-ad-free-plans-prompt) for the optional connected consumer.

## Portable Boundaries

Keep actual hostnames, publisher IDs, cloud resources, tier mappings, environment values, consent-message status and release evidence in destination code/configuration/docs outside ai/. Publisher IDs are public identifiers, but each project needs its own approved configuration. Do not copy another site's account, prices, legal statements, article count, route allowlist or current approval status into the reusable pack.

Choose useful original content and policies that describe the site's actual behavior. Do not invent legal compliance, consent, moderation, payments or delivery. Check current official Google requirements when applying these references; no fixed traffic/article threshold or approval date is promised.

When serving is requested, preserve an explicit eligible-public-content boundary, positive account/plan resolution where accounts exist, applicable consent and an actual deployed consumer. Keep requests off on unresolved or failed state. Navigation must reach its intended destination while disposing of executed advertising code; do not treat removing a script element or hiding an ad as unloading it.

## Completion Evidence

Report source preparation, publisher configuration/verification, Google review status, published consent configuration, serving settings/loader, trusted ad-free behavior, pushed/deployed revision and actual ad delivery separately. Source review, isolated fixtures, production export, HTTPS delivery, browser navigation and a filled ad prove different things. Record only the checks permitted and actually performed; Google approval and ad availability remain external conditions. Keep the destination's outstanding setup precise rather than describing a prepared configuration as connected or approved.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
