import type { PointerEvent, KeyboardEvent } from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

interface DragState {
  left: number;
  startX: number;
  index: number;
  pointerId: number;
}

export const useOverviewCarousel = (count: number) => {
  const viewport = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);
  const physicalIndex = useRef(1);
  const requestedIndex = useRef<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const drag = useRef<DragState | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useReducedMotion();
  const wrapIndex = useCallback((value: number) => count > 0 ? ((value % count) + count) % count : 0, [count]);
  const clearSettle = useCallback(() => { clearTimeout(settleTimer.current); }, []);
  const updateIndex = useCallback((value: number) => {
    const nextIndex = wrapIndex(value);
    currentIndex.current = nextIndex;
    setIndex(current => current === nextIndex ? current : nextIndex);
  }, [wrapIndex]);
  const jumpTo = useCallback((position: number) => {
    const element = viewport.current;
    if (!element?.clientWidth) return;
    element.style.scrollSnapType = `none`;
    element.scrollTo({ left: position * element.clientWidth, behavior: `auto` });
    element.style.scrollSnapType = ``;
    physicalIndex.current = position;
  }, []);
  const select = useCallback((value: number, manual = true, position?: number) => {
    const element = viewport.current;
    if (!element?.clientWidth) return;
    clearSettle();
    if (physicalIndex.current === 0 || physicalIndex.current === count + 1) jumpTo(currentIndex.current + 1);
    const nextIndex = wrapIndex(value);
    const nextPosition = position ?? nextIndex + 1;
    requestedIndex.current = nextPosition;
    physicalIndex.current = nextPosition;
    updateIndex(nextIndex);
    if (manual) setRevision(current => current + 1);
    element.scrollTo({ left: nextPosition * element.clientWidth, behavior: reducedMotion ? `auto` : `smooth` });
  }, [count, wrapIndex, updateIndex, reducedMotion, clearSettle, jumpTo]);
  const navigate = useCallback((direction: -1 | 1, manual = true) => {
    const nextIndex = currentIndex.current + direction;
    const position = nextIndex < 0 ? 0 : nextIndex >= count ? count + 1 : nextIndex + 1;
    select(nextIndex, manual, position);
  }, [count, select]);
  const onScroll = useCallback(() => {
    clearSettle();
    settleTimer.current = setTimeout(() => {
      const element = viewport.current;
      if (!element?.clientWidth || drag.current || activePointer.current !== null) return;
      const position = element.scrollLeft / element.clientWidth;
      if (requestedIndex.current !== null && Math.abs(position - requestedIndex.current) > .05) {
        element.scrollTo({ left: requestedIndex.current * element.clientWidth, behavior: reducedMotion ? `auto` : `smooth` });
        return;
      }
      requestedIndex.current = null;
      const settledPosition = Math.max(0, Math.min(count + 1, Math.round(position)));
      updateIndex(settledPosition - 1);
      physicalIndex.current = settledPosition;
      if (settledPosition === 0 || settledPosition === count + 1) jumpTo(currentIndex.current + 1);
      setInteracting(false);
    }, 160);
  }, [count, updateIndex, reducedMotion, clearSettle, jumpTo]);
  const finishDrag = useCallback((event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (activePointer.current === event.pointerId) {
      activePointer.current = null;
      setInteracting(false);
    }
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) { onScroll(); return; }
    drag.current = null;
    const element = event.currentTarget;
    delete element.dataset.dragging;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (!element.clientWidth) return;
    const distance = event.clientX - current.startX;
    let position = Math.round(element.scrollLeft / element.clientWidth);
    if (!cancelled && position === current.index + 1 && Math.abs(distance) > Math.min(64, element.clientWidth * .12)) position += distance < 0 ? 1 : -1;
    position = Math.max(0, Math.min(count + 1, position));
    select(position - 1, true, position);
  }, [count, select, onScroll]);
  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(`a, button, input, select, textarea`)) return;
    const element = event.currentTarget;
    if (!element.clientWidth) return;
    clearSettle();
    requestedIndex.current = null;
    activePointer.current = event.pointerId;
    setInteracting(true);
    element.scrollTo({ left: element.scrollLeft, behavior: `auto` });
    let position = Math.max(0, Math.min(count + 1, Math.round(element.scrollLeft / element.clientWidth)));
    updateIndex(position - 1);
    if (position === 0 || position === count + 1) { position = currentIndex.current + 1; jumpTo(position); }
    physicalIndex.current = position;
    if (event.pointerType !== `mouse`) return;
    drag.current = { left: element.scrollLeft, startX: event.clientX, index: currentIndex.current, pointerId: event.pointerId };
    element.setPointerCapture(event.pointerId);
  }, [count, updateIndex, clearSettle, jumpTo]);
  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.buttons === 0) { finishDrag(event, true); return; }
    const distance = event.clientX - current.startX;
    if (Math.abs(distance) < 5 && !event.currentTarget.dataset.dragging) return;
    event.preventDefault();
    if (!event.currentTarget.dataset.dragging) event.currentTarget.dataset.dragging = `true`;
    event.currentTarget.scrollLeft = current.left - distance;
  }, [finishDrag]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === `ArrowLeft`) navigate(-1);
    else if (event.key === `ArrowRight`) navigate(1);
    else if (event.key === `Home`) select(0);
    else if (event.key === `End`) select(count - 1);
    else return;
    event.preventDefault();
  }, [count, select, navigate]);
  const onWheel = useCallback(() => {
    requestedIndex.current = null;
    setInteracting(true);
    onScroll();
  }, [onScroll]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    let previousWidth = 0;
    const align = () => {
      if (!element.clientWidth) return;
      clearSettle();
      requestedIndex.current = null;
      previousWidth = element.clientWidth;
      jumpTo(currentIndex.current + 1);
      setReady(true);
    };
    align();
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === previousWidth) return;
      align();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearSettle();
      const pointerId = drag.current?.pointerId;
      drag.current = null;
      if (pointerId !== undefined && element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      delete element.dataset.dragging;
      element.style.scrollSnapType = ``;
    };
  }, [clearSettle, jumpTo]);
  useEffect(() => {
    const element = viewport.current;
    const updateVisibility = () => setPageVisible(!document.hidden && document.hasFocus());
    updateVisibility();
    document.addEventListener(`visibilitychange`, updateVisibility);
    window.addEventListener(`focus`, updateVisibility);
    window.addEventListener(`blur`, updateVisibility);
    const observer = element && typeof IntersectionObserver !== `undefined`
      ? new IntersectionObserver(entries => setInView(Boolean(entries?.[0]?.isIntersecting)), { threshold: .15 })
      : null;
    if (element && observer) observer.observe(element);
    else setInView(true);
    return () => {
      observer?.disconnect();
      document.removeEventListener(`visibilitychange`, updateVisibility);
      window.removeEventListener(`focus`, updateVisibility);
      window.removeEventListener(`blur`, updateVisibility);
    };
  }, []);
  const autoplaying = ready && count > 1 && inView && pageVisible && !reducedMotion && !hovered && !focused && !interacting;
  useEffect(() => {
    if (!autoplaying) return;
    const timer = setTimeout(() => navigate(1, false), 6500);
    return () => clearTimeout(timer);
  }, [index, revision, autoplaying, navigate]);
  return {
    index,
    select,
    viewport,
    onScroll,
    onWheel,
    ready,
    autoplaying,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    previous: () => navigate(-1),
    next: () => navigate(1),
    hoverIn: () => setHovered(true),
    hoverOut: () => setHovered(false),
    focusIn: () => setFocused(true),
    focusOut: () => setFocused(false),
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishDrag(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishDrag(event, true),
  };
};
