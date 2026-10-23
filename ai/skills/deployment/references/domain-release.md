# Domain And Release Reference

Use destination-specific values for `<TEAM_SCOPE>`, `<PROJECT_ID>`, `<APP_ROOT>`, `<COMMIT_SHA>`, `<DEPLOYMENT_ID>`, `<PRIMARY_HOST>`, and `<ALIAS_HOST>`. Keep resolved resource IDs, environment names/status, public configuration, and historical evidence in destination configuration or docs outside ai/. Store private values only in ignored local environment files or hosted server secret configuration; never in ordinary docs or code. Recheck current official contracts before operating; examples describe shapes, not permission to execute them.

## Inventory And Ownership

Record each hostname's registrar, authoritative nameservers/DNS provider, hosting project, web records/TTL, certificate state, and intended behavior. Registration, DNS authority, team ownership, project assignment, hosting, and HTTP forwarding are separate. Connecting an existing domain normally needs neither a purchase nor a registrar/nameserver transfer. [Vercel domain model](https://vercel.com/docs/domains/working-with-domains)

Choose the user's primary apex or www hostname, then map the alternate form and every alias explicitly:

| Hostname | Intended behavior | Independent control |
| --- | --- | --- |
| `<PRIMARY_HOST>` | Serves the production app | Primary project assignment |
| `<PRIMARY_ALTERNATE_HOST>` | Direct redirect to primary | Its own hostname setting |
| `<ALIAS_HOST>` | Direct redirect to primary | Its own hostname setting |
| `<ALIAS_WWW_HOST>` | Direct redirect to primary | Its own hostname setting |

