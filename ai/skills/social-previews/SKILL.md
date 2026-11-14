---
name: social-previews
description: Add or replace a branded wide social link-preview card (Open Graph and X/Twitter large image) for an Expo web/static app. Use when shared links should show a branded image, or when preview artwork is being revised.
---

# Social Link Previews

1. Artwork: one branded 1200 × 630 PNG using the app's existing logo, fonts and palette, plus a short brand line and the canonical public hostname. No account data or changing counts. Store it under a public path with a versioned filename (e.g. `public/media/socials/<app>-preview-v1.png`). When replacing approved art, add a new version and update the shared path; keep earlier versions and their prompt/mockup notes (e.g. `assets/concepts/...`).
2. Generator: keep a re-runnable script in `scripts/` (`generate-social-preview.ps1` or `.py`) that composes or resamples the master to 1200 × 630 without inventing new text or logos.
3. One shared config module (e.g. `src/shared/social.ts` or `src/shared/config/social.ts`) holds image path, dimensions, alt text and an absolute-URL helper. The origin comes from the app's domain config; a valid HTTPS `EXPO_PUBLIC_SITE_URL` origin may override it (reject paths, credentials, queries, fragments).
4. Metadata: emit Open Graph and `twitter:card=summary_large_image` tags in the exported static HTML (`app/+html.tsx`, one shared SocialMeta mount, or the export SEO script), not via hydration. Include absolute HTTPS image URL, secure URL, PNG type, width/height and alt text. Keep existing route titles, descriptions, canonicals, custom images and robots rules authoritative; fill only missing fields.
5. Scope: public pages, articles/blog and populated categories get the card. Account, auth, saved, notification, noindex and unresolved/unknown routes get no social block and never claim another page's canonical or `og:url`.
6. Verify (when checks are authorized): export the web build and confirm each public HTML page has exactly one complete social block, correct per-route canonical, matching OG/Twitter copy, and that the image returns 200 `image/png`. A crawler user agent should get the tags without JavaScript.
7. Report honestly: source prep, export, deploy and platform cache refresh are separate outcomes. Don't post to social platforms to test.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
