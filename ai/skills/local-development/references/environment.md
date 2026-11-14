# Environment Files And Hosted Variables

## Resolve The Consumer And Target

Inspect the app root, package scripts, dotenv loader and existing local files before choosing `.env` or `.env.local`. A frontend CLI, app-config script and standalone server script can load different files. Preserve unrelated values and keep downloaded private values and backups out of Git. Never print tokens, file contents or secret-bearing command arguments to diagnose configuration.

On Vercel, confirm the linked project/team and requested Development, Preview or Production target. In a monorepo, resolve the app directory explicitly; a logged-in account or nearby `.vercel` directory alone does not prove the intended project. For an authorized fresh setup, interactive linking lets the user select an existing project. See [project linking](https://vercel.com/docs/cli/link).

## Git Bash Examples

Run from the intended app root. These are examples for the user to execute, not an automatic setup or release:

```bash
npx vercel@latest login
npx vercel@latest link
```

Back up an existing destination before pulling. Choose one environment:

```bash
npx vercel@latest env pull .env.local --environment=development
```

```bash
npx vercel@latest env pull .env.local --environment=preview
```

```bash
npx vercel@latest env pull .env.local --environment=production
```

Replace the destination with `.env` only when that is the actual consumer's file. Recheck installed CLI help and [current pull behavior](https://vercel.com/docs/cli/env): merge/overwrite behavior and unreadable Secret placeholders can vary by version. A pull is not a complete backup of Production secrets. Retain or supply appropriate local Development credentials rather than weakening hosted Secret settings.

## Public And Private Values

Treat public-prefix values as part of the shipped client. For Expo, `EXPO_PUBLIC_` values are inlined into client code; private provider credentials stay behind server boundaries. See [Expo environment loading](https://docs.expo.dev/guides/environment-variables/).

After changes, reload or restart the actual consumer as required by its installed loader. Rebuild/redeploy only within the authorized release scope when public compiled configuration must change. A local file edit does not update hosted functions, the served client bundle or native binaries. Do not use shell `source`/text rewriting as a general dotenv parser; use the destination's supported loader.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
