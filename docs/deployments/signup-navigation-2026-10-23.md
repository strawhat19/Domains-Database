# Sign-Up Navigation Repair — 2026-10-23

## Reproduced Failure

Production at `711dcab78a5008478777edb2468d02d2a6f337a2` returned to Home after clicking the guest header Sign Up link. A Chrome navigation check reproduced that behavior without submitting a form. Directly opening `/signup` rendered the guest form normally.

The web UserMenu reuses its native renderer. Its guest Expo Link wraps a React Native Pressable, so the link did not receive RouterAnchor's `data-app-navigation` marker. Expo can update route subscribers before its asynchronous browser-history commit. The AdSense layout effect then saw `/signup` while the address bar still pointed to Home, and its document reset reloaded the old URL. Signup/AuthForm and Firebase session restoration contain no automatic redirect that explains this click.

## Scoped Fix

- Mark the guest header auth link through the existing web-only React Native `dataSet` convention, allowing the owned-link handler to navigate to its full href before Expo handles the click.
- Read Expo's serialized router href instead of combining a new pathname with old browser query/hash values. This uses the installed Expo Router 57 export `useUnstableGlobalHref`; it is marked private/unstable by the SDK and should be checked when upgrading Expo.
- For route changes, pause advertising and navigate to the validated same-origin intended destination when browser history has not committed. Reload in place when the destination already matches. Fragment-only changes also force a fresh document.
- Let actual browser Back/Forward URLs and restored pages take precedence over stale router state, preserving authentication settling and clearing a restored navigation latch.

Authentication, consent decisions, Starter/Owner exclusions, feature settings, billing operations, rules, credentials, and existing package-version edits are unchanged.

## Checks And Release Authorization

The user approved focused regressions, a production export, committing/deploying the repair to `main` once checks pass, and a browser navigation check without form submission. Package-version edits must remain uncommitted.

`node --test --test-reporter=spec tests/adsense.test.cjs` passed 23/23. The specific route-before-browser-history regression fails against the previous runtime from `711dcab` and passes against this repair. Fixtures prevent external requests and database access. Coverage includes exact encoded signup return URLs, paid/Owner/unknown states, consent, safe internal destinations, fragment changes, Back/Forward timing, and restored pages.

The production export passed with 81 static routes and 22 API routes, including `/signup` and `/signin`. It ran with the user's uncommitted package version `0.0.6.7`; those package files are excluded from the release commit. The Git production build supplies the final committed snapshot and production environment. Hosting READY, its exact SHA/domain assignment, and the final Chrome click outcome are separate release evidence.
