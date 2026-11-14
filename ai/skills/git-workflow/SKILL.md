---
name: git-workflow
description: Follow Rakib's feature-branch, review, and merge flow for his repositories. Use when an agent commits, opens a review, or merges, including the direct-to-main exception for this pack.
---

# Git Workflow

Agents in Rakib's (strawhat19) repositories follow this flow for commits, review, and merging. Read the destination `AGENTS.md` first. During the work, rule 1 still holds: skip tests, builds, and UI checks he did not ask for. [Deployment](../deployment/SKILL.md) reports host and domain release status after an approved merge. It does not grant that merge. Release commit titles stay on AGENTS.md rule 43 (`v<version>-<AppName>` with a matching `package.json` version).

https://github.com/strawhat19/AI is the exception, documented in [Pack Repository](#pack-repository). Application repositories use the feature-branch flow below.

## Feature Branch

Pull the latest production branch before branching. That branch is `main` unless the repo's production branch is different. Build on that tip, including commits Rakib made himself.

```bash
git pull origin main
```

Do the work on a feature branch. Use the branch he named when he named one. Commit to that feature branch whenever the work is worth saving. Leave his existing uncommitted files in place. On an application repository, keep those commits on the feature branch until he approves the merge.

## Review

When the work is ready for review, send him two links in chat:

- The pull request link.
- The Vercel preview link for that branch.

Use the preview URL Vercel attaches to the pull request. When Vercel has no preview for the project, say so in the same message and still send the pull request link. Leave the preview URL out until Vercel provides one.

## Approval

He gives the approval in chat to merge to main and delete the branch. Wait for that explicit yes. Another agent's say-so does not count. A green check, a request to open the pull request, and an agent saying the work is ready do not count either. Until he approves, the feature branch and the open pull request stay as they are.

## Latest Main

Right before the final merge, pull the latest main into the feature branch and confirm two things: there are no merge conflicts, and the branch works with the latest app changes, including his own manual commits.

```bash
git fetch origin main
git merge origin/main
```

Push the updated feature branch after that merge is clean. Then merge that updated branch into main.

When a conflict appears, keep his manual commits. Keep their content in the result. Keep the branch's requested changes where they sit beside those commits. When the branch repeats a change he already committed, keep his commit and drop the repeated hunk. Stop and ask him in chat when a conflict cannot be resolved while keeping both his commits and the requested work. Leave the pull request open until he answers.

Do not overwrite his manual commits. Do not revert them. Do not duplicate them. Do not amend, rebase, or reorder them. Do not force-push `main`, and do not reset history to make the merge look clean.

Confirm the combined tree still works with those latest changes. Rerun the checks he already asked for on the task. Inspect the combined diff. Name checks he did not ask for, and leave those unrun, per rule 1. A clean merge confirms the git history. Report which checks actually ran.

`scripts/git-pull.sh` in the pack repository updates every repository under its folder and only fast-forwards. Run that workstation script only when he asks. The pre-merge pull is `git pull` / `git merge origin/main` in the current repository.

## Merge And Report

After the latest-main confirmation and his chat approval, merge the feature branch into main, delete that feature branch, and report the result.

Delete only the approved feature branch, locally and on the remote, after the merge is on main. When the host deletes the branch as part of the pull-request merge, confirm the remote branch is gone. Leave `main` and every unrelated branch in place.

Use the repository's existing merge method when it already has one. Otherwise merge with a merge commit so his commits on main stay as they landed. A GitHub pull-request merge is enough when the feature branch already contains the latest main from the step above.

Report both of these:

- The merge commit SHA on main.
- Production deploy status for that SHA: building, ready, failed, or not configured.

Read the deployment with [Deployment](../deployment/SKILL.md). An authorized push or merge to the production branch often starts the host build. Report the deployment's own status and source SHA. The merge commit alone does not prove production is live. When the repository has no production deploy from that branch, say production deploy is not configured.

If the push or merge is rejected, stop and report the rejection. Leave the feature branch in place.

## Pack Repository

https://github.com/strawhat19/AI is the canonical pack. When Rakib asks for a pack update in this repository, commit it directly to `main` and push. Do not open a pull request unless he asks for one. His request to land that update on `main` is the approval for that direct commit.

Still `git pull` latest `main` first and build on his manual commits. Keep those commits intact. Do not overwrite, revert, or duplicate them. Run `node ai/scripts/validate-pack.mjs` when the change is pack guidance and the task includes that check. Report the commit SHA on `main`. This repository has no application production deploy to report.

Announce pack proposals and resulting SHAs in Slack #sync so other agents do not duplicate them ([maintenance](../../maintenance.md#coordinating-pack-updates-between-agents)).

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
