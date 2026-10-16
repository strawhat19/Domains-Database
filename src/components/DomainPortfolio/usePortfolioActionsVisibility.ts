import { useEffect, useRef, useState } from 'react';

export const usePortfolioActionsVisibility = () => {
  const primaryActionsRef = useRef<HTMLDivElement>(null);
  const [showCompactActions, setShowCompactActions] = useState(false);

  useEffect(() => {
    const actions = primaryActionsRef.current;
    if (!actions) return;
    const heading = actions.closest<HTMLElement>(`.portfolio-heading-row`) ?? actions;
    const header = document.getElementById(`site-header`);
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      if (document.documentElement.hasAttribute(`data-theme-changing`)) {
        frame = window.requestAnimationFrame(measure);
        return;
      }
      const headerPosition = header ? window.getComputedStyle(header).position : ``;
      const headerBottom = header && (headerPosition === `sticky` || headerPosition === `fixed`)
        ? Math.max(0, header.getBoundingClientRect().bottom)
        : 0;
      const bounds = heading.getBoundingClientRect();
      const compact = window.getComputedStyle(heading).display === `none`
        || (bounds.width > 0 && bounds.height > 0 && bounds.bottom <= headerBottom);
      if (!compact) {
        const focusedId = document.activeElement?.id;
        const fullButtonId = focusedId === `portfolio-toolbar-sync-domains` ? `portfolio-sync-domains`
          : focusedId === `portfolio-toolbar-add-domain` ? `portfolio-add-domain` : null;
        if (fullButtonId) {
          const fullButton = document.getElementById(fullButtonId);
          const nextFocus = fullButton?.matches(`:disabled`) ? document.getElementById(`portfolio-copy-domains`) : fullButton;
          nextFocus?.focus({ preventScroll: true });
        }
      }
      setShowCompactActions(compact);
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
    observer?.observe(actions);
    observer?.observe(heading);
    if (header) observer?.observe(header);
    const main = document.getElementById(`main-content`);
    if (main) observer?.observe(main);
    window.addEventListener(`scroll`, schedule, { passive: true });
    window.addEventListener(`resize`, schedule, { passive: true });
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(measure);
    });

    return () => {
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener(`scroll`, schedule);
      window.removeEventListener(`resize`, schedule);
    };
  }, []);

  return { primaryActionsRef, showCompactActions };
};
