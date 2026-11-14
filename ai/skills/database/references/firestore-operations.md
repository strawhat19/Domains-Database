# Firestore Resource Selection And Cutovers

Use this reference for requested Firestore provisioning, named-database selection, consolidation or migration. Preserve the existing provider and narrower resource scope. Copying the pack, fixing client code or choosing Firestore does not authorize deleting another database. Follow [the account/rules contract](../../admin/references/firestore.md) and [release guidance](../../deployment/SKILL.md).

## Select The Actual Resource

Record the intended cloud project, database ID, region, edition/API mode, realtime-listener support, billing/free-tier eligibility and deletion protection before provisioning. These are separate properties; a database with a familiar display name or an Enterprise label is not proof that the app's Firestore SDK and listeners are supported. Recheck [current database management](https://firebase.google.com/docs/firestore/manage-databases) and creation API/provider documentation for naming and immutable settings.

When the user requests one Firestore database, identify and reuse the intended compatible resource. Do not silently create a second database, switch to a MongoDB-compatible API, change region, or select a different project to work around quota or mode errors. Explain a real incompatibility and reuse the user's explicit target decision. A requested display name may need a valid normalized resource ID; do not promise a rename unsupported by the provider.

For a named database, map every reader/writer explicitly: client SDK initialization, server/Admin SDK initialization, functions environment, rules release, indexes and hosted client build variables. A changed local default cannot correct an existing environment override or an old compiled client bundle. Keep the concrete map and resource IDs in destination configuration/docs outside `ai/`.

## Preserve Data Before A Destructive Step

If an immutable creation option requires replacement, first prepare a concrete migration/recovery plan within existing authorization. Determine whether source data exists through the correct native interface and a complete inventory, including subcollections. A limited query, missing parent document, empty UI panel or wrong database connection is not proof that a source is empty.

Preserve a private lossless backup and an inventory of document paths, counts and raw value types. Retain app-owned IDs/numbers, counters, UID mappings, roles, profile fields, timestamps, references, bytes and nested data. Ordinary JSON coercion can change Firestore value types. Keep backup artifacts and provider credentials out of Git and user-facing logs.

For an authorized cutover with active writers, block the relevant new writes and account for direct clients, background jobs, privileged functions and in-flight work. Record how writes will be restored and verify the fence at its actual boundary. Drain existing work before the final snapshot; copying once while writers remain active does not prove a consistent migration.

## Switch In A Compatible Order

Prepare destination rules/indexes and compatible server/client configuration before reopening traffic. Use an idempotent copy/import that preserves stable paths and typed values; compare the completed destination against the fenced final source snapshot. Keep a resumable record of actual provider operation IDs and completed stages rather than restarting a live creation/deletion job after a timeout.

Update only the authorized functions/services and hosted environment targets. An environment-only rebuild should use the intended committed source snapshot and preserve unrelated local edits. Verify named rules release content, required index readiness, function database configuration and the actual served public database selection separately. Hosting READY alone does not prove those boundaries agree.

Retain the source and rollback material until destination data and required access/configuration evidence are sufficient. Remove a superseded source only within the user's explicit deletion scope; handle deletion protection, ID reuse windows and asynchronous completion as provider constraints. A source retirement must not remove an unrelated default/named database or other app's resources.

## Evidence And Recovery

Report source changes, applied configuration, typed-data comparisons, write restoration, operation completion, and the real validation scope separately. Poll the same confirmed live operation after observation timeouts; a transient read error is not proof of completion or disappearance. Keep backend/API checks and authenticated/native UI flows within their authorization. Restore the recorded write policy and compatible routing/configuration on failure; an app rollback does not undo migrated data or resource deletion.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
