import { useRef, useState, useEffect, useLayoutEffect } from 'react';

interface PortfolioHeaderSize {
  width: number;
  headHeight: number;
  toolbarHeight: number;
  columnWidths: number[];
}

const INITIAL_HEADER: PortfolioHeaderSize = {
  width: 0,
  headHeight: 0,
  toolbarHeight: 0,
  columnWidths: [],
};

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;
const sameHeader = (first: PortfolioHeaderSize, second: PortfolioHeaderSize) => (
  first.width === second.width
  && first.headHeight === second.headHeight
  && first.toolbarHeight === second.toolbarHeight
  && first.columnWidths.length === second.columnWidths.length
  && first.columnWidths.every((width, index) => width === second.columnWidths[index])
);

export const useStickyPortfolio = (columnKey: string) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const mirrorTableRef = useRef<HTMLTableElement>(null);
  const tableHeadRef = useRef<HTMLTableSectionElement>(null);
  const [header, setHeader] = useState(INITIAL_HEADER);

  useBrowserLayoutEffect(() => {
    const head = tableHeadRef.current;
    const table = tableRef.current;
    const scroll = scrollRef.current;
    const toolbar = toolbarRef.current;
    if (!head || !table || !scroll || !toolbar) {
      setHeader(current => sameHeader(current, INITIAL_HEADER) ? current : INITIAL_HEADER);
      return;
    }

    let mounted = true;
    let frame: number | null = null;
    const syncHorizontal = () => {
      const mirror = mirrorTableRef.current;
      if (!mirror) return;
      const left = Math.max(0, Math.min(scroll.scrollLeft, scroll.scrollWidth - scroll.clientWidth));
      mirror.style.transform = `translateX(${-left}px)`;
    };
    const measure = () => {
      if (!mounted) return;
      const next = {
        width: scroll.clientWidth,
        headHeight: head.getBoundingClientRect().height,
        toolbarHeight: toolbar.getBoundingClientRect().height,
        columnWidths: Array.from(head.rows[0]?.cells ?? []).map(cell => cell.getBoundingClientRect().width),
      };
      setHeader(current => sameHeader(current, next) ? current : next);
      syncHorizontal();
    };
    const schedule = () => {
      if (!mounted || frame !== null) return;
      frame = window.requestAnimationFrame(() => { frame = null; measure(); });
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
    observer?.observe(head);
    observer?.observe(table);
    observer?.observe(scroll);
    observer?.observe(toolbar);
    head.querySelectorAll(`th`).forEach(cell => observer?.observe(cell));
    scroll.addEventListener(`scroll`, syncHorizontal, { passive: true });
    window.addEventListener(`resize`, schedule, { passive: true });
    measure();

    return () => {
      mounted = false;
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      scroll.removeEventListener(`scroll`, syncHorizontal);
      window.removeEventListener(`resize`, schedule);
    };
  }, [columnKey]);

  return { toolbarRef, tableRef, tableHeadRef, scrollRef, mirrorTableRef, header };
};
