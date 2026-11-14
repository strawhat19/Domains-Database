---
name: local-development
description: Configure local environment files, pull hosted variables, upgrade Expo dependencies, or repair a partial package installation. Use for requested setup, maintenance or dependency failures; an ordinary feature edit does not request an SDK upgrade or release.
---

# Local Environment And Dependency Maintenance

Preserve the destination's framework, package manager, lockfile policy, private configuration and uncommitted work. Read its AGENTS.md and the [structure](../structure/structure.md) and [API](../api/api.md) boundaries. Identify whether the request is documentation, configuration, dependency installation, diagnostics or a release; writing a command example does not authorize running it.

- Read [Environment Files And Hosted Variables](references/environment.md) for Vercel pulls, dotenv consumers, public build values and safe project selection.
- Read [Expo Upgrades And Dependency Recovery](references/expo-upgrades.md) for compatible SDK updates, peer conflicts and interrupted npm upgrades.
- Use [Deployment](../deployment/SKILL.md) only when publishing or changing hosted configuration is in scope. Database creation or migration follows [Firestore operations](../database/references/firestore-operations.md).

Check installed versions and current primary documentation before choosing version-specific commands. Prefer the existing package manager and supported runtime; preserve necessary overrides and native changes. Explain potentially lengthy installs before starting them, and follow AGENTS.md for tests, builds, UI checks, commits and deployment. Record actual dependency/configuration changes separately from app behavior that has not been exercised.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
