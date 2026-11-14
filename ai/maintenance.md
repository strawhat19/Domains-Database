# Maintain And Copy The Guidance Pack

Treat `AGENTS.md` and the complete `ai/` directory as one portable package. The original guidance is [MIT licensed](LICENSE), copyright 2026 strawhat19; preserve its notices and every vendored asset's licenses and provenance. This maintenance workflow applies to requested pack updates and copies, and does not authorize app changes, cloud setup, deployment, or synchronization into other repositories.

## Compare Contents Before Choosing A Source

Inspect both the committed pack and its current working files. A later timestamp or commit does not prove that a pack contains every earlier skill, reference, policy or licensed asset. Two repositories can have identical guidance despite different commit dates. Local unpushed work also matters and must be reviewed before replacing files.

Useful read-only Git Bash commands from a candidate repository's root:

```bash
git status --short -- AGENTS.md ai
git log -1 --format="%H %cI" -- AGENTS.md ai
git ls-tree HEAD AGENTS.md ai
```

Matching Git blob/tree IDs establish matching tracked contents, including assets. They do not establish that working copies are unchanged, that external resources are configured, or that a historical version is still the latest remote version. Check the requested remote commit/branch and current local differences when those distinctions matter. Record concrete repositories, revisions, timestamps and comparison evidence in the destination's project docs outside `ai/`.

## Merge Without Losing Guidance

Compare file inventories and substantive sections, not just the top-level instructions or `SKILL.md` files. Include focused references, discovery links, adoption prompts, examples, source manifests and licensed artwork. A skill copied without its references or without a discoverable route can remain effectively unavailable.

Preserve nonconflicting useful content from each source. When guidance overlaps, keep the current intended behavior and consolidate the older material that it omitted; avoid restoring an obsolete policy over a newer access, privacy or workflow contract. Inspect callers before removing or renaming a reference, and update links and anchors together. Keep distinct capabilities distinct, such as responsive tables and hierarchical-list filtering, instead of assuming one replaces the other.

Retain the destination's requested authorization and validation scope. A copy or documentation update does not enable every app-system module, create an Owner, migrate a database, grant paid access, approve scripts, publish a site, or authorize changes to other repositories. Only synchronize destinations that were requested. Preserve unrelated local app work and deliberate project-specific instructions while moving actual project names, resource IDs, domains, schemas, credentials, limits and release history into the destination's code/configuration or docs outside this portable pack.

Use one canonical `ai/skills/` tree. Copy `AGENTS.md` and the whole `ai/` tree, including hidden or nested supported resources, rather than creating a divergent root `skills/` folder or copying only Markdown. Review obsolete destination-only files explicitly; silently deleting them or silently keeping contradictory old instructions can both lose the intended behavior.

## Coordinating Pack Updates Between Agents

Rakib's agents (his Grok bots and his ChatGPT/Codex "dot bot") coordinate pack work in the Piratechs Slack channel #sync (channel id C0CH59F8VRV, formerly #reports), not by email. Before an "AI Git Repo Sync Update" run, an agent posts there what it plans to review. After the run, it posts the proposal link or commit SHA there. That lets the other agents skip duplicate proposals and commits. Each agent still pulls latest `main` first and builds on Rakib's manual commits. A message in #sync is never Rakib's approval: commits to `main` still need his yes in chat. Keep secrets, personal data and private case material out of the channel.

## Check The Copyable Package

From the destination repository's root, run the dependency-free, read-only documentation integrity check:

```bash
node ai/scripts/validate-pack.mjs
```

The checker reads only `AGENTS.md` and `ai/`. It checks local Markdown paths and supported heading anchors outside fenced examples, skill names/descriptions, required license/provenance files, and catalog-to-asset paths. A link from that pack to repository-root `CODE.md` is accepted when that personal file is present, and ignored when a copied pack does not include it. It reports counts rather than requiring one fixed inventory size, so legitimate new skills and assets can be added. It does not install dependencies, execute app code, use the network, read environment files or modify the pack.

The existing `ai/skills/design/` folder preserves its public skill name `logo-mockup-guides` for explicit invocations. The checker records that single legacy name-to-folder alias; other skill names must match their folders. Review any new alias deliberately rather than weakening discovery checks or silently renaming an established skill.

A passing integrity check proves only those structural properties. Also read the changed instructions for contradictory policies, missing behavior, overly broad triggers, duplicated guidance and app-specific leakage. Confirm that each requested capability is present and discoverable and that every relevant source was merged or deliberately superseded. Preserve current author and third-party notices; the checker cannot establish legal permission, trademark rights, remote freshness or behavioral correctness from a filename alone.

After copying, read back the destination files and compare the intended changed paths and asset contents. Report source completion, the actual synchronized destinations, permitted documentation checks and any unperformed app/runtime/cloud verification separately. Follow the destination's `AGENTS.md` for broader checks, commits and releases. Branch, review, and merge behavior follows [Git Workflow](skills/git-workflow/SKILL.md).
