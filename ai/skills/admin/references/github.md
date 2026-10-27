# GitHub Repository Analytics And Per-Project Setup

Read this for requested commit, repository traffic, release, contributor or language reports, together with [the report/server contract](analytics.md#typed-report-and-server-contract) and [chart layout](../layout.md#chart-inspection-missing-data-and-motion). Keep actual repository names, hosting projects, environment selections, adapter paths and setup evidence in the destination's docs/configuration outside `ai/`.

For a combined website-traffic/repository setup in another project, follow [reporting adoption](reporting-adoption.md) and [the focused prompt](../../../adoption.md#traffic-and-github-analytics-prompt). Reuse the same reporting behavior and leading visual identities while adapting to that destination's theme and real data sources.

## Project Scope And Authentication

Include GitHub reporting in a requested dashboard, connected-account system or full-app adoption when the destination has an identified GitHub repository. Keep focused unrelated profile/table changes narrow. An identified repository establishes scope; missing server credentials or transport still produce the real setup-needed state.

Identify the intended GitHub repository from the destination's Git remote and hosting Git connection; resolve conflicting sources before binding reports. Store one approved `owner/repository` scope in server-owned app configuration or validated server environment values. Preserve an existing fixed-scope adapter where suitable. Do not assume an app name matches its repository, copy the source app's repository binding into another project, or accept a repository, upstream URL or provider token from browser filters. Changing a token does not change a fixed repository binding.

For a new token-based adapter, use an explicit server-only `GITHUB_ANALYTICS_TOKEN`; retain an established explicit credential name when reusing another adapter. Reuse an existing authorized classic PAT or a fine-grained PAT covering several intended repositories when the user chooses. Separate repository-scoped credentials are an optional way to make rotation and revocation independent; one token per project is not required. Multiple projects can use the same variable name with the same authorized token or different private values. Each app still fixes its own server repository binding. GitHub access and the app's active trusted Owner access are separate requirements; enforce the app capability at menu, direct-view/service and server boundaries, including before cached report reads. Preserve a stricter existing policy and require an explicit user choice for broader access.

A GitHub connection in an agent/editor, a Git login, a hosting Git integration, a workflow `GITHUB_TOKEN`, and an Actions secret do not automatically provide credentials to the running report server. Profile Connections are account-private and are not a substitute for this server-owned project reporting connection. Use only the integration and credential source the destination actually implements.

## Reuse Or Create A Reporting Credential

The bearer-token report adapter can accept both classic and fine-grained personal access tokens; do not require fine-grained issuance solely because the traffic endpoint documents a fine-grained Administration permission. An existing classic PAT with `repo` scope covers repository reads when its user has the required access and the organization permits it. That scope also permits writes, so keep the adapter's operations read-only and avoid expanding scopes when a narrower existing token already meets the actual endpoint requirements. Apply any required organization SSO authorization. [Classic PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [classic scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

A single fine-grained PAT can also select multiple intended repositories under the same resource owner with the permissions below. Prefer that option over repeatedly creating tokens when the user wants one reporting credential and its scope fits. Fine-grained tokens have a single resource owner; organization approval/access policy still applies. [Repository selection](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

For a small personal-project setup, a fine-grained personal access token is a practical option. In GitHub Settings, open Developer Settings, Personal Access Tokens, Fine-Grained Tokens, then Generate New Token. Choose a descriptive project name and an expiration/rotation plan, the resource owner that owns the repository, and **Only Select Repositories** with the intended repository. Complete any organization approval required by its policy.

For a fine-grained token, grant only the endpoint permissions required by the implemented reports:

| Repository Permission | Access | Used For |
| --- | --- | --- |
| Metadata | Read | Repository identity and current metadata |
| Contents | Read | Commits and release data |
| Administration | Read | Repository views and clone traffic |

For a personal token, its user must also have repository write/push access to read traffic. The token's reporting permissions above remain read-only. Public visibility alone does not make traffic public. Check GitHub's current endpoint and organization/plan restrictions before claiming access. [Token creation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [traffic endpoint permissions](https://docs.github.com/en/rest/metrics/traffic), [traffic graph access](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository)

For many repositories, organization-owned services or a long-lived integration, consider a GitHub App with repository-scoped installation access. Implement its actual token issuance and renewal if selected; documentation or a GitHub App installation alone does not make a PAT-only adapter support that flow. Preserve existing authorized integrations rather than provisioning another one without scope.

## Put The Credential In Each Running Server

1. Identify the exact hosting project and environment serving this app's protected reports. Its deployed API needs a supported server runtime; a static export or client-only app cannot hold this secret or provide the report endpoint.
2. Add `GITHUB_ANALYTICS_TOKEN` to that project's private server environment. On Vercel, open the selected project's Environment Variables, choose a Secret value where supported, and select only the required Production, Preview or Development environments. Avoid team-wide/shared values for an intentionally project-scoped token. Other hosts use their equivalent server secret storage.
3. For local development, use the framework's supported server environment loader or an ignored local secret file such as `.env.local`; confirm the file is ignored before writing. Keep only the empty variable name and setup comments in `.env.example`. Never add a public/client prefix such as `EXPO_PUBLIC_`, `NEXT_PUBLIC_` or `VITE_`, inline the token into client code, or record its value in documentation, logs or responses.
4. Start a new deployment for the updated hosted environment, or restart the local server that loads the file. Vercel environment edits apply to new deployments. A local file, a GitHub Actions secret or an existing deployment will not automatically receive another environment's value. [Vercel environment setup](https://vercel.com/docs/environment-variables/managing-environment-variables), [environment scope](https://vercel.com/docs/environment-variables)

Document the repository scope, credential variable name, selected environments, permissions, rotation owner and required restart/deployment in project docs without storing secrets. Follow the destination's authorized validation and release scope; a documentation/source request does not authorize token creation, secret changes or deployment.

When the user explicitly requests saving a token in an ignored local environment file, use the identified authorized local credential source and preserve other values. Read/copy the secret without printing it in tool output or chat. If its location is unknown, request the file path/variable name instead of searching unrelated projects. Connected GitHub tools do not necessarily expose PAT creation or retrieval; use a supported authenticated settings flow for requested issuance and leave sign-in/MFA to the user when needed. GitHub token listings do not provide an existing token's secret value.

For the preferred existing-classic-token workflow, use the user's identified project-local `GITHUB_CLASSIC_API_TOKEN` as the source and populate the adapter's expected `GITHUB_ANALYTICS_TOKEN` when authorized and needed. Preserve the source entry and unrelated configuration; an already configured target remains authoritative unless the user selects its replacement. Confirm the destination file is ignored and untracked before saving. A direct private copy works without assuming dotenv interpolation. This is a setup mapping, not evidence that the adapter automatically reads `GITHUB_CLASSIC_API_TOKEN`; implement and document any requested runtime fallback separately. Hosted environments still need the expected variable supplied to their own server runtime.

## Preferred Dashboard Composition

Retain the measured account header/sidebar, Owner-only navigation, destination palette/fonts and existing report panel density from [layout](../layout.md). Analytics is one Dashboard menu/page with **Traffic** and **GitHub** tabs. Runtime reports keep their separate existing **Health**, **Usage** or **Observability** destination immediately before Analytics; preserve its name/route rather than creating duplicate runtime items or a Traffic/Health switch inside Analytics. The overview can retain its separate compact Traffic and supported Health summaries.

Arrange GitHub reporting around the actual repository:

- A repository identity row with its link, visibility, default branch, last push and current stars/forks/watchers/open issues plus pull requests.
- Clearly scoped KPIs for commits in the selected range, published release history, and repository views/clones in the retained traffic window.
- An interactive daily trend switching between Commits, Views and Clones, with Chart/Daily Data presentation, UTC inspection, missing-value gaps and a labelled timeline. Start at 7 Days and retain deliberate range changes; offer other supported periods without implying older traffic exists.
- Responsive paired language and commit-author panels, using code bytes for languages and the selected branch/range or explicitly loaded subset for author rankings.
- Published release versions with date/channel and uploaded-asset download counts, followed by recent commit links with readable messages and short SHAs. Keep tags without releases and automatic source archive downloads distinct.

Use proportional line/area/ranking/donut styles, existing theme surfaces and panel spacing, responsive columns and reduced-motion behavior from the shared chart contract. Put Refresh and Export JSON once in the page heading; the active tab owns those actions and its loading, error, range and source state. Keep dataset tabs keyboard accessible and retain a readable table/list alternative to chart inspection. Empty, missing-configuration, denied, partial and stale states remain visible; do not put provider secrets or technical setup fields into ordinary chart controls. Account/business summaries belong on the overview rather than filling repository report space. Translate supported behavior to native and explicitly label missing transport or interaction parity.

## Leading Icons, Images, And Visual Identities

Give GitHub the same visual identity coverage as Traffic: place a relevant icon, local mark or supplied avatar to the left of readable labels in repository identity, KPI cards, panel headings, metric/presentation controls, chart readouts/legends, rankings, release rows and recent commits. Reuse shared leading slots and theme-aware spacing rather than adding unrelated decoration. Keep metric values, units, dates and source/coverage captions readable; icons must not imply measurements or supported actions.

| Label Or Identity | Preferred Leading Visual |
| --- | --- |
| Repository/GitHub | Existing licensed local GitHub mark or installed repository icon |
| Commits/default branch | Commit/branch glyph appropriate to the label |
| Views/clones/downloads | Eye/copy/download glyph, retaining each distinct meaning |
| Stars/forks/issues/watchers | Matching star/fork/issue/eye glyph |
| Languages | Allowlisted installed or licensed local language mark; code glyph for unknown or missing artwork |
| Commit authors | Actual supplied public GitHub avatar when validated and permitted; themed initials/person fallback otherwise |
| Releases/versions | Package/tag glyph, with readable version/channel/date labels |
| Recent commits | Commit glyph; author identity only when actually supplied |

Keep standard glyph/brand slots aligned with [analytics identities](../layout.md#analytics-identity-icons), flex-none and proportionate; use a consistent slightly larger circular slot for contributor avatars. Reuse a shared resolver/component across ranking bars, lists, cards and native views. Preserve language color indicators as data keys alongside their names and marks; a logo must not replace the chart's color legend. Native may use the supported vector equivalent where a local image cannot render, retaining equivalent identity coverage and fallback behavior.

Use local licensed GitHub/language imagery from an explicit catalog and preserve its notices/provenance. The portable [language catalog](../assets/analytics/languages/README.md) includes 16 pinned marks with source metadata and license notices; unknown or omitted languages, including Sass, retain the themed code fallback. Copy the actual assets to the destination's supported public/bundled path and install its allowed-key/static bundler mappings; the catalog does not imply every language has artwork. Never construct an asset path or fetch a favicon from arbitrary language/author text. Contributor images are optional report fields, not a reason to query private app profiles, invent avatars or request broader access. Validate supplied public avatar URLs against the adapter's permitted HTTPS GitHub image hosts before including them in typed reports; use a fallback for absent, rejected or failed images and reset failure state when the identity changes.

Images/icons beside text are decorative: use empty alt text/aria-hidden or the native equivalent, and retain useful readable accessible names on their parent controls/rows. Keep label wrapping, light/dark contrast, theme surfaces, reduced motion and descriptive IDs consistent with Traffic. Preserve these visuals when changing Chart/Daily Data, ranking/list presentation or platform; document any actual rendering limitation rather than claiming parity from the guidance alone.

## Report Behavior And Troubleshooting

Keep Analytics **Traffic** and **GitHub** tabs when GitHub reporting is included. Traffic contains website analytics; GitHub contains repository analytics. Keep the existing Usage/Health runtime destination separate. Reuse themed charts, actual UTC dates, Chart/List inspection, exports and source/freshness states. Native reports need a supported authenticated hosted transport; show the actual web-only limitation when that transport is absent.

Repository views and full clones cover GitHub's rolling 14-day retention; a longer commit selection does not create older traffic. Distinguish full clones from fetches, current stars/forks/language bytes from selected-period counts, and published releases from Git tags. Asset downloads are lifetime uploaded-asset counts and exclude automatic source archives. Contributor rankings state selected-branch/range and any top-N/loaded-subset limit. Preserve exact provider period uniques; do not sum daily uniques. Null, partial, unavailable, rate-limited and empty results retain distinct meanings. [Repository traffic](https://docs.github.com/en/rest/metrics/traffic), [release fields](https://docs.github.com/en/rest/releases/releases#list-releases)

| Observed State | Next Setup Check |
| --- | --- |
| Server connection/setup needed | The serving runtime sees a non-empty expected variable; confirm project/environment and restart/deployment |
| Invalid or expired provider credential | Expiration, revocation and token format; replace it through private server configuration |
| Provider permission denied | Classic scopes/SSO or fine-grained repository selection/Administration read, plus user write access and organization policy |
| Repository unavailable | Fixed server binding, credential coverage, repository visibility/rename and provider capability |
| App sign-in or Owner access required | Current authenticated app account and trusted active role; keep provider and app authorization errors separate |
| Rate limit or partial result | Actual provider limit, request budgets, pagination and cache; retain successful sections and original coverage |

When validation is authorized, use the app's authenticated report path and confirm the intended repository, successful views/clones sections and provider fetch time. Do not print tokens or use a code-writing operation to diagnose read access. A saved secret, visible GitHub Insights page, successful public metadata response or populated layout does not establish that the hosted private traffic request succeeded. Report source changes, configured secret presence, deployment revision and actual provider read evidence separately.
