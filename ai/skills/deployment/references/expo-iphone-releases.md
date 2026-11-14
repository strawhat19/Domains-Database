# Expo iPhone Releases Without App Store Review

Use for Expo apps that should run on Rakib's iPhone straight from main. Keep the concrete Expo project, bundle ID, OAuth client IDs and evidence in the destination's docs (e.g. `docs/ios-releases.md`), never in ai/.

## Default: Expo Go preview from main
- `.eas/workflows/expo-go-main.yml`: on push to `main` (and `workflow_dispatch`), one `update` job publishes an iOS EAS Update to branch `expo-go` using the `production` Expo environment. Use `concurrency: { group: expo-go-main, queue: max }` so older commits can't publish after newer ones.
- A non-secret env flag (e.g. `<APP>_EXPO_GO=1`) switches the runtime policy to app-version for the Go preview; normal config keeps fingerprint runtime for standalone builds.
- Needs no Apple Developer membership and no running dev server. Native modules not bundled in Expo Go (e.g. native Google sign-in) are unavailable there; provide a fallback such as email sign-in.
- The `production` Expo environment holds only `EXPO_PUBLIC_` values; server credentials stay out.

## Optional: free personal-signed standalone app
- A `personal` eas.json profile with a custom build (`.eas/build/ios-personal.yml` + a helper script) archives a Release arm64 iphoneos app and exports an unsigned IPA plus build evidence. Rakib signs it himself (e.g. Sideloadly on Windows, 7-day profile); agents never enter Apple credentials or 2FA.
- `.eas/workflows/ios-main.yml` on push to main: `fingerprint` job, then `get-build` (profile personal, channel production, internal, `wait_for_in_progress: true`, matching fingerprint). If a compatible build exists, publish an OTA `update` to channel `production`; otherwise `build` a new unsigned IPA. A `force_build` dispatch input forces a rebuild.
- JS updates can't renew signing or replace native code; native changes need a new IPA.

## Paid option
- A `preview` profile with managed internal distribution needs an active Apple Developer membership and registered device; bootstrap interactively only when Rakib adopts it.

Report workflow success, published bundle and physical-device behavior as separate evidence.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
