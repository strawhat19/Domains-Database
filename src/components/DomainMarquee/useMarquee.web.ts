import { useEffect, useRef, useState, useCallback } from 'react';
import type { MouseEvent, FocusEvent, PointerEvent } from 'react';

interface DragGesture {
  startX: number;
  startY: number;
  lastX: number;
  dragged: boolean;
  pointerId: number;
  captureTarget: Element;
}

const loopPosition = (position: number, width: number) => ((position % width) + width) % width;

export const useMarquee = (contentKey: string) => {
  const phase = useRef(0);
  const cycleWidth = useRef(0);
  const focused = useRef(false);
  const reducedMotion = useRef(false);
  const suppressClick = useRef(false);
  const track = useRef<HTMLDivElement>(null);
  const cycle = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<DragGesture | null>(null);
  const [copyCount, setCopyCount] = useState(3);
  const [dragging, setDragging] = useState(false);
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);
  const measured = measuredKey === contentKey;
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const paint = useCallback(() => {
    if (!track.current || !cycleWidth.current) return;
    track.current.style.transform = `translate3d(${-cycleWidth.current - phase.current}px, 0, 0)`;
  }, []);

  useEffect(() => {
    focused.current = false;
    setMeasuredKey(null);
    let frame = 0;
    let lastFrame = 0;
    let layoutReady = false;
    let cancelled = false;
    let fontsReady = !document.fonts || document.fonts.status === `loaded`;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const motion = window.matchMedia(`(prefers-reduced-motion: reduce)`);
    const applyMotionPreference = () => { reducedMotion.current = motion.matches; };
    const measure = () => {
      if (!cycle.current || !viewport.current) return;
      const width = cycle.current.getBoundingClientRect().width;
      if (!width) return;
      layoutReady = false;
      if (settleTimer !== undefined) clearTimeout(settleTimer);
      const previousWidth = cycleWidth.current;
      const progress = previousWidth > 0 ? loopPosition(phase.current, previousWidth) / previousWidth : 0;
      cycleWidth.current = width;
      phase.current = progress * width;
      setCopyCount(Math.max(3, Math.ceil(viewport.current.clientWidth / width) + 2));
      paint();
      if (fontsReady) settleTimer = setTimeout(() => {
        if (cancelled || !fontsReady) return;
        paint();
        setMeasuredKey(contentKey);
        layoutReady = true;
        lastFrame = 0;
      }, 250);
    };
    const onFontLoading = () => {
      fontsReady = false;
      layoutReady = false;
      focused.current = false;
      setMeasuredKey(null);
      if (settleTimer !== undefined) clearTimeout(settleTimer);
      settleTimer = undefined;
    };
    const onFontsReady = () => { fontsReady = true; measure(); };
    const onVisibilityChange = () => { lastFrame = 0; if (!document.hidden) measure(); };
    const animate = (now: number) => {
      const elapsed = lastFrame ? Math.min(now - lastFrame, 64) : 0;
      lastFrame = now;
      if (layoutReady && !document.hidden && cycleWidth.current && !reducedMotion.current && !focused.current && !gesture.current) {
        phase.current = loopPosition(phase.current + elapsed * .035, cycleWidth.current);
        paint();
      }
      frame = window.requestAnimationFrame(animate);
    };
    const observer = typeof ResizeObserver === `undefined` ? null : new ResizeObserver(measure);
    if (cycle.current) observer?.observe(cycle.current);
    if (viewport.current) observer?.observe(viewport.current);
    applyMotionPreference();
    measure();
    void document.fonts?.ready.then(() => { if (!cancelled) onFontsReady(); });
    document.fonts?.addEventListener(`loading`, onFontLoading);
    document.fonts?.addEventListener(`loadingdone`, onFontsReady);
    document.fonts?.addEventListener(`loadingerror`, onFontsReady);
    document.addEventListener(`visibilitychange`, onVisibilityChange);
    motion.addEventListener(`change`, applyMotionPreference);
    window.addEventListener(`resize`, measure);
    frame = window.requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (settleTimer !== undefined) clearTimeout(settleTimer);
      window.cancelAnimationFrame(frame);
      document.fonts?.removeEventListener(`loading`, onFontLoading);
      document.fonts?.removeEventListener(`loadingdone`, onFontsReady);
      document.fonts?.removeEventListener(`loadingerror`, onFontsReady);
      document.removeEventListener(`visibilitychange`, onVisibilityChange);
      window.removeEventListener(`resize`, measure);
      motion.removeEventListener(`change`, applyMotionPreference);
      if (clickTimer.current !== undefined) clearTimeout(clickTimer.current);
    };
  }, [contentKey, paint]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!measured || !event.isPrimary || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target.closest(`a`) : null;
    const captureTarget = target ?? event.currentTarget;
    suppressClick.current = false;
    if (clickTimer.current !== undefined) clearTimeout(clickTimer.current);
    captureTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      dragged: false,
      captureTarget,
      lastX: event.clientX,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (current.captureTarget.hasPointerCapture(event.pointerId)) {
      current.captureTarget.releasePointerCapture(event.pointerId);
    }
    if (cancelled) suppressClick.current = false;
    else if (current.dragged) {
      clickTimer.current = setTimeout(() => { suppressClick.current = false; }, 400);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || !cycleWidth.current) return;
    const horizontal = Math.abs(event.clientX - current.startX);
    const vertical = Math.abs(event.clientY - current.startY);
    if (!current.dragged) {
      if (vertical > 6 && vertical > horizontal) { finishPointer(event, true); return; }
      if (horizontal < 6 || horizontal <= vertical) return;
      current.dragged = true;
      suppressClick.current = true;
      setDragging(true);
      const active = document.activeElement;
      if (active instanceof HTMLElement && viewport.current?.contains(active)) active.blur();
    }
    event.preventDefault();
    phase.current = loopPosition(phase.current - (event.clientX - current.lastX), cycleWidth.current);
    current.lastX = event.clientX;
    paint();
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (measured && !suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  const onFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    focused.current = true;
    if (!viewport.current || !(event.target instanceof HTMLElement)) return;
    const pill = event.target.closest(`a[data-marquee-original]`);
    if (!pill) return;
    const bounds = pill.getBoundingClientRect();
    const frame = viewport.current.getBoundingClientRect();
    let nextPhase = phase.current;
    if (bounds.left < frame.left + 8) nextPhase += bounds.left - frame.left - 8;
    else if (bounds.right > frame.right - 8) nextPhase += bounds.right - frame.right + 8;
    phase.current = Math.max(0, Math.min(nextPhase, Math.max(0, cycleWidth.current - frame.width)));
    paint();
  };

  const onBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && viewport.current?.contains(event.relatedTarget)) return;
    focused.current = false;
  };

  return {
    track,
    cycle,
    viewport,
    dragging,
    measured,
    copyCount,
    onPointerDown,
    onPointerMove,
    onClickCapture,
    onFocusCapture,
    onBlurCapture,
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishPointer(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
  };
};
