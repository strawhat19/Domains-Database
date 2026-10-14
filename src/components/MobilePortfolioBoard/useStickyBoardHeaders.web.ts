import { useEffect, useLayoutEffect, type RefObject } from 'react';

interface BoardColumn {
  element: HTMLElement;
  header: HTMLElement;
  body: HTMLElement | null;
  groups: { element: HTMLElement; header: HTMLElement }[];
}

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useStickyBoardHeaders = (boardRef: RefObject<HTMLDivElement | null>) => {
  useBrowserLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const toolbar = document.getElementById(`portfolio-toolbar`);
    const siteHeader = document.getElementById(`site-header`);
    const offsets = new Map<HTMLElement, number>();
    let columns: BoardColumn[] = [];
    let dirty = true;
    let frame: number | null = null;

    const restore = (header: HTMLElement) => {
      header.style.removeProperty(`--mobile-board-header-offset`);
      header.removeAttribute(`data-board-frozen`);
      offsets.delete(header);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
    const collect = () => {
      columns = Array.from(board.querySelectorAll<HTMLElement>(`.mobile-board-column`)).flatMap(element => {
        const header = element.querySelector<HTMLElement>(`.mobile-board-column-header`);
        if (!header) return [];
        const body = element.querySelector<HTMLElement>(`.mobile-board-column-body`);
        const groups = Array.from(element.querySelectorAll<HTMLElement>(`.mobile-group-card`)).flatMap(group => {
          const groupHeader = group.querySelector<HTMLElement>(`.mobile-group-header`);
          return groupHeader ? [{ element: group, header: groupHeader }] : [];
        });
        return [{ element, header, body, groups }];
      });
      const elements = new Set<HTMLElement>([board]);
      if (toolbar) elements.add(toolbar);
      if (siteHeader) elements.add(siteHeader);
      columns.forEach(column => {
        elements.add(column.element);
        elements.add(column.header);
        if (column.body) elements.add(column.body);
        column.groups.forEach(group => { elements.add(group.element); elements.add(group.header); });
      });
      offsets.forEach((_, header) => { if (!elements.has(header)) restore(header); });
      observer?.disconnect();
      elements.forEach(element => observer?.observe(element));
      dirty = false;
    };
    const measure = () => {
      frame = null;
      if (dirty) collect();
      const scroller = board.querySelector<HTMLElement>(`.mobile-board-columns`);
      const viewport = scroller?.getBoundingClientRect();
      const top = Math.max(0, toolbar?.getBoundingClientRect().bottom ?? 0, siteHeader?.getBoundingClientRect().bottom ?? 0);
      const updates = new Map<HTMLElement, number>();
      columns.forEach(column => {
        const bounds = column.element.getBoundingClientRect();
        const header = column.header.getBoundingClientRect();
        const naturalTop = header.top - (offsets.get(column.header) ?? 0);
        const visible = viewport && bounds.width > 0 && bounds.height > 0
          && Math.min(viewport.right, bounds.right, window.innerWidth) > Math.max(viewport.left, bounds.left, 0)
          && bounds.bottom > top && bounds.top < window.innerHeight;
        if (!visible) {
          updates.set(column.header, 0);
          column.groups.forEach(group => updates.set(group.header, 0));
          return;
        }
        const offset = Math.max(0, Math.min(top, bounds.bottom - header.height) - naturalTop);
        updates.set(column.header, offset);
        const body = column.body?.getBoundingClientRect();
        // Both levels use this frame's collection position, including its push-off at the lane end.
        const groupTop = Math.max(top, naturalTop + offset + header.height, body?.top ?? top);
        column.groups.forEach(group => {
          const groupBounds = group.element.getBoundingClientRect();
          const groupHeader = group.header.getBoundingClientRect();
          const groupNaturalTop = groupHeader.top - (offsets.get(group.header) ?? 0);
          // Let a pinned title leave with its shrinking card instead of snapping away on collapse.
          const transitioning = group.element.querySelector(`:scope > .portfolio-collapse-transitioning`);
          const expanded = group.element.dataset.boardGroupExpanded === `true` || Boolean(transitioning);
          const groupOffset = body && !column.body?.hidden && expanded
            ? Math.max(0, Math.min(groupTop, groupBounds.bottom - groupHeader.height, body.bottom - groupHeader.height) - groupNaturalTop) : 0;
          updates.set(group.header, groupOffset);
        });
      });
      // Keep the original controls and layout slots; only their paint position changes.
      updates.forEach((offset, header) => {
        if (Math.abs(offset - (offsets.get(header) ?? 0)) < .1) return;
        header.style.setProperty(`--mobile-board-header-offset`, `${offset}px`);
        if (offset > .5) header.dataset.boardFrozen = `true`;
        else header.removeAttribute(`data-board-frozen`);
        offsets.set(header, offset);
      });
    };
    const contentObserver = typeof MutationObserver === `undefined` ? null : new MutationObserver(() => {
      dirty = true;
      schedule();
    });
    contentObserver?.observe(board, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [`class`, `hidden`, `data-board-group-expanded`],
    });
    window.addEventListener(`scroll`, schedule, { passive: true, capture: true });
    window.addEventListener(`resize`, schedule, { passive: true });
    window.visualViewport?.addEventListener(`scroll`, schedule, { passive: true });
    window.visualViewport?.addEventListener(`resize`, schedule, { passive: true });
    measure();
    return () => {
      observer?.disconnect();
      contentObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener(`scroll`, schedule, true);
      window.removeEventListener(`resize`, schedule);
      window.visualViewport?.removeEventListener(`scroll`, schedule);
      window.visualViewport?.removeEventListener(`resize`, schedule);
      offsets.forEach((_, header) => restore(header));
    };
  }, [boardRef]);
};
