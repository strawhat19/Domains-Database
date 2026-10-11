import type { RefObject } from 'react';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useDestinationChoicesRows = (choicesRef: RefObject<HTMLDivElement | null>, layoutKey: string, initialRows?: number) => {
  const pendingFocus = useRef<number | null>(null);
  const [visibleRows, setVisibleRows] = useState(initialRows ?? 0);
  const [layout, setLayout] = useState<{ count: number; hasMore: boolean; height?: number }>({ count: Infinity, hasMore: false });

  useBrowserLayoutEffect(() => {
    const choices = choicesRef.current;
    if (!initialRows || !choices) return;
    const buttons = Array.from(choices.querySelectorAll<HTMLButtonElement>(`.destination-choice`));
    const measure = () => {
      if (!choices.clientWidth) return;
      let rows = 0;
      let count = 0;
      let height = 0;
      let rowTop: number | undefined;
      buttons.forEach(button => {
        const top = button.offsetTop;
        if (top !== rowTop) {
          rows += 1;
          rowTop = top;
        }
        if (rows > visibleRows) return;
        count += 1;
        height = Math.max(height, top + button.offsetHeight);
      });
      const hasMore = count < buttons.length;
      const nextHeight = hasMore ? height : undefined;
      setLayout(current => current.count === count && current.hasMore === hasMore && current.height === nextHeight
        ? current : { count, hasMore, height: nextHeight });
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(measure);
    observer?.observe(choices);
    buttons.forEach(button => observer?.observe(button));
    document.fonts?.addEventListener(`loadingdone`, measure);
    window.addEventListener(`resize`, measure);
    measure();
    return () => {
      observer?.disconnect();
      document.fonts?.removeEventListener(`loadingdone`, measure);
      window.removeEventListener(`resize`, measure);
    };
  }, [choicesRef, initialRows, layoutKey, visibleRows]);

  useBrowserLayoutEffect(() => {
    const choices = choicesRef.current;
    const buttons = Array.from(choices?.querySelectorAll<HTMLButtonElement>(`.destination-choice`) ?? []);
    if (pendingFocus.current !== null && layout.count > pendingFocus.current) {
      const firstNewChoice = buttons.slice(pendingFocus.current, layout.count).find(button => !button.disabled);
      pendingFocus.current = null;
      firstNewChoice?.focus({ preventScroll: true });
    } else if (choices?.contains(document.activeElement) && document.activeElement?.getAttribute(`aria-hidden`) === `true`) {
      document.getElementById(`${choices.id}-load-more`)?.focus({ preventScroll: true });
    }
  }, [choicesRef, layout.count]);

  const loadMore = () => {
    pendingFocus.current = layout.count;
    setVisibleRows(current => current + (initialRows ?? 0));
  };

  return { ...layout, loadMore };
};
