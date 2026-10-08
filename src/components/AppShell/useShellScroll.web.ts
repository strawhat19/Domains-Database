import type { RefObject } from 'react';
import { useState, useEffect, useCallback } from 'react';

export const useShellScroll = (headerRef: RefObject<HTMLElement | null>, pathname: string, sticky: boolean) => {
  const [scrolled, setScrolled] = useState(false);
  const [bottomInset, setBottomInset] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollTopRightInset, setScrollTopRightInset] = useState(20);

  useEffect(() => {
    const header = headerRef.current;
    let hero: HTMLElement | null = null;
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const nextHero = document.getElementById(`landing-hero`) ?? document.querySelector<HTMLElement>(`[data-scroll-hero]`);
      if (nextHero !== hero) {
        if (hero) observer?.unobserve(hero);
        hero = nextHero;
        if (hero) observer?.observe(hero);
      }
      const scrollY = Math.max(0, window.scrollY);
      const height = header?.getBoundingClientRect().height ?? 0;
      const offset = sticky ? height : 0;
      const footer = document.getElementById(`site-footer`);
      const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
      setBottomInset(Math.max(0, window.innerHeight - footerTop));
      const scrollTopButton = document.getElementById(`scroll-to-top`);
      let rightInset = 20;
      if (scrollTopButton) {
        const buttonBounds = scrollTopButton.getBoundingClientRect();
        const viewportRight = document.documentElement.clientWidth;
        const normalLeft = viewportRight - 20 - buttonBounds.width;
        // Compare against the normal position so shifting right cannot toggle the offset repeatedly.
        for (const table of document.querySelectorAll<HTMLElement>(`.portfolio-table-scroll`)) {
          const tableBounds = table.getBoundingClientRect();
          if (tableBounds.width <= 0 || tableBounds.height <= 0
            || tableBounds.top >= buttonBounds.bottom || tableBounds.bottom <= buttonBounds.top
            || tableBounds.left >= viewportRight - 20 || tableBounds.right <= normalLeft) continue;
          const clearInset = viewportRight - tableBounds.right - buttonBounds.width - 4;
          rightInset = Math.min(rightInset, Math.max(8, clearInset));
        }
      }
      setScrollTopRightInset(rightInset);
      setHeaderHeight(height);
      setFooterHeight(footer?.getBoundingClientRect().height ?? 0);
      setScrolled(sticky && scrollY > 8);
      setShowScrollTop(scrollY > 0 && (hero
        ? hero.getBoundingClientRect().bottom <= offset
        : scrollY > Math.max(300, window.innerHeight * .5)));
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
    if (header) observer?.observe(header);
    const footer = document.getElementById(`site-footer`);
    if (footer) observer?.observe(footer);
    const main = document.getElementById(`main-content`);
    if (main) observer?.observe(main);
    const contentObserver = typeof MutationObserver === `undefined` ? null : new MutationObserver(schedule);
    if (main) contentObserver?.observe(main, { childList: true, subtree: true });
    window.addEventListener(`scroll`, schedule, { passive: true });
    window.addEventListener(`resize`, schedule, { passive: true });
    measure();

    return () => {
      observer?.disconnect();
      contentObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener(`scroll`, schedule);
      window.removeEventListener(`resize`, schedule);
    };
  }, [sticky, pathname, headerRef]);

  const scrollToTop = useCallback(() => {
    const reducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
    document.getElementById(`header-brand`)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion ? `auto` : `smooth` });
  }, []);

  return { bottomInset, scrollToTop, showScrollTop, footerHeight, scrollTopRightInset, pageHeaderHeight: headerHeight, scrolled: sticky && scrolled, headerHeight: sticky ? headerHeight : 0 };
};
