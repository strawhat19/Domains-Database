# Expo Upgrades And Dependency Recovery

## Choose The Requested Update

Inspect `package.json`, the lockfile, installed Expo, Node/package-manager versions and any native folders or overrides. Preserve existing user changes and use the target SDK's supported runtime. Distinguish compatible package alignment from an SDK-major upgrade; follow release notes and normally move one SDK major at a time. See [Expo's upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

For compatible dependency alignment within the installed SDK:

```bash
npx expo install --fix
```

When a move to the latest stable SDK is actually requested and appropriate for the starting version:

```bash
npx expo install expo@latest &&
npx expo install --fix
```

Use an explicitly selected target version instead of `latest` for an incremental or pinned upgrade. Expo's CLI travels with its package; use its compatibility metadata rather than upgrading every React/native dependency independently. A failed command after installing Expo can leave the manifest targeting a new SDK while the lockfile and installed optional peers remain on the old one.

## Diagnose Before Bypassing Peers

Read the actual ERESOLVE report and relevant npm log. Compare declared, locked and installed versions for the implicated package and all its required/optional peers, including React, React DOM, type packages and native worklet/animation pairs. Confirm their published peer requirements and Expo's installed compatibility map. An optional peer already present at an incompatible old version can still block the upgrade; the headline package is not necessarily the underlying conflict.

Keep existing provider/React compatibility overrides unless their actual constraints require a change. Do not default to `--force`, `--legacy-peer-deps`, `npm audit fix --force`, deleting the lockfile or removing all installed modules. Audit findings and install-script approval warnings are separate from dependency-resolution failures.

## Recover A Partial npm Upgrade

When metadata confirms a compatible target but a stale tree prevents resolution, a fresh isolated lock resolution can avoid discarding existing work:

1. Preserve the current manifest and lockfile outside the working tree. Align only the requested SDK-compatible declarations, including overlooked type packages.
2. Use an owned temporary directory with the exact proposed manifest and necessary workspace manifests/local package paths. Preserve required package-manager configuration and private-registry access without exposing credentials. Do not assume a single copied manifest is sufficient for workspaces or `file:` dependencies.
3. In that isolated setup, resolve a lock without install scripts:

   ```bash
   npm install --package-lock-only --ignore-scripts --no-audit --no-fund
   ```

4. Inspect the resolved versions and expected transitive changes. Confirm the original project files have not changed concurrently before applying the resolved lock. Then complete the intended project's install under its existing script-approval policy; do not automatically approve every dependency script.
5. Keep rollback copies and explain that compatible transitive packages may advance. Do not claim a working app solely from successful dependency resolution. See [npm install options](https://docs.npmjs.com/cli/v11/commands/npm-install/).

Only run diagnostics or start/build the app when permitted. Optional user-run diagnostics include `npx expo-doctor@latest`; `npx expo start --clear` restarts the development server with a cleared bundler cache. Preserve manually maintained native directories; SDK/native changes can require a new development/native build. Use the [native upgrade steps](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) rather than blindly regenerating native projects.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
