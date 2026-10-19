# Optional Contact Phone Number

Published to the existing `domainsdatabase-e62a3` default Standard Firestore database at `2026-10-19T05:44:05.436382Z`. The [published source](firestore-contact-phone-2026-10-19.rules) preserves the previous live rules outside the contact submission validator.

The validator now allows an optional `phone` field containing a string of up to 40 characters. It remains absent from the required keys. Existing field constraints, atomic counter allocation, feature availability, Owner-only reads, and status-only updates are unchanged. The previous Owner dashboard collection-group rule is preserved. The full repository rules file was not published.

- Active ruleset: `projects/domainsdatabase-e62a3/rulesets/267e5132-6f07-4449-bf53-420ae9f1e123`
- Previous ruleset retained for recovery: `projects/domainsdatabase-e62a3/rulesets/f3fca81a-f3a4-4675-817d-df650649ebf7`
- Published source SHA-256: `69e88651445f7093f8a490343e6a87b679091900608c71a4d3f60e195df1d3b8`

Firebase accepted the ruleset, and authenticated release/source readback matched the published snapshot. The shared service trims phone values and omits blanks; older records without a phone remain readable. Web/native contact forms and the Owner inbox include the optional field. No contact submission was created, and no application build, tests, or UI checks were run.
