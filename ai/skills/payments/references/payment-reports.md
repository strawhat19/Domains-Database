# Owner Payment And Subscription Reports

Use for aggregate business reporting through [Payments](../SKILL.md). Reuse [Admin analytics](../../admin/references/analytics.md) and the [chart/layout contract](../../admin/layout.md) rather than introducing a separate dashboard system.

## Authority, Dataset And Privacy

- Restrict payment reports to the current active trusted Owner by default. Share one capability across menu, direct route, service and server. A paid subscriber, inactive Owner, Admin or Developer label does not grant access without an explicit destination policy.
- Verify the request's identity token, immutable account mapping, current role and active status before returning cached data or starting provider work. Authorization errors and report-cache hits are independent; a cache cannot bypass a role change.
- Fix provider account/mode and application scope server-side. Start from verified private app-account/customer/subscription bindings and allowed price/product/currency/interval mappings; retrieve matching provider objects to confirm those bindings. Never accept an arbitrary account/customer/project URL from a filter or include unrelated merchant business.
- Define the counted cohort explicitly: subscriptions, customers/subscribers, accounts, invoices and payments are different units. Retain required historical bindings after normal account-data resets so cohort history does not silently disappear.
- Return allowlisted aggregates only: totals, buckets, status counts, coverage, source, ranges, freshness and explanatory text. No customer names/emails/addresses, card/payment-method data, raw provider payloads, provider IDs, hosted invoice URLs or unrelated app records. Keep errors and logs free of those values.
- Do not add payment mutations or raw CSV/customer exports to a report request. An explicitly requested future export needs its own permission, scope and privacy review; aggregate charts do not authorize private row access.

## Typed Contract And Missing Values

Return a normalized typed DTO with:

| Field | Meaning |
| --- | --- |
| Source/dataset/mode | Actual provider, app cohort and live/sandbox environment |
| Currency/unit | Declared monetary unit and supported currency/cohort |
| Range | Effective start/end, timezone, selected interval and partial-current-day flag |
| Snapshot timestamp | When current subscription status was observed |
| Totals/trend/statuses | Compatible measured numbers or explicit null values |
| Coverage | Complete/partial/unavailable per dependency, scanned counts and configured bounds |
| Freshness/cache | Actual fetched time, cache age and documented TTL |
| Definitions/warnings | Metric meaning, limitations and observed missing capabilities |

- Use named allowlisted period/filter values, reject repeated/unknown parameters, and bound request/token sizes. Choose supported windows for the destination rather than copying another app's presets or operational budgets.
- Separate unauthenticated, forbidden, invalid input, missing setup, provider-permission, timeout and partial-data outcomes. A failed read must not return success with artificial zeroes.
- Show confirmed complete-empty results as zero only for the declared cohort. If no app-linked customers exist and no Stripe read ran, disclose that provider read permissions remain unverified; this is not evidence that Checkout, reporting or webhook connectivity works.
- Preserve null for any total/bucket whose source was unavailable, capped or ambiguously attributed. An optional partial sum must be explicitly named as a lower bound; do not silently present it as the full period total.
- Display `—` with a visible/accessible Unavailable explanation. Keep zero distinct from loading, setup needed, no matching data, missing measurement and failed refresh. Informational notes on a complete report must not be labelled Partial Coverage.

## Metric Meaning

