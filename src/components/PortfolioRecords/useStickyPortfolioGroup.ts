import { useRef, useEffect, useLayoutEffect } from 'react';
import type { useStickyPortfolio } from '../DomainPortfolio/useStickyPortfolio';

interface StickyHeading {
  key: string;
  top: number;
  bottom: number;
  height: number;
  row: HTMLTableRowElement;
  heading: HTMLTableRowElement;
}

const EDITOR_SELECTOR = `.domain-description-editing, .portfolio-name-editing`;
const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;
const isEditing = (heading?: StickyHeading) => Boolean(heading?.row.querySelector(EDITOR_SELECTOR));
const restoreHeading = (heading: StickyHeading) => {
  if (heading.heading.dataset.collapsed === `true`) heading.heading.setAttribute(`aria-hidden`, `true`);
  else heading.heading.removeAttribute(`aria-hidden`);
  heading.heading.removeAttribute(`data-portfolio-sticky-inactive`);
  heading.row.hidden = true;
  heading.row.setAttribute(`aria-hidden`, `true`);
};
const headingAt = <T extends StickyHeading>(headings: T[], position: number) => {
  let first = 0;
  let last = headings.length - 1;
  let index = -1;
  while (first <= last) {
    const middle = Math.floor((first + last) / 2);
    const heading = headings[middle];
    if (!heading) break;
    if (heading.top <= position + .5) {
      index = middle;
      first = middle + 1;
    } else last = middle - 1;
  }
  const heading = headings[index];
  return heading && position < heading.bottom ? heading : undefined;
};

