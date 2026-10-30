import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;
const DEFAULT_ROWS = { count: 4, height: 40 };

export const useLoadingPortfolioRows = (enabled: boolean, recordsRef: RefObject<HTMLDivElement | null>) => {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  useBrowserLayoutEffect(() => {
    const records = recordsRef.current;
    const portfolio = records?.closest(`.domain-portfolio-full`);
    if (!enabled || !records || !portfolio) return;
    const main = records.closest(`.main-content`);
    const card = portfolio.querySelector(`.portfolio-card`);
    const header = document.getElementById(`site-header`);
    const footer = document.getElementById(`site-footer`);
    const cardFooter = portfolio.querySelector(`.portfolio-card-footer`);
    const tableHead = records.querySelector(`.portfolio-table-scroll thead`);
    const pixels = (element: Element | null, property: string) => element
      ? Number.parseFloat(window.getComputedStyle(element).getPropertyValue(property)) || 0 : 0;
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const top = records.getBoundingClientRect().top + window.scrollY;
      const footerSpace = (footer?.getBoundingClientRect().height ?? 0) + pixels(footer, `margin-top`);
      const reservedSpace = footerSpace + pixels(main, `padding-bottom`) + pixels(card, `border-bottom-width`)
        + (cardFooter?.getBoundingClientRect().height ?? 0) + (tableHead?.getBoundingClientRect().height ?? 0);
      const available = Math.max(0, Math.floor((window.visualViewport?.height ?? window.innerHeight) - top - reservedSpace));
      const count = Math.min(32, Math.floor(available / 40));
      const height = count ? available / count : 40;
      setRows(current => current.count === count && current.height === height ? current : { count, height });
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
    [main, card, header, footer, records, cardFooter, tableHead].forEach(element => {
      if (element) observer?.observe(element);
    });
    window.addEventListener(`resize`, schedule);
    window.visualViewport?.addEventListener(`resize`, schedule);
    measure();
    return () => {
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener(`resize`, schedule);
      window.visualViewport?.removeEventListener(`resize`, schedule);
    };
  }, [enabled, recordsRef]);
  return enabled ? rows : DEFAULT_ROWS;
};