- Define Paid Invoice Amount as the sum of scoped [invoice `amount_paid`](https://docs.stripe.com/api/invoices/object) in its declared currency, assigned to the selected range using a valid `status_transitions.paid_at`. A missing paid timestamp is unavailable/ambiguous attribution; invoice creation time is not a substitute.
- A paid invoice can be [recorded as paid outside Stripe](https://docs.stripe.com/api/invoices/pay). Paid invoice amount/count is not proof of a Stripe charge, collected bank cash, net revenue, payout or proceeds after fees, credits/refunds and taxes. Add separately sourced measures only when requested.
- Deduplicate invoices and define partial-payment/credit/refund inclusion explicitly. Validate invoice/subscription/item/price/customer relationships; mixed app/unrelated invoice lines need a documented allocation or exclusion policy, not crediting the whole invoice to this app.
- Keep currencies separate unless an explicit conversion method, FX source/time and rounding policy is implemented. Do not sum different minor units under a dollar label; not all currencies have two fractional digits.
- Current active/trialing/past-due/other status counts and scheduled cancellations are a snapshot, independent of the selected historical range. Scheduled cancellation means an indicated future stop, not an already ended subscription.
- Define new subscriptions using actual creation/start semantics and ended subscriptions using the actual end timestamp under the supported provider version. Do not call a cancellation-request timestamp an end, or subscription creations paid new subscribers/churn without the corresponding definition/history.
- Label monthly base plan value as the declared active quantities multiplied by monthly-normalized configured base prices, with its included statuses stated. It is not Stripe MRR unless it matches the provider's [configurable MRR definition](https://docs.stripe.com/billing/subscriptions/analytics), including discount/status/trial/tax treatment; it is not cash or earned revenue.

## Bounded Reads, Cache And Failures

- Set destination-appropriate bounds for database/customer/subscription/invoice/line pages, provider calls, concurrency, retries, timeouts, cache size and request rates. Inspect [pagination cursors and `has_more`](https://docs.stripe.com/api/pagination); page size is not a complete-dataset guarantee.
- Do not treat a creation-time invoice filter as a complete paid-at window: older invoices can be paid now. Use a provider-supported payment-time query, trusted durable history/aggregate, or a bounded scan that proves coverage; report the limitation when it cannot.
- Inspect nested invoice lines and subscription items within the same budgets. Permission failures, provider throttling and unavailable nested pages affect the corresponding metrics' coverage. Restrict credentials to required read operations and record which permission probes actually ran.
- Query only the fixed verified application cohort. Unknown bindings must not be counted or silently reclassified as a proven empty set. Preserve dependency coverage so missing account mappings cannot masquerade as no payments.
- Key short server caches and in-flight deduplication by authorized app/account/environment, dataset, range/filter, currency and adapter version. Preserve original fetched/snapshot/cutoff timestamps on hits; do not replace them with the refresh-click time.
- Abort or reject late browser/native responses on UID/account/permission/filter changes. Verify the Firebase or existing session identity before and after fetch. Clear old account data immediately; a previous Owner's report cannot remain visible for another account.
- A retry may retain an authorized same-account/same-range report with its original fetched time and a conspicuous refresh-failed/stale notice. Never label a failed refresh as new data. A refresh must actually request/revalidate according to the documented cache policy.

## Charts, Lists And Platform Views

- Show selected-period paid amount/count and subscription lifecycle metrics separately from timestamped current status summaries/distribution. Include real source/mode/currency, date boundaries, partial day, coverage and freshness. Do not infer trends from a screenshot, cumulative lifetime total or current status counts.
- Reuse the app's themed Admin widgets, account header actions, responsive spacing and appropriate navigation link from compact overview to the full report. Show only actual supported controls; avoid decorative filters or charts populated by fallback values.
- Support the chosen periods, Refresh and Chart/List with the same DTO. List mode exposes every returned bucket, including nulls. Keep raw customer/provider records out of both presentations.
- Preserve each bucket's time position and break paths at nulls. Render isolated measured points without joining across gaps. Default inspection to the last bucket, retain deliberate selection, and include missing days in the timeline.
- Web inspection supports pointer/tap and an accessible keyboard range control with timestamp, value, currency/unit and missing-state announcements. Native uses measured SVG/chart geometry with supported touch/adjustable controls and an equivalent readable list; rendering the website is not a claim of complete native interaction parity.
- Give plots accessible titles/descriptions, visible focus, descriptive repeated IDs and labelled icon controls. Measure the actual plot container and pointer coordinates; preserve aspect ratio so text, markers and strokes do not stretch when the sidebar or viewport changes.
- Use the destination's thin line weight consistently (normally about 2–2.5 CSS/density-independent pixels), with non-scaling SVG strokes or the library's equivalent. Do not widen lines as charts grow. Respect reduced motion for entrances, drawing, spinners and transitions.
- Choose axis steps appropriate to the base unit: integer counts, whole minor-unit money ticks before formatting, and distinct zero-range labels. If three ticks are zero/midpoint/ceiling, a minimum even integer ceiling avoids duplicate rounded cents and half-count labels. Preserve valid data and null gaps while changing only scale geometry.
- Keep chart reading/plot/timeline visible without an inner vertical scrollbar; bounded scrolling belongs to long list/ranking views. Let warnings/errors increase panel height. Keep all-null charts visibly unavailable rather than suggesting their background zero axis is data.

## Review Evidence

When authorized, focus checks on current Owner authorization before cache, wrong-app/mode/price bindings, mixed currencies, older paid invoices, complete-empty versus failed/partial data, expired cache/role changes, stale account responses, null gaps and whole-unit axes. Provider reads, focused tests, build, runtime inspection and deployment each establish different facts.

Do not issue a test charge or create a customer/subscription solely to make a report nonempty. Record zero provider reads honestly and ask only for genuinely missing authorization or information under the parent task's existing scope.

Copyright (c) 2026 strawhat19. Licensed under [MIT](../../../LICENSE).