export const useStickyPortfolioGroup = (
  sticky: ReturnType<typeof useStickyPortfolio>,
  contentKey: string,
  enabled: boolean,
  idPrefix: string,
) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLTableElement>(null);
  const collectionClipRef = useRef<HTMLDivElement>(null);
  const collectionMirrorRef = useRef<HTMLTableElement>(null);
  const retainedRef = useRef<{ groupKey?: string; collectionKey?: string; focusId?: string }>({});
  const { tableRef, scrollRef, headingRef, toolbarRef } = sticky;

  useBrowserLayoutEffect(() => {
    const clip = clipRef.current;
    const table = tableRef.current;
    const scroll = scrollRef.current;
    const anchor = anchorRef.current;
    const mirror = mirrorRef.current;
    const columnHeader = headerRef.current;
    const collectionClip = collectionClipRef.current;
    const collectionMirror = collectionMirrorRef.current;
    if (!clip || !table || !scroll || !anchor || !mirror || !columnHeader || !collectionClip || !collectionMirror) return;

    const bodies = Array.from(table.tBodies);
    const mirrors = new Map(Array.from(mirror.querySelectorAll<HTMLTableRowElement>(`[data-portfolio-sticky-group-key]`))
      .map(row => [row.dataset.portfolioStickyGroupKey, row]));
    const collectionMirrors = new Map(Array.from(collectionMirror.querySelectorAll<HTMLTableRowElement>(`[data-portfolio-sticky-collection-key]`))
      .map(row => [row.dataset.portfolioStickyCollectionKey, row]));
    const collections = bodies.flatMap(body => {
      const key = body.dataset.portfolioCollectionKey;
      const heading = body.querySelector<HTMLTableRowElement>(`.portfolio-collection-heading-row`);
      const row = collectionMirrors.get(key);
      return key && heading && row ? [{
        key, row, heading, top: 0, bottom: 0, height: 0,
        bodies: bodies.filter(item => item.dataset.portfolioCollectionKey === key),
      }] : [];
    });
    const groups = bodies.flatMap(body => {
      const key = body.dataset.portfolioGroupKey;
      const heading = body.querySelector<HTMLTableRowElement>(`.portfolio-group-heading-row`);
      const row = mirrors.get(key);
      return key && heading && row ? [{
        key, body, row, heading, top: 0, bottom: 0, height: 0,
        collectionKey: body.dataset.portfolioCollectionKey,
      }] : [];
    });
    type Group = typeof groups[number];
    type Collection = typeof collections[number];
    const retained = retainedRef.current;
    const resumedGroup = groups.find(group => group.key === retained.groupKey);
    const resumedCollection = collections.find(collection => collection.key === retained.collectionKey);
    let activeGroup: Group | undefined;
    let activeCollection: Collection | undefined;
    let dragging = false;
    let layoutDirty = true;
    let frame: number | null = null;
    let width = -1;
    let groupHeight = -1;
    let collectionHeight = -1;
    let left = Number.NaN;
    let groupOffset = Number.NaN;
    let collectionOffset = Number.NaN;
    let maxScrollLeft = 0;

    groups.forEach(restoreHeading);
    collections.forEach(restoreHeading);
    collectionClip.hidden = true;
    clip.hidden = true;
    if (!enabled) return;

    const focusControl = (id: string) => {
      const originalId = id.replace(`${idPrefix}-sticky-`, `${idPrefix}-`);
      const controls = [id, originalId, originalId.replace(/-input$/, `-edit`), `portfolio-groups-button`];
      controls.map(controlId => document.getElementById(controlId)).find(control => control?.isConnected
        && !control.matches(`:disabled`) && !control.closest(`[hidden], [inert], [aria-hidden='true']`))?.focus({ preventScroll: true });
    };
    const switchHeading = (previous: StickyHeading | undefined, next: StickyHeading | undefined, kind: `group` | `collection`) => {
      if (next === previous) return undefined;
      const focused = document.activeElement;
      const originalPrefix = `${idPrefix}-${kind}-`;
      const mirroredPrefix = `${idPrefix}-sticky-${kind}-`;
      let focusId: string | undefined;
      if (focused?.id && next?.heading.contains(focused) && focused.id.startsWith(originalPrefix)) {
        focusId = `${mirroredPrefix}${focused.id.slice(originalPrefix.length)}`;
      } else if (focused?.id && previous?.row.contains(focused) && focused.id.startsWith(mirroredPrefix)) {
        focusId = `${originalPrefix}${focused.id.slice(mirroredPrefix.length)}`;
      }
      if (previous) restoreHeading(previous);
      if (next) {
        next.row.hidden = false;
        next.row.removeAttribute(`aria-hidden`);
        next.heading.setAttribute(`aria-hidden`, `true`);
        next.heading.setAttribute(`data-portfolio-sticky-inactive`, `true`);
      }
      return focusId;
    };
    const measure = () => {
      frame = null;
      const bounds = table.getBoundingClientRect();
      const top = columnHeader.getBoundingClientRect().bottom;
      const inViewport = bounds.top < window.innerHeight && bounds.bottom > top;
      const editingGroup = isEditing(activeGroup) ? activeGroup : isEditing(resumedGroup) ? resumedGroup : undefined;
      const editingCollection = isEditing(activeCollection) ? activeCollection : isEditing(resumedCollection) ? resumedCollection : undefined;
      let nextCollection: Collection | undefined;
      let nextGroup: Group | undefined;
      let nextWidth = width;
      let nextCollectionOffset = 0;
      let nextGroupOffset = 0;
      if (inViewport || dragging || editingGroup || editingCollection) {
        if (layoutDirty) {
          nextWidth = bounds.width;
          maxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
          collections.forEach(collection => {
            const headingBounds = collection.heading.getBoundingClientRect();
            collection.top = headingBounds.top - bounds.top;
            collection.height = headingBounds.height;
            collection.bottom = (collection.bodies[collection.bodies.length - 1]?.getBoundingClientRect().bottom ?? headingBounds.bottom) - bounds.top;
          });
          groups.forEach(group => {
            const headingBounds = group.heading.getBoundingClientRect();
            group.top = headingBounds.top - bounds.top;
            group.bottom = group.body.getBoundingClientRect().bottom - bounds.top;
            group.height = headingBounds.height;
          });
          layoutDirty = false;
        }
        const position = top - bounds.top;
        nextCollection = dragging ? activeCollection : editingCollection
          ?? (editingGroup ? collections.find(collection => collection.key === editingGroup.collectionKey) : headingAt(collections, position));
        if (nextCollection?.heading.querySelector(EDITOR_SELECTOR)) nextCollection = undefined;
      }
      let focusId = switchHeading(activeCollection, nextCollection, `collection`) ?? retained.focusId;
      collectionClip.hidden = !nextCollection;
      activeCollection = nextCollection;
      if (nextWidth !== width && nextWidth >= 0) {
        mirror.style.width = `${nextWidth}px`;
        collectionMirror.style.width = `${nextWidth}px`;
      }
      const nextCollectionHeight = nextCollection?.row.getBoundingClientRect().height || nextCollection?.height || 0;
      if (nextCollection && !dragging && !editingGroup && !editingCollection) {
        nextCollectionOffset = Math.min(0, nextCollection.bottom - (top - bounds.top) - nextCollectionHeight);
      }
      if (inViewport || dragging || editingGroup) {
        const position = top + nextCollectionHeight + nextCollectionOffset - bounds.top;
        nextGroup = dragging ? activeGroup : editingGroup ?? headingAt(groups, position);
        if (nextGroup?.collectionKey !== nextCollection?.key) nextGroup = undefined;
        if (nextGroup?.heading.querySelector(EDITOR_SELECTOR)) nextGroup = undefined;
      }
      focusId = switchHeading(activeGroup, nextGroup, `group`) ?? focusId;
      clip.hidden = !nextGroup;
      activeGroup = nextGroup;
      const nextGroupHeight = nextGroup?.row.getBoundingClientRect().height || nextGroup?.height || 0;
      if (nextGroup && !dragging && !editingGroup) {
        nextGroupOffset = Math.min(0, nextGroup.bottom - (top + nextCollectionHeight + nextCollectionOffset - bounds.top) - nextGroupHeight);
      }
      const nextLeft = Math.max(0, Math.min(scroll.scrollLeft, maxScrollLeft));
      // Keep both sticky levels in one geometry update so they move together at collection boundaries.
      if (nextCollectionHeight !== collectionHeight) collectionClip.style.height = `${nextCollectionHeight}px`;
      if (nextGroupHeight !== groupHeight) clip.style.height = `${nextGroupHeight}px`;
      if (nextCollectionOffset !== collectionOffset) anchor.style.transform = `translate3d(0, ${nextCollectionOffset}px, 0)`;
      if (nextGroupOffset !== groupOffset) clip.style.transform = `translate3d(0, ${nextGroupOffset}px, 0)`;
      if (nextLeft !== left) {
        mirror.style.transform = `translate3d(${-nextLeft}px, 0, 0)`;
        collectionMirror.style.transform = `translate3d(${-nextLeft}px, 0, 0)`;
      }
      groupHeight = nextGroupHeight;
      collectionHeight = nextCollectionHeight;
      collectionOffset = nextCollectionOffset;
      groupOffset = nextGroupOffset;
      width = nextWidth;
      left = nextLeft;
      retained.focusId = undefined;
      if (focusId) focusControl(focusId);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const invalidate = () => {
      layoutDirty = true;
      schedule();
    };
    const startDrag = (event: Event) => {
      if (!(event.target instanceof Element) || event.target.closest(`.portfolio-name-editor, .domain-description-editing`)) return;
      if (event.target.closest(`.portfolio-group-heading-row, .portfolio-collection-heading-row`)) dragging = true;
    };
    const endDrag = () => { dragging = false; schedule(); };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(invalidate);
    [table, scroll, mirror, columnHeader, collectionMirror, headingRef.current, toolbarRef.current].forEach(element => {
      if (element) observer?.observe(element);
    });
    bodies.forEach(body => observer?.observe(body));
    groups.forEach(group => observer?.observe(group.heading));
    collections.forEach(collection => observer?.observe(collection.heading));
    const offsetObserver = typeof MutationObserver === `undefined` ? null : new MutationObserver(schedule);
    [document.getElementById(`app-shell`), headingRef.current?.closest(`.domain-portfolio`), columnHeader].forEach(element => {
      if (element) offsetObserver?.observe(element, { attributes: true, attributeFilter: [`style`] });
    });
    anchor.addEventListener(`dragstart`, startDrag, true);
    table.addEventListener(`dragstart`, startDrag, true);
    window.addEventListener(`dragend`, endDrag, true);
    window.addEventListener(`drop`, endDrag, true);
    window.addEventListener(`scroll`, schedule, { passive: true, capture: true });
    window.addEventListener(`resize`, invalidate, { passive: true });
    measure();

    return () => {
      observer?.disconnect();
      offsetObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      anchor.removeEventListener(`dragstart`, startDrag, true);
      table.removeEventListener(`dragstart`, startDrag, true);
      window.removeEventListener(`dragend`, endDrag, true);
      window.removeEventListener(`drop`, endDrag, true);
      window.removeEventListener(`scroll`, schedule, true);
      window.removeEventListener(`resize`, invalidate);
      const focused = document.activeElement;
      retained.groupKey = activeGroup?.key;
      retained.collectionKey = activeCollection?.key;
      retained.focusId = focused?.id && (activeGroup?.row.contains(focused) || activeCollection?.row.contains(focused)) ? focused.id : undefined;
      groups.forEach(restoreHeading);
      collections.forEach(restoreHeading);
      collectionClip.hidden = true;
      clip.hidden = true;
      anchor.style.removeProperty(`transform`);
      if (retained.focusId) window.requestAnimationFrame(() => {
        if (!retained.focusId) return;
        focusControl(retained.focusId);
        retained.focusId = undefined;
      });
    };
  }, [enabled, contentKey, idPrefix, tableRef, scrollRef, headingRef, toolbarRef]);

  return { clipRef, headerRef, anchorRef, mirrorRef, collectionClipRef, collectionMirrorRef };
};
