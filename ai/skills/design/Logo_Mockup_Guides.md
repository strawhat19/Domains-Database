# Logo and Mockup Guides for AI

Use this guide whenever asked to explore or extend visual concepts in a project under this Library. Treat every version as a reviewable design round, not a replacement for an approved identity.

## Read the project first

1. Locate the exact project repository and read its `AGENTS.md`, if present, plus the Library `AGENTS.md`.
2. Read the project README, product copy, and existing brand or visual files. Learn the project's purpose, audience, exact display name, current colors, and any motifs worth retaining.
3. Inspect `assets/concepts/logos/` and `assets/concepts/mockups/` before writing. Do not infer the latest version from a filename alone; look at the numbered folders.
4. Preserve every existing concept. Never overwrite or rename an earlier version unless the user explicitly requests it.

## Folder and version rules

Use these paths relative to each project's root:

```text
assets/
  concepts/
    logos/
      v1/
      v2/
      v3/
      ...
    mockups/
      v1/
      v2/
      ...
```

- For an established project, create the next unused numbered logo folder (`v4` after `v3`, for example). Do not skip ahead because a mockup folder has a higher number; logo and mockup versions are separate series.
- For a new project, start at `v1`. If asked for multiple rounds at once, create `v1`, `v2`, `v3`, and so on. Each round should explore a meaningful design direction rather than only change colors.
- Keep concepts inside the relevant project repository, not in a shared output directory.
- Name files with a two-digit order and a readable idea: `01-connected-mark.svg`, `02-type-lockup.svg`. A version folder should include a `README.md` describing each file and its color palette.
- Leave implementation assets and application code untouched unless the user asks to adopt a chosen concept.

## Logo concept workflow

1. Define two to four distinct directions for the round. One may refine a previous favorite; the others should test different symbols, geometry, or typography.
2. Make at least two finished concepts in each requested version folder. Prefer editable SVG for clean, scalable logo artwork. Use raster image generation only when the requested visual calls for it; save any selected raster output into the project folder.
3. Use the project's exact spelling and capitalization. Keep wordmarks short and readable. Avoid third-party trademarks, copied icons, and unlicensed likenesses.
4. Give each SVG a transparent surrounding canvas, a useful `viewBox`, an accessible `<title>` and `<desc>`, and a mark that can plausibly work at small size. A lockup may pair the mark with a wordmark.
5. Make the difference between concepts visible in silhouette, layout, or idea. A color swap alone is a variant, not a new concept.
6. In the version `README.md`, identify each concept's idea, colors, and likely use (app icon, avatar, header, or other context). Note any deliberate continuation of a prior round.
7. When asked for mockups as well, place them in `assets/concepts/mockups/vN/` with their own README. Show how the proposed logo appears in a realistic context, such as an app icon, header, stream overlay, package, or device screen. Label mockups as concepts and retain the editable logo source in `logos/vN/`.

## Repeating this process

Use this request template for another AI run:

> For each named project, inspect its local instructions, product context, and existing concept folders. Create the next unused `assets/concepts/logos/vN/` folder, or start at `v1` for a new project. Add at least two distinct, editable SVG logo concepts and a README that explains the ideas and palettes. Preserve all earlier versions. Create mockup concepts in the separate `assets/concepts/mockups/vN/` series only if requested. Report the exact folders created and leave adoption of a concept to the user.

When the user asks for several new rounds at once, repeat the logo steps in separate `v1`, `v2`, `v3`, etc. folders. Carry forward useful discoveries from one round without making later rounds near duplicates.

## Project instruction in this Library

The Library's `AGENTS.md` asks AI agents making code changes to keep them minimal and to leave verification, testing, and builds to the user before committing. Follow the more specific instructions in a project if they apply. Creating concepts does not require changing application code.