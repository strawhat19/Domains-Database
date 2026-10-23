# Custom Domain Deployment

Completed October 23, 2026, for the existing `piratechs/domains-database` Vercel project.

## Production

- Primary URL: https://domaindatabases.com
- Git source: `strawhat19/Domains-Database`, `main`, commit `cd5f3e400be5297f7066f64b7ebe76a2765a3739`
- Production deployment: `dpl_GpCxYVBXeQyrK8DDF1Qd89UoKEBf` (`READY`)
- Deployment URL: https://domains-database-fspadolbk-piratechs.vercel.app
- Vercel project: `prj_3LFrWbcAUsSsjuAaQGLYAPZD408g`
- Vercel team: `team_2hW8Z1s5cxdaS56fE1tnAMI9`
- Production `EXPO_PUBLIC_SITE_URL`: `https://domaindatabases.com`
- Firebase Authentication project `domainsdatabase-e62a3` now includes `domaindatabases.com` in its authorized domains, after explicit user approval. Existing auth domain and provider configuration were retained.

## Routing

| Domain | Registrar / DNS | HTTPS Behavior |
| --- | --- | --- |
| domaindatabases.com | GoDaddy | Serves production app |
| www.domaindatabases.com | GoDaddy | 308 to primary |
| domainnamedealing.com | Hostinger | 307 to primary |
| domainnamedevs.com | GoDaddy | 307 to primary |
| domainnameplanners.com | Hostinger | 307 to primary |
| domainnameplans.com | Hostinger | 307 to primary |
| domains-database.com | Hostinger | 307 to primary |
| domaintargeter.com | Hostinger | 307 to primary |

Each of the six alias domains also has its `www` hostname assigned to this project with a direct 307 redirect to the primary. Redirects preserve the requested path and query string. They are Vercel project-domain settings, independent of application source code.

The temporary 307 status intentionally supersedes the earlier 301/308 recommendation in `docs/domainplan.md` for these six aliases because the user may launch independent sites on them later. Their registrations remain independent at their existing registrars. No registration transfer or nameserver change was made.

## DNS

Vercel returned these project-specific recommended targets at setup time:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 216.150.1.1 |
| A | @ | 216.150.16.1 |
| CNAME | www | 2dcf6ad33881c84b.vercel-dns-016.com. |

All seven zones now use those web records. GoDaddy apex A records have TTL 600; its `www` CNAMEs have TTL 3600. Hostinger web records have TTL 300. Consult the destination project's current recommended records before any future reassignment; these values are a deployment snapshot.

Before this change, both GoDaddy zones had a Parked apex A record and a `www` CNAME pointing to their own apex. Their NS, SOA, `_domainconnect` CNAME and `_dmarc` TXT records were preserved. Each Hostinger zone contained only an apex A record pointing to `2.57.91.91` (TTL 50) and a `www` CNAME pointing to its own apex (TTL 300). No mail records or other record groups were removed.

Nameservers remain:

- `domaindatabases.com`: `ns75.domaincontrol.com`, `ns76.domaincontrol.com`
- `domainnamedevs.com`: `ns11.domaincontrol.com`, `ns12.domaincontrol.com`
- `domainnamedealing.com`: `lunar.dns-parking.com`, `solar.dns-parking.com`
- `domainnameplanners.com`: `nova.dns-parking.com`, `cosmos.dns-parking.com`
- `domainnameplans.com`: `orbit.dns-parking.com`, `horizon.dns-parking.com`
- `domains-database.com`, `domaintargeter.com`: `hermes.dns-parking.com`, `artemis.dns-parking.com`

GoDaddy records were updated through its logged-in dashboard. Hostinger's DNS dashboard stalled, so its official authenticated DNS API performed the scoped web-record updates; each update was validated and read back successfully.

## Detach An Alias Into Its Own Site

1. Prepare and deploy the new site's Vercel project, then inspect its required DNS records.
2. Remove only that alias and its `www` entry from this project's Domains settings. This removes the redirect/project assignment; it does not cancel domain registration.
3. Add the apex and `www` to the new project and select that site's canonical hostname.
4. If its recommended DNS targets differ, update only the relevant web records at the existing DNS provider. Preserve mail and unrelated records.
5. Confirm the new site's DNS, HTTPS certificate and routing. Configure its own canonical URL and authentication origins if needed.

The other aliases and `domaindatabases.com` can remain attached to this project. A site hosted outside Vercel instead needs that host's DNS records and removal of these Vercel project assignments.

## Completion Evidence

At 15:40:56 UTC on October 23, normal public DNS and standard TLS validation succeeded for all 14 custom hostnames. The primary returned HTTP 200. Its `www` returned HTTP 308, and all 12 alias hostnames returned HTTP 307 with `Location: https://domaindatabases.com/about?launch=1` for the probe path `/about?launch=1`. No DNS override or TLS-validation bypass was used for this final readback.

The production response served the app, and the deployed client bundle contained the new canonical URL plus the existing Firebase project/auth-domain configuration. Vercel's domain screen showed Valid Configuration for the alias hostnames after SSL generation finished. Firebase's authorized-domain table confirmed the new primary hostname.

Evidence artifacts are stored outside the repository in `C:/Users/massa/.codex/visualizations/2026/10/23/01a1695f-f091-7232-9bf0-e4a6b998df82/`, including `custom-domain-routing.json`, Hostinger before/after zone snapshots, and dashboard screenshots. No credentials are included in this document.

The existing committed app was remotely rebuilt and deployed; no application source edits, local builds, test suites or UI behavior checks were run. Google sign-in was configured but its full login flow was not exercised.
