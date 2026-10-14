import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { portfolioHaptic } from '../../shared/common/haptics.web';

interface SheetPress {
  target: Element;
  pointerId: number;
  released: boolean;
}

const getPressTarget = (target: EventTarget | null) => target instanceof Element
  ? target.closest(`button, a, input, select, textarea, label, [role='tab'], [role='button'], [role='option'], [role='menuitem'], [contenteditable='true']`) ?? target : null;

interface MobileSheetOptions {
  open?: boolean;
  disabled?: boolean;
}

export const isMobileSheet = () => typeof window !== `undefined` && window.matchMedia(`(max-width: 900px)`).matches;

export const useMobileSheet = (onDismiss: () => void, { open = true, disabled = false }: MobileSheetOptions = {}) => {
  const [offset, setOffset] = useState(0);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
  const dismissRef = useRef(onDismiss);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const pressRef = useRef<SheetPress | null>(null);
  const openedAtRef = useRef(0);
  const gesture = useRef<{ y: number; time: number; pointer: number; moved: boolean } | null>(null);
  dismissRef.current = onDismiss;

  useEffect(() => {
    pressRef.current = null;
    if (!open) {
      openedAtRef.current = 0;
      return;
    }
    openedAtRef.current = performance.now();
    setOffset(0);
    setEntered(false);
    let enterFrame = window.requestAnimationFrame(() => {
      enterFrame = window.requestAnimationFrame(() => setEntered(true));
    });
    setClosing(false);
    setDragging(false);
    const updateViewport = () => {
      const top = window.visualViewport?.offsetTop ?? 0;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setViewport(current => current?.top === top && current.height === height ? current : { top, height });
    };
    updateViewport();
    window.addEventListener(`resize`, updateViewport);
    window.visualViewport?.addEventListener(`resize`, updateViewport);
    window.visualViewport?.addEventListener(`scroll`, updateViewport, { passive: true });
    return () => {
      pressRef.current = null;
      openedAtRef.current = 0;
      window.cancelAnimationFrame(enterFrame);
      window.removeEventListener(`resize`, updateViewport);
      window.visualViewport?.removeEventListener(`resize`, updateViewport);
      window.visualViewport?.removeEventListener(`scroll`, updateViewport);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [open]);

  const dismiss = (afterClose?: () => void) => {
    pressRef.current = null;
    if (timeoutRef.current) return;
    const complete = () => {
      timeoutRef.current = null;
      dismissRef.current();
      afterClose?.();
    };
    if (!isMobileSheet() || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
      complete();
      return;
    }
    setClosing(true);
    timeoutRef.current = setTimeout(complete, 220);
  };
  const close = () => {
    pressRef.current = null;
    if (disabled) return;
    portfolioHaptic(`tap`);
    dismiss();
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    const distance = Math.max(0, event.clientY - current.y);
    const velocity = distance / Math.max(1, performance.now() - current.time);
    gesture.current = null;
    suppressClick.current = current.moved;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && !disabled && (distance > 80 || distance > 32 && velocity > .55)) {
      portfolioHaptic(`drop`);
      dismiss();
    } else setOffset(0);
  };
  const pressProps = {
    onPointerDownCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (!isMobileSheet()) return;
      pressRef.current = null;
      const target = getPressTarget(event.target);
      if (!open || closing || !openedAtRef.current || performance.now() - openedAtRef.current < 220) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (target && event.isPrimary && event.button === 0) {
        pressRef.current = { target, released: false, pointerId: event.pointerId };
      }
    },
    onPointerUpCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (!isMobileSheet()) return;
      const press = pressRef.current;
      const bounds = press?.target.getBoundingClientRect();
      const inside = bounds && event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (press?.pointerId === event.pointerId && inside && press.target === getPressTarget(event.target)) press.released = true;
      else pressRef.current = null;
    },
    onPointerCancelCapture: () => { pressRef.current = null; },
    onMouseDownCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (!isMobileSheet() || event.detail === 0) return;
      if (pressRef.current?.target === getPressTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (!isMobileSheet()) return;
      const press = pressRef.current;
      const target = getPressTarget(event.target);
      pressRef.current = null;
      if (event.detail === 0) return;
      const label = press?.target instanceof HTMLLabelElement ? press.target : null;
      if (open && !closing && press?.released && (press.target === target || label?.control === target)) {
        // Native labels forward the same completed press to their associated input.
        if (label?.control && target === label) {
          pressRef.current = press;
          window.setTimeout(() => { if (pressRef.current === press) pressRef.current = null; }, 0);
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
  };
  const handleProps = {
    disabled,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0 || !suppressClick.current) close();
      suppressClick.current = false;
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || closing || !isMobileSheet() || !event.isPrimary || event.button !== 0) return;
      gesture.current = { moved: false, y: event.clientY, pointer: event.pointerId, time: performance.now() };
      suppressClick.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const current = gesture.current;
      if (!current || current.pointer !== event.pointerId) return;
      const distance = Math.max(0, event.clientY - current.y);
      if (distance > 6 && !current.moved) {
        current.moved = true;
        setDragging(true);
        portfolioHaptic(`lift`);
      }
      if (current.moved) setOffset(distance);
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => endDrag(event),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => endDrag(event, true),
    onLostPointerCapture: () => {
      if (!gesture.current) return;
      gesture.current = null;
      setDragging(false);
      setOffset(0);
    },
  };
  const style = {
    '--mobile-sheet-offset': `${offset}px`,
    ...(viewport ? {
      '--mobile-sheet-viewport-top': `${viewport.top}px`,
      '--mobile-sheet-viewport-height': `${viewport.height}px`,
    } : {}),
  } as CSSProperties;

  return {
    close,
    style,
    dismiss,
    closing,
    mobile: isMobileSheet(),
    handleProps,
    pressProps,
    className: ` mobile-sheet-backdrop${entered ? ` mobile-sheet-entered` : ``}${closing ? ` mobile-sheet-closing` : ``}${dragging ? ` mobile-sheet-dragging` : ``}`,
  };
};
