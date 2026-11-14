---
name: deployment
description: Prepare or release an existing app to its intended host and document a primary custom domain with independently detachable redirects. Rakib points domains and changes DNS himself. Use for publishing, domain-cutover preparation, and release readiness; copying this skill does not authorize a release or a DNS change.
---

# Application And Domain Releases

**Domains are Rakib's.** Agents never point, connect, redirect or reassign his domains, and never change DNS records or nameservers. They don't ask to, either. He does all of that himself during app launch (AGENTS.md rule 45). In this skill and its domain reference, agents do the preparation and documentation steps only. Those steps are: recording the intended hostnames, the canonical origin, the auth/Stripe return URLs to update, and a redirect/detach map he can follow. Every DNS, registrar, nameserver and project-domain step in this skill is his to perform.

Use the destination's framework, repository, auth/database resources, and host unless the user chooses a replacement; preserve existing work. Read its AGENTS.md and applicable [structure](../structure/structure.md), [API](../api/api.md), [authentication](../authentication/authentication.md), and [routes](../routes/routes.md) guidance. For protected reports or billing, retain the destination's [Admin](../admin/SKILL.md) and billing contracts.

Read [Domain And Release Reference](references/domain-release.md) when preparing a production release or writing the hostname and redirect map Rakib applies. Put secret-free resource IDs, environment names/status, public configuration, DNS snapshots, and release evidence in destination configuration or docs outside ai/. Store private values only in ignored local environment files or hosted server secret configuration; never in ordinary docs or code.

For Expo apps that should run on an iPhone from main without App Store review, read [Expo iPhone Releases](references/expo-iphone-releases.md).

For an Expo web export hosted on Vercel from GitHub, Rakib's project overrides are in [CODE.md](../../../CODE.md): Build Command `npm run export:web`, Output Directory `dist`, Install Command `npm ci`, Root Directory `./`, then redeploy. The app needs an `export:web` script (`expo export --platform web`), as in Hasanabi and Unity-Web-Games.

For local environment pulls or dependency upgrades, use [Local Development](../local-development/SKILL.md) and only its relevant reference. For a requested named Firestore database change, follow [resource selection and cutovers](../database/references/firestore-operations.md); a host release cannot select or migrate database resources by itself.

Agent commits, pull requests, and merges follow [Git Workflow](../git-workflow/SKILL.md). Preparing a release does not merge to the production branch or delete a feature branch. After Rakib approves that merge, read the resulting production deployment here and report its status with the merge commit.

## Scope And Preparation

1. Identify the requested stage: source preparation, authorized checks, commit/push, deployment, DNS, auth/provider configuration, or rollback. Reuse explicit session authorization; copying the pack or requesting inspection grants no extra stages. Respect destination restrictions on checks and publishing. Prepare concrete changes before any genuinely required final approval.
2. Inspect the dirty tree, exact commit, Git remote/production branch, linked hosting project/team, build scripts/runtime, generated outputs, public canonical origin, secret contract, and hostname ownership. Do not create a new project, transfer registration, buy services, change plans, or broaden IAM/rules/provider permissions merely to complete a release.
3. Prefer sufficient connected tools, then documented CLI/API operations with explicit known scope; use the logged-in browser when those cannot perform the required action. Check current official docs and installed help for flags. A documented fallback may use its own existing credentials for the same authorized action; do not bypass an approval rejection or silently change targets.

## Release Contract

- Follow the configured production branch, commonly main. Record the approved commit, actual push, deployment's reported source SHA/environment, build result, and primary-domain assignment separately. A local dirty tree must not replace an approved Git snapshot accidentally. An env-only release can redeploy the exact committed snapshot without committing unrelated work.
- Use version-matched build/output and server-adapter configuration. Public HTML, real API functions, and native/PWA artifacts have separate hosting needs; a static upload alone cannot execute auth, webhook, quota, or reporting handlers. Inspect the actual emitted server routes and runtime dependencies.
- Keep public build variables and server credentials separate, scoped to the intended environment. Preserve the selected cloud projects and existing auth/provider configuration. Apply changed variables through a new build/deployment, then verify the intended public value or a safe server response. Never print secrets or publish secret-bearing env files/traces.
- Preserve compatibility between deployed server code, schemas/indexes, restrictive rules, and provider endpoints. Release only the specifically authorized resources in a safe order; keep permission enforcement closed during failures. Deployment does not authorize a payment, test customer, subscription, data migration, or rule relaxation.
- Perform only permitted checks. Distinguish source review, isolated tests, export/cold-start checks, hosting READY, canonical HTTP/DNS/TLS, and real authenticated/provider flows. Report missing evidence explicitly; keep tests and synthetic identities isolated from live writes.

## Completion

Report the exact deployment/commit/environment, canonical domain, independent redirect map, scope of DNS/auth changes, actual checks and limitations, plus the smallest applicable rollback/detach procedure. Do not claim working sign-in, billing, or reporting merely because HTML loads. Leave unrelated edits, domains, mail, and resources intact.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
