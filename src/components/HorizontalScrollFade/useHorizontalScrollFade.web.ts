import './styles.scss';
import { useCallback } from 'react';

export const useHorizontalScrollFade = <Element extends HTMLElement>() => useCallback((element: Element | null) => {
  if (!element) return;

  const measure = () => {
    const { clientWidth, scrollWidth, scrollLeft } = element;
    const scrollable = clientWidth > 0 && scrollWidth > clientWidth + 1 && /^(auto|scroll)$/.test(getComputedStyle(element).overflowX);
    element.toggleAttribute(`data-scroll-fade-left`, scrollable && scrollLeft > 1);
    element.toggleAttribute(`data-scroll-fade-right`, scrollable && scrollWidth - clientWidth - scrollLeft > 1);
  };
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  };
  const resize = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(schedule);
  const observeSizes = () => {
    resize?.disconnect();
    resize?.observe(element);
    for (const child of element.children) resize?.observe(child);
  };
  const content = new MutationObserver(records => {
    if (records.some(record => record.target === element && record.type === `childList`)) observeSizes();
    schedule();
  });

  measure();
  observeSizes();
  content.observe(element, { subtree: true, childList: true, characterData: true });
  element.addEventListener(`scroll`, schedule, { passive: true });
  if (!resize) window.addEventListener(`resize`, schedule);
  return () => {
    resize?.disconnect();
    content.disconnect();
    cancelAnimationFrame(frame);
    if (!resize) window.removeEventListener(`resize`, schedule);
    element.removeEventListener(`scroll`, schedule);
    element.removeAttribute(`data-scroll-fade-left`);
    element.removeAttribute(`data-scroll-fade-right`);
  };
}, []);
