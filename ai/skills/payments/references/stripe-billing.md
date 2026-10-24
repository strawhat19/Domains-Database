# Stripe Billing And Entitlements

Use for real Stripe subscription work requested through [Payments](../SKILL.md). Preserve working provider integration and destination naming rather than scaffolding a second billing system.

## Discovery And Price Authority

- Identify the selected Stripe account and live versus sandbox context before account-specific operations. Inspect available tool schemas and authorized capabilities. Prefer installed provider tools/docs; use current official documentation as fallback. Missing tool authentication does not authorize a different account, key, installation or environment.
- For new development, consider an isolated sandbox; preserve an existing chosen setup. [Sandboxes](https://docs.stripe.com/sandboxes) isolate test objects/settings from live mode. Do not create one or generate sample transactions without the corresponding scope.
- Inspect installed SDK types and pinned API/webhook versions before using object fields. Follow current compatible contracts rather than copying an old payload or silently upgrading dependencies. For example, [billing periods moved to subscription items](https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-subscription-current-period-start-and-end); invoice parent/pricing fields also vary by API version.
- Read the actual catalog, price objects, currency minor-unit rules, intervals, quantities, existing subscriptions, supported features and quotas. Discover all relevant bounded pages; a partial catalog is not all offers.
- Maintain an explicit server-controlled offer-to-price mapping. Verify provider account/mode, product, currency, amount, recurring interval, permitted quantity and offer availability. A client-supplied price, public catalog edit, URL parameter or selected card cannot choose an arbitrary provider resource or grant access.
- Reject stale price/interval submissions and ask the UI to reload the real offer. Introduce migrations or price replacements deliberately; preserve legitimate existing subscriptions. Do not silently rewrite commercial terms to match code.
- Implement only supported products and features. Keep planned offers and unavailable actions truthful. Do not invent tax/refund policies, claim unsupported business workflows are complete, or advertise ad removal without an actual advertising consumer.

## Secrets And Hosting

- Prefer a [restricted server API key](https://docs.stripe.com/keys) with the read/write permissions required by the actual Checkout, Portal, reconciliation and report operations. A key that creates Checkout may still lack reporting reads. Publishable keys are public; restricted/secret keys and webhook signing secrets are private and distinct.
- Keep provider keys and server database credentials in ignored local configuration and the intended hosting environment. Never place them in public framework variables, client imports, public records, HTML, build logs or ordinary errors. Report configuration names/presence without values.
- Have the user complete required email/MFA challenges directly with the provider; do not request codes or secret values in chat. If a one-time key dialog closes without a confirmed secure save, treat that value as unavailable rather than claiming it was copied. Recover or rotate only within the authorized credential scope; continue independent source work while setup is missing.
- When a Firebase Admin credential is supplied as JSON, preserve its complete valid JSON/private-key newlines in server-only environment configuration; validate by parsing privately, not printing it. For another database, retain its existing server credential and RLS/server helper boundary.
- Use framework-supported server routes/runtime and secret access. Importing the server SDK or listing environment names does not prove connectivity. Redeploy after runtime or build-time configuration changes where the host requires it, and verify the intended revision/alias before claiming release.

## Identity And Private Records

- Every user-initiated billing request verifies the identity token/session, resolves the immutable app-account mapping, and checks the current active account. Derive the actor server-side; reject caller-supplied authority or mismatched UID/account/customer/session/subscription bindings. Stripe webhook requests use their separate verified-signature boundary below.
- Keep customer/subscription/session/price references in private server-owned billing records. Public Users, profile projections and published plan documents contain no provider credentials or private billing objects. Do not match customers by email alone.
- Bind resources to the selected provider account/mode, destination project/app and app account. Metadata is supporting evidence, not the only authority. Legacy records without a new metadata key require an explicit verified binding/migration policy; never adopt all customers on a shared Stripe account.
- Preserve existing app-owned IDs/primary keys, including UUID-based SQL schemas; store Stripe IDs in named fields. Where the destination uses the Firestore/sequential-number convention, allocate records/counters atomically with matching numbers in IDs such as `Type_Number_Name_Date_UUID`. Do not impose an ID/number migration to add billing. Infrastructure lookup/lock keys retain their documented exception.
- In Firestore, keep private billing mappings and a minimal own-account entitlement mirror server-written, with restrictive read/list/update rules. Protect equivalent tables through RLS and trusted server operations in SQL/Supabase. Server/Admin credentials bypass client rules and must authorize independently.
- Account data reset does not cancel an external subscription. State that clearly and provide Manage Billing. Before removing identity bindings, implement the chosen continuing-billing lifecycle: retain a recoverable private mapping, perform verified cancellation when authorized, or use another deliberately supported transition. Prevent orphaned subscriptions/duplicate purchases under the actual deletion/retention policy; do not invent that policy.

## Checkout, Portal And Return Flow

- Use server-created subscription Checkout sessions for supported recurring offers. Display real price/currency/interval, renewal behavior, cancellation route and the relevant terms before the action. Persist no fake purchase or entitlement when a user reviews an offer.
- Create Portal sessions only for the current account's verified customer and the intended Portal configuration. Expose only configured actions. [Portal integration](https://docs.stripe.com/customer-management/integrate-customer-portal) requires its own configuration and subscription-update handling.
- Set server-controlled allowed return/success/cancel URLs. Before opening a returned hosted URL, validate HTTPS and an exact documented Stripe or deliberately configured custom host; reject credentials, unexpected ports and unrelated redirects. Do not accept arbitrary caller destinations.
- Preserve sign-in continuation without treating its selected plan as authorization. Recheck current identity before and after client fetches and before opening Checkout/Portal. Abort/time out stale work, clear state on account changes, and guard late completions with the account scope.
- The success URL is a navigation signal. Reconcile the returned session through a server endpoint that verifies its app/account/customer/mode and current subscription/payment state. Show processing, failed, cancelled-return and confirmed-success states; payment cancellation is not subscription cancellation.
- Listen to the trusted entitlement source after return. Bounded polling can assist eventual webhook propagation, but a timeout cannot become success. Explain pending confirmation and offer a permitted refresh or billing management action.

## Duplicate And Uncertain Attempts

- Persist a stable purchase-attempt identity and matching [idempotency key](https://docs.stripe.com/api/idempotent_requests) before a potentially ambiguous provider call. Retries use the same parameters/key. Serialize conflicting account operations with the destination's durable transaction/lease mechanism.
- Recheck live current subscriptions while holding the account operation guard. Reuse a valid open session; handle completed/expired/terminal state explicitly. A completed checkout awaiting reconciliation must not permit another purchase.
- A network error or expired local lease does not prove Stripe created nothing. Before abandoning an uncertain attempt, recover its known session or inspect a bounded, verified app/account-scoped session set; close/reconcile existing open or completed work safely.
- Do not assume a fixed key-retention interval or local retry timer proves that an old hosted session is unusable. If recovery is incomplete, capped or ambiguous, return confirmation-pending instead of creating a second subscription.
- Commit the recovered/new session reference and attempt state durably. Handle partial database/provider failures with retry-safe recovery, not a new random key on every click.

## Webhook Reconciliation

- Read the unmodified request body and verify `Stripe-Signature` with the official library and the selected endpoint's signing secret before parsing trusted event data. Respect framework body handling, signature tolerance and request-size bounds. [Webhook guidance](https://docs.stripe.com/webhooks) also covers duplicates, retries and unordered delivery.
- Validate live/test context, expected event/object types and every app/account/customer/subscription binding. Listen to relevant checkout, subscription and invoice/payment events for the destination's supported lifecycle, including delayed payment and cancellation states where applicable.
- Deduplicate event deliveries and make semantic transitions idempotent. Do not rely on event creation timestamps as a total ordering. Re-read current authoritative Stripe state under an account guard/version scheme so an old event cannot restore expired paid access.
- Mark work complete only after the state update commits or the verified event is durably queued. Return failures for retryable processing errors; do not acknowledge a lost update. Keep endpoint handling bounded and return promptly after durable acceptance.
- Do not trust an `active` string alone as proof of a paid period. For a policy requiring paid access, verify the permitted price/item and a matching paid invoice/line with a valid started, unexpired service period. Use the actual versioned fields, fetch required nested pages within budget, and refuse ambiguous attribution.
- A genuine trial grants access only if the destination supports it and its verified trial window has started and remains valid. Free/zero-price, coupon, credit, manual payment, grace-period and delinquency cases need explicit destination policy; do not infer one from a Checkout completion flag.
- Project only necessary server-owned status, plan, period and expiry fields to the entitlement mirror. Avoid unchanged writes. Protect both the mirror and any legacy plan fields against self-promotion.

## Enforcement And Subscription Changes

- Declare how each verified lifecycle state affects access and billing management. [Period-end cancellation](https://docs.stripe.com/billing/subscriptions/cancel) differs from immediate cancellation: retain the authorized paid period, show scheduled cancellation, and revoke expired access at evaluation time even if the next webhook is delayed.
- Evaluate current access from trusted state plus its validity window. A confirmed absent subscription can resolve to the declared Free baseline; unreadable, malformed or pending state remains unavailable and cannot grant paid access. Do not display a paid label while hydration is unresolved.
- Apply effective feature eligibility in shared UI, direct routes, API/provider calls, services and database enforcement. Reuse actual saved feature audiences and catalog rank metadata; catalog publication or rank changes never assign a purchased entitlement.
- If the destination grants active Owners full access, derive that bypass from the trusted current role/status, independently of paid-plan status. Do not force an Owner to buy, assign a paid role on payment, or give Admin/Developer report access implicitly. Preserve explicit global feature/audience policies and role-versus-plan display rules.
- Enforce quotas atomically at the authoritative write boundary. Cover single/bulk creation, imports, transfers, connection syncs and every count-increasing path. Use trusted counts/transactions or constrained rule checks, not a client-loaded list length; server/Admin paths cannot skip the same policy.
- Bootstrap/reconcile new usage counters against authoritative existing membership; an absent counter is not zero. Commit counter and membership changes together so retries or concurrent writes cannot lose usage or manufacture capacity.
- Treat over-limit downgrade as a declared read/recovery state: retain permitted read/export/delete operations and block new count-increasing writes. Do not delete user data or silently truncate cloud records to satisfy a smaller limit.

## Evidence And Focused Review

Review wrong-account/mode/price attempts, duplicate clicks, uncertain provider timeouts, replayed/out-of-order events, expired mirrors, account switches, quota races and cancellation transitions when validation is authorized. Missing configuration and failed permission probes remain explicit.

Source review, configured resources, provider readback, deployed rules/runtime, delivered webhooks and completed transactions are separate evidence. Follow AGENTS.md and the user's testing/release scope; never create a live charge or cancellation as an automatic readiness check.

Copyright (c) 2026 strawhat19. Licensed under [MIT](../../../LICENSE).
