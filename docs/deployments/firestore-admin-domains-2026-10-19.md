# Owner Dashboard Domain Query Fix

Published to the existing `domainsdatabase-e62a3` default Firestore database. Authenticated management readback confirmed the release at `2026-10-19T04:30:48.562Z`.

The dashboard reads `collectionGroup('domains')`, ordered by `number` descending with a limit of 501. The previous live rules used a root-dependent Owner wildcard that could not authorize this collection-group query, causing the shared admin snapshot to fail with a permission-denied error.

The [published source](firestore-admin-domains-2026-10-19.rules) adds only:

```text
match /{path=**}/domains/{recordId} {
  allow list: if isOwner() && request.query.limit != null && request.query.limit > 0 && request.query.limit <= 501;
}
```

The existing `isOwner()` requires a signed-in identity mapped to an active account with the authoritative Owner role. All previous live rules remain byte-identical outside this insertion. The full repository `firestore.rules` was not published with this focused fix.

- Active ruleset: `projects/domainsdatabase-e62a3/rulesets/f3fca81a-f3a4-4675-817d-df650649ebf7`
- Previous ruleset retained for recovery: `projects/domainsdatabase-e62a3/rulesets/b129b77b-d067-4dc6-afde-a88019683eac`
- Normalized source SHA-256: `a3411529731e972a64054cd7c3667e6b6687015d3e011d31d9bbf88ce39ba972`

Firebase compiled the source with no issues, and live release/source readback matched the published snapshot. The existing `domains.number DESCENDING` collection-group index was confirmed READY. No account roles, account data, indexes, or unrelated cloud configuration were changed. App/UI behavior was not exercised; the failed dashboard listener must be reattached using Refresh.
