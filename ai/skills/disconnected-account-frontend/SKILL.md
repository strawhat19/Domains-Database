---
name: disconnected-account-frontend
description: Prepare themed account, profile, saved-item, admin and analytics pages for later Firebase integration without connecting a backend. Use for frontend-only readiness requests, not live account setup.
---

# Disconnected Account Frontend

Use this workflow when the user asks for page buildouts before backend access is available or explicitly excludes connections. The connected-system guides describe future contracts, not permission to enable their services during this pass.

## Adoption Prompt

> Use ai/skills/disconnected-account-frontend/SKILL.md to prepare this app's profile, account and internal dashboard pages for future Firebase integration. Keep its existing theme and public functionality. Add the requested saved-item/list pages, honest disconnected states and public launch-readiness pages. No backend connections. Commit only to my requested review branch and report what still needs setup.

Use a narrower request when only one module needs work. Branch permission does not authorize production deployment or merging.

## Read And Adapt

Read the applicable AGENTS.md guides, [account layout](../admin/layout.md), and only the relevant [Admin contracts](../admin/SKILL.md). Inspect the available reference application's source for shell geometry, menus, profile controls, table patterns and missing-data behavior. Retain the destination's framework, typography, logo, color tokens, animations, routes and product terminology. Do not transplant its billing, shop, records, credentials or actual user identities.

If the user requests an additional skill such as reverse-engineer-anything, find and read its actual source when available. Report when it is unavailable; ordinary source inspection is still useful, but must not be described as invoking that skill or observing runtime behavior.

Keep the synchronized AGENTS.md and ai/ pack generic. Put app-specific routes, model decisions, reference commit IDs and launch prerequisites in docs/ outside this pack. Preserve existing narrower access rules and uncommitted work.

## Disconnected Means Disconnected

- Do not create projects, enable providers, initialize cloud SDKs, add credentials, subscribe to live data, send submissions, enable telemetry, configure billing, or change domains in this workflow. Existing unrelated working services must not be silently disconnected either.
- Keep sign-in, sign-up and password-reset layouts, reciprocal links and provider identity treatment ready, but submission disabled with an explicit setup-needed explanation. Never accept or store passwords as demo data or show fabricated login success.
- Separate UI models and services from future Firebase adapters. Model loading, empty, unavailable and error states explicitly; leave real adapters unconnected. Document future scoped subscriptions and cleanup rather than pretending local state is realtime cloud sync.
- Local saved items, lists and preferences may work when requested. Label them as device/browser-local, offer removal, and explain that clearing storage can lose them. Do not call these account-owned, backed up, shared with friends or cross-device synced.
- Never persist secrets or private QR payloads by default. Public content sharing can use existing public item URLs; local-only records do not get fake shared URLs or delivery confirmations. Preview future private-list sharing without uploading or exposing local contents.
- Owner/admin UI previews are not authorization. Isolate them behind an explicit preview entry, identify any sample data, and never grant an owner role from an email comparison, query parameter or browser preference. Future live routes require verified identity and server-enforced permissions.

## Page Buildouts

Build only applicable modules: sign-in/up/reset; profile and settings; saved items/favorites; lists and list details; submission/review states; owner dashboard, users, content, feedback, analytics and feature-setting layouts. Keep public browsing functional. Avoid adding a shop, payment flow or invented plan prices to an unrelated directory or music/tool app.

Use the shared account shell with the destination's palette/fonts: full-width account header inner row/canvas, measured header offset and logo-plus-wordmark slim desktop sidebar, collapse behavior, nested menus, bottom identity/profile controls and mobile navigation. The real default remains Owner-only ADMIN and Profile-only top-level navigation for every other role, with supported private tools within Profile. An explicitly labelled Owner layout preview may demonstrate those sections without granting identity/access. Avatar popup previews include clearly labelled sample role pills for every preview role and plan pills only for non-Owners; disconnected state cannot imply a trusted account or entitlement. Include keyboard labels, focus treatment, reduced-motion behavior, readable modal surfaces and normal page scrolling. Arrange charts to fit rather than creating internal vertical scroll/stretch.

For analytics, display setup-needed/unavailable rather than zero visitors, invented revenue, health percentages or fake live charts. A clearly marked sample visualization is a design preview only. Document that Vercel reports later need authorized server-only access; client-side owner visibility is not sufficient protection. Do not add telemetry collectors during a no-connections pass.

For profile editing, uploads, contact and moderation forms, distinguish device-only drafts from submitted records. Disable unsupported cloud mutations and explain what is missing. Include future account deletion/export entry points as unavailable where relevant; never claim a deletion request was delivered.

## Public And Native Readiness

Prepare useful original public content, About, Contact, Privacy, Terms and applicable content/submission guidelines. Privacy copy must describe current local behavior, not services merely planned. Contact forms cannot claim delivery without a service. Do not invent artist biographies, content rights, user totals, reviews or business facts.

Use unique public-page titles/descriptions, semantic navigation, supported structured data and share metadata. Derive canonical origins and sitemap URLs from the destination's actual deployment/configuration; do not claim an unconnected owned domain is live. Exclude account/admin/preview/local-library routes from public sitemaps and mark them noindex where supported. Robots and noindex are not security controls.

Document app-store and AdSense prerequisites separately from page completion. Native navigation, responsive layouts and placeholder account pages do not prove a native build, store eligibility, content rights, privacy disclosures, functional account deletion or ad approval. No store/ad submissions, ad scripts, analytics connections or signing credentials are part of frontend readiness.

## Handoff

Follow AGENTS.md for checks: do not run tests, builds or UI validation unless the user asks. Review source and diff; clearly say which checks were not run. Respect any newer explicit validation request.

Record the branch, commit, changed routes/components, working local behaviors, unavailable actions, future Firebase/Firestore/Auth/reporting prerequisites and verification status outside ai/. Keep source readiness, connection status and runtime validation separate. Never describe a branch commit as a production deployment.
