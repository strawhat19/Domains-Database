# Guarded Auto Ads Activation — 2026-10-23

## Scope And Source

Starting source: `8aeef33d29929ef5cd6d40f599ef0f3d5432f713`. The original release had publisher verification metadata and ads.txt, but no advertising loader. This change adds a web-only, consent-aware Auto ads controller and positively confirmed Free eligibility. Native remains a no-op. Existing billing access, quotas, subscription writes, rules, schemas, roles, and payment operations are unchanged.

Starter and active Owner accounts are excluded before Google code loads. Unknown, loading, failed, stale, pending, or malformed identity/billing/feature states suppress loading. Public plan-catalog metadata is not an entitlement. Returning from an advertising page to another route or account pauses requests and reloads the document, with sign-in transitions allowed to settle first. Only app-owned navigation links are intercepted, preserving Google's consent controls.

Eligible paths: `/`, `/about`, `/blog`, and the actual eight first-party guide paths. The origin must be exactly `https://domaindatabases.com`, without a query string or fragment. Other workflows and domains do not load the advertising script.

## Observed And Changed External Settings

- Public publisher ID: `pub-8379301195677583`; the script client is `ca-pub-8379301195677583`.
- Google Auto ads for `domaindatabases.com`: observed On; no Auto ads setting was changed.
- European message: published for this site. Corrected its Privacy URL to `https://domaindatabases.com/privacy` and enabled Do not consent across its covered regions, then published the changes. The account's existing common-partner selection (198 partners), fallback coverage, and unrelated site messages were left unchanged.
- US message: created `US states message - domaindatabases.com`, English (en-US), covering all current and future supported US states. Used the text-only confirmation header and published. Fresh table readback showed Published and the privacy overview showed one active US message.
- Existing Firestore `featureSettings/FeatureSettings_1_Global_12_00_AM_10_12_26_cb23b14255924fdd95957eac7ca7e35e`: changed only `flags.ads` to true and its update timestamp, using a field mask and update-time precondition. Independent readback confirmed Ads enabled and all other flags unchanged. Database update time: `2026-10-23T19:33:40.882827Z`. Audiences, rules, indexes, access, and cloud credentials were not changed.
- Fresh Google Sites status: Getting ready. Google's Ads.txt column still reported Not found. A separate direct HTTP read at `2026-10-23T19:38:27.004Z` returned 200, `text/plain; charset=utf-8`, with exactly `google.com, pub-8379301195677583, DIRECT, f08c47fec0942fa0` and a final newline, without a redirect. This proves the current endpoint is available; it does not prove Google's crawler has refreshed, site approval, or ad delivery.

## Validation And Release

The user approved isolated eligibility/consent lifecycle tests and a production export. `node --test --test-reporter=spec tests/adsense.test.cjs` passed 16/16 after the final runtime and app-owned link marker changes. Fixtures replace Firebase, browser APIs, and Google script behavior; they make no ad requests or payment/subscription changes. Cases cover actual editorial routes, every eligibility guard, malformed/continuing/paid billing, paused single loading, TCF and US/GPP readiness/refusal/withdrawal, account/route changes, restored pages, sign-in settling, disposal, and CMP links remaining untouched.

Final `npm run export:web` exited 0 at package version `0.0.6.6`, producing 81 static routes and 22 API routes. Its web entry bundle is `entry-869327d8c1de7f6e5b1c4ff920f0e31d.js`. The export reported the environment's NO_COLOR/FORCE_COLOR warning; no export failure occurred.

TypeScript comparison against clean `8aeef33`: both snapshots produced the same 46 normalized diagnostics, with zero added or removed diagnostics. The project-wide type check is not clean; this change introduces no additional diagnostic in that comparison.

On 2026-10-23, the user approved committing these reviewed changes, pushing `main`, deploying to `domaindatabases.com`, and checking the release without live ad requests or payment changes. The release uses the existing GitHub-to-Vercel production integration. Hosting readiness must be established from the deployment's reported source SHA, production target, READY state, domain assignment, and direct HTTPS delivery; the live consent messages and Ads feature setting alone are not deployment evidence. Google's approval and actual ad delivery remain external conditions after release.

## References

- [Official Auto ads setup](https://support.google.com/adsense/answer/9261307?hl=en)
- [Official request pausing](https://support.google.com/adsense/answer/9042142?hl=en)
- [Google CMP API](https://developers.google.com/funding-choices/fc-api-docs)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en)
