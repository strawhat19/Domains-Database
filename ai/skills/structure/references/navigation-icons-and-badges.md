# Navigation Icons, Badges, And Control Spacing

Use this reference for public navigation and similarly sized controls elsewhere in the app. Reuse the destination’s icon renderer, route metadata, theme tokens, typography, and layout. Follow [Icon Color And Contrast](../../admin/layout.md#icon-color-and-contrast) for theme and state checks and [Scroll Reveals](../../scroll-reveals/SKILL.md) for entrances.

## Icon Artwork And Size

- Share the semantic icon between its category and navigation when both identify the same destination. Resolve the icon in route or category metadata so desktop and mobile use the same mapping. Keep glyphs in the same outline or fill family, with comparable stroke weights and enough space between details to stay readable at menu size. For circular artwork, use concentric circles and a solid dot to keep curves clean at small sizes.
- Standardize the **visible** size of comparable menu, utility, search, filter, and card-action icons. Use the destination’s established peers as the reference. Tune unusually narrow, low, or diagonal artwork with a small per-icon optical adjustment. Separate the box reserved for the icon from how large the artwork renders. A centered SVG group scale, fitted viewBox, or transform can resize the artwork while the control dimensions, row height, label alignment, focus outline, and hit area stay stable. Check that any clip entrance and container overflow leave enough room for the full glyph.
- Keep fixed icon slots within each menu layout so mobile labels align. Protect tiny status marks and large decorative illustrations from a size change scoped to everyday control icons. Use the same icon-left, label-right alignment for button families and supply an accessible name for icon-only controls. In native views, use the same optical and spacing rules with the platform’s style objects, separate from minimum touch targets.
- Preserve the product’s accent language. A two-tone icon can use a brand accent with a distinct secondary dot or stroke. Pull both from named theme tokens, make the secondary detail readable at actual size, and keep semantic status colors separate when the product uses them.

For example, reserve the same slot for every comparable web menu glyph and apply small size and position corrections to the SVG. Use unitless numbers for the two sizes in the scale ratio. Set the slot at the responsive menu breakpoint and override the artwork values only where needed.

```scss
.nav-icon-slot {
  --icon-slot-size: 18;
  display: grid;
  flex: none;
  place-items: center;
  inline-size: calc(var(--icon-slot-size) * 1px);
  block-size: calc(var(--icon-slot-size) * 1px);
}

.nav-icon-slot > svg {
  inline-size: 100%;
  block-size: 100%;
  scale: calc(var(--icon-artwork-size, var(--icon-slot-size)) / var(--icon-slot-size));
  translate: var(--icon-optical-offset, 0px) 0;
}

.nav-icon-slot--diagonal {
  --icon-artwork-size: 19;
  --icon-optical-offset: 1px;
}
```

## Menu Spacing And Beta Badges

- For a compact desktop menu, let links take their natural content width and use an even flex gap between link boxes. Equal-width columns spread short labels farther apart and are best reserved for a design that explicitly calls for equally spaced centers. Normalize icon slots and icon-to-label gaps before adjusting the space between links. Keep a slightly larger link-to-utility gap to show the group boundary if the groups need separation. Start with a few pixels of extra space and tune at the point where the desktop menu becomes mobile. Preserve group alignment, link text, and existing control heights.
- Store **Beta** as optional display metadata on the relevant menu items and reuse one badge style across desktop and mobile. Anchor a compact badge to the upper trailing edge of the label or its visual group, rather than the full-height header row. Keep it out of the row’s width calculation and clear of neighboring links, focus indicators, and clipping. Include the status once in the accessible name when it conveys rollout information. Preserve the real route and availability state independently of the badge.
- Style a requested fixed-color badge with one pair of brand accent and backing tokens in both themes. Use an opaque backing with enough contrast against the badge text and both header surfaces. When a product uses cut corners, use a small clipped corner from its shape system on badges and a proportionate cut on larger controls. Include the badge in its menu item’s entrance so the icon, label, and badge arrive together.

## Compact Controls

- Apply the destination’s chosen corner shape, padding, and icon-to-label spacing consistently to header utilities, primary actions, numbered pagination, icon-only chevrons, and search controls. Keep the existing width of a full-width hero search field or action. Keep light and dark variants readable, including any requested surface/text inversion with a retained brand accent on the icon. When the control needs its full rectangular hit area, clip a visual layer inside it. For an existing clipped control, verify the effective hit area and use a visible inset focus treatment if the outside outline is clipped. Verify disabled, hover, focus, and selected states against the current surface, and use the same semantic IDs and classes as the rest of the app.
- During review compare menu gaps, badge clearance, icon strokes, alignment, and focus treatment at rendered size on wide desktop, the desktop-to-mobile breakpoint, and narrow mobile. Review theme contrast and use the validation scope authorized for the destination.

These original instructions are copyright 2026 strawhat19 and licensed under [MIT](../../../LICENSE).
