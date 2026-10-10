import { useRef, useEffect, useLayoutEffect } from 'react';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useStickyPortfolioGroup = (
  sticky: ReturnType<typeof useStickyPortfolio>,
  contentKey: string,
  enabled: boolean,
  idPrefix: string,
) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLTableElement>(null);
  const { tableRef, scrollRef, header } = sticky;

  useBrowserLayoutEffect(() => {
    const clip = clipRef.current;
    const table = tableRef.current;
    const scroll = scrollRef.current;
    const anchor = anchorRef.current;
    const mirror = mirrorRef.current;
    const columnHeader = headerRef.current;
    if (!clip || !table || !scroll || !anchor || !mirror || !columnHeader) return;

    const mirrors = new Map(Array.from(mirror.querySelectorAll<HTMLTableRowElement>(`[data-portfolio-sticky-group-key]`))
      .map(row => [row.dataset.portfolioStickyGroupKey, row]));
    const groups = Array.from(table.tBodies).flatMap(body => {
      const key = body.dataset.portfolioGroupKey;
      const heading = body.querySelector<HTMLTableRowElement>(`.portfolio-group-heading-row`);
      const row = mirrors.get(key);
      return key && heading && row ? [{ key, body, row, heading, top: 0, bottom: 0, height: 0 }] : [];
    });
    type Group = typeof groups[number];
    let active: Group | undefined;
    let dragging = false;
    let layoutDirty = true;
    let frame: number | null = null;
    let width = -1;
    let height = -1;
    let left = Number.NaN;
    let offset = Number.NaN;
    let maxScrollLeft = 0;

    const restore = (group: Group) => {
      group.heading.removeAttribute(`aria-hidden`);
      group.heading.removeAttribute(`data-portfolio-sticky-inactive`);
      group.row.hidden = true;
      group.row.setAttribute(`aria-hidden`, `true`);
    };
    groups.forEach(restore);
    clip.hidden = true;
    if (!enabled) return;

    const measure = () => {
      frame = null;
      const bounds = table.getBoundingClientRect();
      const top = columnHeader.getBoundingClientRect().bottom;
      const inViewport = bounds.top < window.innerHeight && bounds.bottom > top;
      let next: Group | undefined;
      let nextWidth = width;
      let nextOffset = 0;
      if (inViewport || dragging) {
        if (layoutDirty) {
          nextWidth = bounds.width;
          maxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
          groups.forEach(group => {
            const headingBounds = group.heading.getBoundingClientRect();
            group.top = headingBounds.top - bounds.top;
            group.bottom = group.body.getBoundingClientRect().bottom - bounds.top;
            group.height = headingBounds.height;
          });
          layoutDirty = false;
        }
        const position = top - bounds.top;
        let first = 0;
        let last = groups.length - 1;
        let index = -1;
        while (first <= last) {
          const middle = Math.floor((first + last) / 2);
          const group = groups[middle];
          if (!group) break;
          if (group.top <= position + .5) {
            index = middle;
            first = middle + 1;
          } else last = middle - 1;
        }
        const editing = Boolean(active?.row.querySelector(`.domain-description-editing`));
        next = dragging || editing ? active : groups[index];
        if (!dragging && !editing && next && position >= next.bottom) next = undefined;
        if (!dragging && next?.heading.querySelector(`.domain-description-editing`)) next = undefined;
      }
      const nextLeft = Math.max(0, Math.min(scroll.scrollLeft, maxScrollLeft));
      let focusId: string | undefined;
      if (next !== active) {
        const focused = document.activeElement;
        const originalPrefix = `${idPrefix}-group-`;
        const mirroredPrefix = `${idPrefix}-sticky-group-`;
        if (focused?.id && next?.heading.contains(focused) && focused.id.startsWith(originalPrefix)) {
          focusId = `${mirroredPrefix}${focused.id.slice(originalPrefix.length)}`;
        } else if (focused?.id && active?.row.contains(focused) && focused.id.startsWith(mirroredPrefix)) {
          focusId = `${originalPrefix}${focused.id.slice(mirroredPrefix.length)}`;
        }
        if (active) restore(active);
        if (next) {
          next.row.hidden = false;
          next.row.removeAttribute(`aria-hidden`);
          next.heading.setAttribute(`aria-hidden`, `true`);
          next.heading.setAttribute(`data-portfolio-sticky-inactive`, `true`);
        }
        clip.hidden = !next;
        active = next;
      }
      if (nextWidth !== width && nextWidth >= 0) mirror.style.width = `${nextWidth}px`;
      const nextHeight = next?.row.getBoundingClientRect().height || next?.height || 0;
      if (next && !dragging && !next.row.querySelector(`.domain-description-editing`)) {
        const boundary = Math.min(next.bottom, groups[groups.indexOf(next) + 1]?.top ?? next.bottom);
        nextOffset = Math.min(0, boundary - (top - bounds.top) - nextHeight);
      }
      // All group visibility and geometry changes happen together, without a table render.
      if (nextHeight !== height) clip.style.height = `${nextHeight}px`;
      if (nextOffset !== offset) clip.style.transform = `translate3d(0, ${nextOffset}px, 0)`;
      if (nextLeft !== left) mirror.style.transform = `translate3d(${-nextLeft}px, 0, 0)`;
      height = nextHeight;
      offset = nextOffset;
      width = nextWidth;
      left = nextLeft;
      if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const invalidate = () => {
      layoutDirty = true;
      schedule();
    };
    const startDrag = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(`.portfolio-group-heading-row`)) dragging = true;
    };
    const endDrag = () => { dragging = false; schedule(); };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(invalidate);
    observer?.observe(table);
    observer?.observe(scroll);
    observer?.observe(mirror);
    observer?.observe(columnHeader);
    groups.forEach(group => {
      observer?.observe(group.body);
      observer?.observe(group.heading);
    });
    anchor.addEventListener(`dragstart`, startDrag, true);
    anchor.addEventListener(`dragend`, endDrag, true);
    table.addEventListener(`dragstart`, startDrag, true);
    table.addEventListener(`dragend`, endDrag, true);
    window.addEventListener(`scroll`, schedule, { passive: true, capture: true });
    window.addEventListener(`resize`, invalidate, { passive: true });
    measure();

    return () => {
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      anchor.removeEventListener(`dragstart`, startDrag, true);
      anchor.removeEventListener(`dragend`, endDrag, true);
      table.removeEventListener(`dragstart`, startDrag, true);
      table.removeEventListener(`dragend`, endDrag, true);
      window.removeEventListener(`scroll`, schedule, true);
      window.removeEventListener(`resize`, invalidate);
      groups.forEach(restore);
      clip.hidden = true;
    };
  }, [enabled, contentKey, idPrefix, tableRef, scrollRef, header.headHeight, header.toolbarHeight]);

  return { clipRef, headerRef, anchorRef, mirrorRef };
};