Prefer host-specific project-domain redirects for domains intended to become separate sites later. Preserve path/query and avoid redirect chains or wildcard/global host redirects that capture unrelated future sites; retain required framework routing rewrites. Use temporary 307 initially for detachable aliases; discuss permanent 301/308 only for an intentional durable move. 307 preserves the HTTP method, so auth/payment submissions should target the canonical origin directly. Older permanent redirects and explicit caching can outlive a configuration change. [Domain redirects](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting), [redirect status semantics](https://vercel.com/docs/project-configuration/vercel-json#redirects)

## Build And Environment Readiness

- Inspect existing host linkage and its actual production branch, build command, output directory, Node/runtime compatibility, and dependencies. With Git integration, authorized pushes/merges to that branch normally trigger production; inspect auto-assignment/rollback state rather than assuming every push goes live. Record local commit and remote push independently. [Production promotion](https://vercel.com/docs/deployments/promoting-a-deployment)
- Preserve reviewed source selection. Use the intended Git SHA, a separately identified approved working-tree upload, or a staged production artifact; name which was used. A preview-to-production promotion can rebuild with production env, while promotion of a staged production build can reuse the artifact. Verify the resulting deployment's SHA and target.
- Inspect the installed Expo SDK's output contract. Where APIs exist, deploy the generated server output through its supported adapter and route requests to it while serving client assets. Static HTML plus an API export still requires a server host. Do not copy a runtime version, resolver workaround, or output mode from another project without checking compatibility. [Expo API hosting](https://docs.expo.dev/router/web/api-routes/), [Expo server adapters](https://docs.expo.dev/versions/latest/sdk/server/)
- Keep canonical site URLs/public publisher identifiers in the destination's public configuration; keep Stripe keys/webhook secrets, service-account JSON, registrar tokens, and private reporting credentials server-only. Expo public-prefixed values enter client builds. Never import server credential modules into client consumers.
- Set only the requested variable/environment and preserve existing values. An env pull can overwrite a local file: do not replace the user's ignored project env unnecessarily. Scope actual credentials to the destination cloud project. Confirm new deployments use updated build/runtime configuration; an immutable old artifact retains its previous build values. [Vercel environments](https://vercel.com/docs/environment-variables)
- Keep canonical auth/billing success, cancellation, portal-return, and webhook URLs aligned with the intended serving origin and server allowlists. Provider endpoint edits require their own applicable authorization; no test charges or new live billing resources are implied.
- When rules/indexes/schema and backend behavior change together, prepare compatibility and rollback first. Publish the compatible backend and required indexes before cutting off legacy client writes where that order applies. A successful app build does not publish database rules or prove an index is ready.

## DNS, TLS, And Auth Cutover

1. Read the destination host's exact recommended records and any ownership challenge for each hostname. Never reuse a remembered universal A/AAAA/CNAME target. Update records at the authoritative DNS provider; a Vercel DNS command cannot change an externally hosted zone. [Custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain)
2. Save a credential-free before-state. Replace only conflicting web records needed for the selected hosts; preserve MX, SPF/DKIM/DMARC and other TXT, CAA, verification, NS/SOA, and unrelated subdomains. Inspect conflicting AAAA or forwarding settings rather than deleting whole record groups. A nameserver migration needs a separately planned complete zone migration.
3. Add only the intended apex/www or other explicit hostnames to the selected project. Inspect existing assignments before reassignment; force flags or team ownership removal are broader operations. Read back each DNS/project mutation and preserve an exact reversal map.
4. Wait for ownership/DNS verification and valid TLS on every serving or redirect hostname. HTTPS redirects also need a valid certificate on their source hostname. DNS write acceptance, a UI configuration badge, and a successful certificate are distinct evidence. Use the returned targets and normal certificate validation. [Adding a domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
5. Add only actual sign-in/continue hosts to Firebase Authentication's authorized domains where needed. Keep the existing `authDomain` and provider credentials unless a custom auth-helper domain is deliberately configured. A Vercel hostname assignment does not configure Firebase/OAuth. [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
6. For a deliberate Firebase auth-domain change, verify the helper endpoints and provider redirect URI `https://<AUTH_HOST>/__/auth/handler`. Third-party hosts may require a supported popup flow or transparent helper proxy; a redirect is not a proxy. Follow the selected Firebase approach and retain safe internal canonical return paths. Redirect-only aliases generally do not need sign-in configuration. [Firebase redirect guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices)

## Verification When Authorized

Start with the smallest meaningful checks for the changed boundary. These levels supply different evidence:

| Level | Evidence to record |
| --- | --- |
| Source | Exact diff, framework/output/env contract, auth/rule scope |
| Isolated checks | Relevant fixtures, expected permissions, provider doubles; no live writes |
| Export/runtime startup | Actual generated routes import and execute; SDK/Node dependencies start |
| Host release | Reported SHA, target, READY, primary alias points to that deployment |
| Public delivery | Normal-DNS HTTPS/TLS, public pages, exact redirects, content types |
| Authenticated/provider flow | Only the real flows actually exercised under the user's authorization |

- A build can reach READY while functions fail at startup. When permitted, exercise actual exported handlers and deployed HTTP routes, not just source doubles. Unauthenticated protected requests should return their defined JSON denial, and a synthetic invalid webhook signature should be rejected before writes. Investigate generic 500s with scoped runtime logs.
- An explicitly permitted structurally valid synthetic invalid bearer token can exercise server SDK initialization and rejection without creating an account. Distinguish a normal 401 from missing-config 503; it does not prove a valid user's sign-in or paid entitlement. Keep identifiers synthetic and never submit a valid live event merely to warm a handler.
- Scan generated client output for configured private credential values and secret patterns without printing matches. A public-prefix variable is public by design. Keep server secrets, private provider payloads, browser state, and secret-bearing logs out of committed docs or shareable artifacts.
- Verify primary HTML and permitted public/legal/contact pages; inspect raw metadata when the release requires it. For each apex/www alias, check the exact status and Location on a non-root path with query parameters. Confirm paths/queries survive and redirects terminate at the primary.
- DNS overrides can isolate routing while caches propagate, but record them as diagnostics. Final propagation evidence uses an ordinary resolver and trusted TLS; never bypass certificate checks. Protect preview deployments through authorized access mechanisms rather than disabling protection.
- Separate a real provider success from mock, missing-config, denied-permission, empty-data, and incomplete-coverage states. Test or UI permission does not authorize a charge, subscription mutation, rule release, or a larger external scope.

Read-only Vercel examples, using known explicit scope:

```sh
vercel inspect <DEPLOYMENT_ID> --scope <TEAM_SCOPE>
vercel domains inspect <HOSTNAME> --scope <TEAM_SCOPE>
```

Verify flags against current [inspect](https://vercel.com/docs/cli/inspect) and [domains](https://vercel.com/docs/cli/domains) docs and installed help. Prefer connected project-domain operations for precise assignment/redirect changes; `domains rm` removes a domain from the current scope and is not a substitute for project-only detachment.

## Detach One Alias Into Its Own Site

1. Prepare the new site's independent project/deployment, canonical URL, server env, and any auth/provider configuration. Inspect its required DNS records before changing traffic.
2. Identify only the selected alias's apex/www assignments and redirects. Reassign or remove them from the old project through project-scoped controls; preserve registration, team ownership where applicable, the primary site, and every other alias. [Project-only removal](https://vercel.com/docs/domains/working-with-domains/remove-a-domain)
3. Attach those exact hostnames to the new host/project and select that site's canonical hostname. Update only its required web records if the recommended targets differ; preserve mail and unrelated zone data.
4. Verify the new serving and redirect hostnames, TLS, canonical returns, and permitted routes. Account for cached old redirects/DNS. Record the new resource map outside ai/; there should be no global old-app host redirect left to undo.

## Scoped Recovery

Restore only the affected deployment assignment, hostname redirect/project setting, or changed DNS web records from their before-state. Check schema/rule/env compatibility before selecting an older app artifact. An app rollback does not reverse database writes, rules/indexes, DNS, provider payments, or env edits.

On Vercel, an instant rollback reassigns domains without rebuilding and can turn off production-domain auto-assignment; inspect that state and deliberately restore the authorized normal release flow afterward. Do not reopen private writes to mask an API outage. Preserve other domains and mail throughout. [Rollback behavior](https://vercel.com/docs/instant-rollback)

Record the actual source/deployment/hostname state, permitted evidence, remaining propagation or auth work, and recovery result. Keep logs free of tokens and personal/provider details; unperformed checks remain unverified.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
