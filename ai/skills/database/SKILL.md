---
name: database
description: Create or update typed records, realtime Firestore persistence, app-owned IDs, private account storage, and explicitly chosen local adapters.
---

1. Read [database.md](database.md) when changing storage, models, CRUD persistence, or data migration. Preserve existing data and the shared adapter; read [Admin guidance](../admin/admin.md) for connected Firebase listeners, account mappings, counters, and rules.

2. Read linked API or authentication guidance for those concerns, and social guidance when storing profiles, posts, relationships, or messages. Respect the repository's validation instructions.

3. Read [Firestore resource selection and cutovers](references/firestore-operations.md) for requested provisioning, named-database wiring, consolidation or migration. Confirm API/realtime capabilities and the user's actual target before creating an extra resource or replacing one.
