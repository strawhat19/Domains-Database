---
name: scroll-reveals
description: Implement branded page transition loaders, a coordinated first-paint homepage handoff, and quiet scroll-in reveals for sections, cards and headlines on web and native. Use for loader entrance or exit, content that appears or animates twice, and tuning or excluding reveal targets.
---

# Scroll-In Blur Reveals

When asked to “give me page transition loader into home page,” follow [Page Transition Loader And Home Reveal](references/page-transition-loader.md). Start with the destination app’s logo, theme, layout, and existing motion.

1. Use one shared switch for decorative reveals. When off, render reveal targets in their settled state. Keep the app’s actual loading, error, and readiness UI available.
2. Web: one page-level hook (e.g. `usePageReveals(rootRef)`) mounted on the page content root, reset on route change, adapting to reduced-motion and page-transition state. Prepare targets while the transition covers them and release them when the overlay hands off to the page. Skip enhanced reveals when reduced motion is on or the required browser APIs are unavailable.
   - Discover targets inside `main` and the footer in tiers: panel hosts, split-text hosts, hero details, innermost cards, leaf sections, then headings/paragraphs/list items. Never nest reveals: skip an element whose ancestor already owns one or that contains a protected descendant.
   - Keep dialogs, alerts, live announcements, sticky or fixed surfaces, the site header, account rails/tabs, marquees, and skeleton loaders out of the generic content scan. Use the surface’s own lifecycle for its entrance or animate its decorative paint independently. Skip `[hidden]`, `[inert]`, `[aria-hidden="true"]`, visually hidden text and explicit opt-outs such as `data-no-blur-reveal`.
   - Track waiting and in-flight targets and remember which elements have played per route. Release already visible elements at the handoff. Use IntersectionObserver for the rest. A small positive threshold works for controls. Use a viewport-sized anchor or first intersection for a tall panel that might never meet a percentage threshold.
   - Stagger siblings in short groups (about 45–85 ms steps); allow a per-element delay override. Validate timing inputs with `Number.isFinite` and use the default stagger for a missing or invalid value. React can serialize a boolean opt-in to a string such as `"true"`, which is a marker and has no numeric meaning.
   - A MutationObserver re-discovers targets when children or `hidden`/`inert`/`aria-hidden` change. Focus entering a waiting element completes it immediately so keyboard users never land on invisible content. Cleanup cancels running animations and disconnects observers.
3. Use the Web Animations API with `fill: backwards` so a delayed entrance starts hidden and the final state returns to the element’s normal CSS. Start with a short opacity fade and a rise of roughly 8–12 px for cards and text blocks. Add blur sparingly, and keep it off large surfaces and interactive rendering layers. Use a small mask, offset, and capped stagger for split headings. Keep clip, fade, and hover transforms independent where they operate on the same composition.
4. Split headlines: a `SplitReveal` component keeps the full text in a visually hidden label for screen readers and renders an `aria-hidden` visual copy with one span per word; each word part staggers about 36 ms (capped).
5. Native: a viewport provider on the scroll container tracks scroll offset, viewport height, the height covered by a sticky header and the content top. Each target measures itself with `measureLayout` against the content view and reveals once when it intersects. A changed `motionKey` can replay a deliberate entrance. Reduced motion skips the decorative reveal.
6. Keep motion quiet, consistent with AGENTS.md rule 6, and verify that no content stays hidden when JavaScript, IntersectionObserver or motion is unavailable.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../LICENSE).
