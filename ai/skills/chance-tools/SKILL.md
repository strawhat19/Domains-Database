---
name: chance-tools
description: Build reusable chance-based choice tools with honest probability, deterministic reveal animations, local data boundaries and accessible controls.
---

# Chance-Based Tools

Use for randomizers and playful decision interfaces. Preserve the requested framework and data ownership model.

1. Keep one typed reusable option model and shared list state across tools. Treat labels, colors and emojis as presentation; validate optional finite nonnegative weights. Default to equal chances and show exactly when weights apply.
2. Use an appropriate cryptographically secure entropy provider without a silent Math.random fallback. Use rejection sampling for bounded integers. Reject invalid ranges, zero eligible weight totals and impossible without-replacement counts.
3. Decide the outcome before starting a wheel, race, battle or reveal. Animation illustrates that immutable outcome and must not bias or reroll it. Keep result snapshots stable if options change or winners are removed.
4. Explain each tool's mapping and limits. Require two entries for a two-choice coin. Avoid biased modulo mappings from fixed dice to arbitrary lists. Distinguish random ordering, balanced teams, per-match brackets and single weighted picks.
5. Keep AI evaluation distinct from chance. A disconnected AI concept cannot generate fake arguments, imply a configured model, or label a random pick as a reasoned recommendation.
6. Put state and persistence behind shared typed adapters and contexts. Validate versioned saved data, preserve unreadable records until explicit recovery, propagate write failures, and identify device-local data. Never represent local browser state as cloud identity, authorization, sharing or analytics.
7. Support keyboard and touch edits/reordering, visible focus, readable result announcements, optional sound and supported haptics. Respect reduced motion and stop unnecessary background animation. Cancel pending effects on unmount and commit each revealed result once.
8. Keep account, payment, AI, ad and cloud adapters unconnected when excluded. Clearly separate working local features, visual concepts and actual integration prerequisites. Follow repository rules for checks, commits and deployment.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
