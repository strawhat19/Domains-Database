import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { BoardEntity } from './types';
import { portfolioHaptic } from '../../shared/common/haptics.web';

interface Gesture {
  x: number;
  y: number;
  dx: number;
  dy: number;
  touch: boolean;
  armed: boolean;
  dragging: boolean;
  source: BoardEntity;
  element: HTMLElement;
  armTimer?: number;
  holdTimer?: number;
}

interface GestureOptions {
  disabled: boolean;
  surfaceRef?: RefObject<HTMLDivElement | null>;
  onDrop: (source: BoardEntity, target: BoardEntity, after: boolean) => boolean;
  onAction: (source: BoardEntity, element: HTMLElement) => void;
}

const readEntity = (element: HTMLElement, key: `boardSource` | `boardTarget`): BoardEntity | null => {
  try { return JSON.parse(element.dataset[key] ?? `null`) as BoardEntity | null; } catch { return null; }
};
const validTarget = (source: BoardEntity, target: BoardEntity) => {
  if (source.kind === target.kind && source.id === target.id) return false;
  if (source.kind === `collection`) return target.kind === `collection` && target.id !== `main`;
  return source.kind !== `group` || target.kind !== `domain`;
};

export const useBoardGestures = (options: GestureOptions) => {
  const { surfaceRef } = options;
  const rootRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const latest = useRef(options);
  latest.current = options;
  const [preview, setPreview] = useState<{ source: BoardEntity; x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState(``);

  useEffect(() => {
    const root = surfaceRef?.current ?? rootRef.current;
    if (!root) return;
    let gesture: Gesture | null = null;
    let target: { element: HTMLElement; entity: BoardEntity; after: boolean } | null = null;
    let frame = 0;
    let suppressUntil = 0;

    const stopTimers = () => {
      window.clearTimeout(gesture?.armTimer);
      window.clearTimeout(gesture?.holdTimer);
    };
    const clear = () => {
      stopTimers();
      window.cancelAnimationFrame(frame);
      target?.element.removeAttribute(`data-board-over`);
      if (gesture) {
        gesture.element.removeAttribute(`data-board-lifted`);
      }
      root.removeAttribute(`data-board-dragging`);
      gesture = null;
      target = null;
      setPreview(null);
    };
    const locateTarget = () => {
      if (!gesture?.dragging) return;
      const { x, y, source } = gesture;
      const elements = document.elementsFromPoint(x, y);
      const sourceElement = source.kind === `group` ? gesture.element.closest(`.mobile-group-card`) ?? gesture.element : gesture.element;
      const hit = elements.find(element => root.contains(element));
      if (hit && sourceElement.contains(hit)) {
        target?.element.removeAttribute(`data-board-over`);
        target = null;
        return;
      }
      let next: typeof target = null;
      for (const hit of elements) {
        const element = hit.closest<HTMLElement>(`[data-board-target]`);
        if (!element || !root.contains(element) || element.closest(`[hidden], [inert]`)) continue;
        const entity = readEntity(element, `boardTarget`);
        if (!entity || !validTarget(source, entity)) continue;
        const bounds = element.getBoundingClientRect();
        const horizontal = source.kind === `collection`;
        const after = horizontal ? x > bounds.left + bounds.width / 2 : y > bounds.top + bounds.height / 2;
        next = { entity, element, after };
        break;
      }
      const changed = next?.element !== target?.element || next?.after !== target?.after;
      target?.element.removeAttribute(`data-board-over`);
      target = next;
      if (target) target.element.dataset.boardOver = target.entity.kind === source.kind ? (target.after ? `after` : `before`) : `inside`;
      if (changed && target) {
        portfolioHaptic(`tick`);
        setAnnouncement(`Move ${source.label} ${target.entity.kind === source.kind ? target.after ? `After` : `Before` : `Into`} ${target.entity.label}`);
      }
    };
    const edgeSpeed = (position: number, start: number, end: number) => position < start + 56
      ? -Math.min(12, Math.max(0, (start + 56 - position) / 5))
      : position > end - 56 ? Math.min(12, Math.max(0, (position - end + 56) / 5)) : 0;
    const autoScroll = () => {
      if (!gesture?.dragging) return;
      const { x, y, source } = gesture;
      if (previewRef.current) {
        previewRef.current.style.left = `${Math.min(x + 12, window.innerWidth - previewRef.current.offsetWidth - 8)}px`;
        previewRef.current.style.top = `${Math.min(y + 12, window.innerHeight - previewRef.current.offsetHeight - 8)}px`;
      }
      root.querySelectorAll<HTMLElement>(`[data-board-scroll]`).forEach(region => {
        const bounds = region.getBoundingClientRect();
        if (x < bounds.left || x > bounds.right || y < Math.max(0, bounds.top) || y > Math.min(window.innerHeight, bounds.bottom)) return;
        if (region.dataset.boardScroll === `horizontal`) region.scrollLeft += edgeSpeed(x, bounds.left, bounds.right);
        else if (source.kind !== `collection`) region.scrollTop += edgeSpeed(y, Math.max(0, bounds.top), Math.min(window.innerHeight, bounds.bottom));
      });
      window.scrollBy(0, edgeSpeed(y, 0, window.innerHeight));
      locateTarget();
      frame = window.requestAnimationFrame(autoScroll);
    };
    const startDrag = () => {
      if (!gesture || gesture.dragging) return;
      if (latest.current.disabled) { clear(); return; }
      stopTimers();
      gesture.dragging = true;
      gesture.element.dataset.boardLifted = `true`;
      root.dataset.boardDragging = `true`;
      portfolioHaptic(`lift`);
      setAnnouncement(`Lifted ${gesture.source.label}. Move To A Destination And Release`);
      setPreview({ source: gesture.source, x: gesture.x, y: gesture.y });
      locateTarget();
      frame = window.requestAnimationFrame(autoScroll);
    };
    const begin = (element: EventTarget | null, x: number, y: number, touch: boolean) => {
      if (latest.current.disabled || gesture || !(element instanceof Element)) return;
      const sourceElement = element.closest<HTMLElement>(`[data-board-source]`);
      if (!sourceElement || !root.contains(sourceElement) || sourceElement.closest(`[hidden], [inert], [aria-hidden='true']`)
        || sourceElement.querySelector(`input:focus, textarea:focus`)) return;
      const source = readEntity(sourceElement, `boardSource`);
      if (!source) return;
      const title = element.closest(`.portfolio-name-editor-trigger`);
      const handle = element.closest(`[data-board-handle]`) ?? (source.kind === `group` ? title : null);
      const interactive = element.closest(`button, a, input, label, summary, select, textarea, [data-board-no-drag]`);
      if (interactive && !handle) return;
      gesture = { x, y, touch, source, element: sourceElement, dx: 0, dy: 0, armed: !touch, dragging: false };
      if (touch) {
        gesture.armTimer = window.setTimeout(() => {
          if (!gesture) return;
          gesture.armed = true;
          if (source.kind === `collection` || handle) startDrag();
        }, 300);
        gesture.holdTimer = window.setTimeout(() => {
          if (!gesture || gesture.dragging) return;
          const current = gesture;
          suppressUntil = Date.now() + 350;
          clear();
          portfolioHaptic(`tap`);
          latest.current.onAction(current.source, current.element);
        }, 450);
      }
    };
    const move = (x: number, y: number, event: Event) => {
      if (!gesture) return;
      if (latest.current.disabled) { clear(); return; }
      gesture.dx += x - gesture.x;
      gesture.dy += y - gesture.y;
      gesture.x = x;
      gesture.y = y;
      const distance = Math.hypot(gesture.dx, gesture.dy);
      // Let ordinary swipes scroll the board; moving requires a deliberate hold.
      if (!gesture.armed && distance > 8) { clear(); return; }
      if (gesture.armed && distance > 8) startDrag();
      if (!gesture.dragging) return;
      if (event.cancelable) event.preventDefault();
      locateTarget();
    };
    const finish = (cancelled = false) => {
      if (!gesture) return;
      const current = gesture;
      const destination = target;
      if (current.dragging) suppressUntil = Date.now() + 350;
      clear();
      if (cancelled || latest.current.disabled) { setAnnouncement(`Move Cancelled`); return; }
      if (current.dragging && destination) {
        const moved = latest.current.onDrop(current.source, destination.entity, destination.after);
        if (moved) portfolioHaptic(`drop`);
        setAnnouncement(moved ? `Moved ${current.source.label} To ${destination.entity.label}` : `Move Was Not Saved`);
      } else if (current.dragging) setAnnouncement(`Move Cancelled`);
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) { finish(true); return; }
      const point = event.touches[0];
      begin(event.target, point.clientX, point.clientY, true);
    };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) { finish(true); return; }
      const point = event.touches[0];
      move(point.clientX, point.clientY, event);
    };
    const touchEnd = () => { if (gesture?.touch) finish(); };
    const pointerDown = (event: PointerEvent) => { if (event.pointerType !== `touch` && event.button === 0) begin(event.target, event.clientX, event.clientY, false); };
    const pointerMove = (event: PointerEvent) => { if (!gesture?.touch) move(event.clientX, event.clientY, event); };
    const pointerUp = () => { if (gesture && !gesture.touch) finish(); };
    const cancel = () => finish(true);
    const pointerCancel = (event: PointerEvent) => { if (event.pointerType !== `touch`) cancel(); };
    const visibility = () => { if (document.hidden) cancel(); };
    const keyDown = (event: KeyboardEvent) => { if (event.key === `Escape` && gesture) { event.preventDefault(); cancel(); } };
    const click = (event: MouseEvent) => { if (Date.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); } };
    const context = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.target.closest(`input, textarea, [contenteditable='true']`)) return;
      const element = event.target.closest<HTMLElement>(`[data-board-source]`);
      if (!element || latest.current.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (gesture) return;
      const source = readEntity(element, `boardSource`);
      if (source) latest.current.onAction(source, element);
    };
    const nativeDrag = (event: DragEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(`[data-board-source]`)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    root.addEventListener(`touchstart`, touchStart, { passive: true });
    document.addEventListener(`touchmove`, touchMove, { passive: false });
    document.addEventListener(`touchend`, touchEnd);
    document.addEventListener(`touchcancel`, cancel);
    root.addEventListener(`pointerdown`, pointerDown, true);
    document.addEventListener(`pointermove`, pointerMove);
    document.addEventListener(`pointerup`, pointerUp);
    document.addEventListener(`pointercancel`, pointerCancel);
    root.addEventListener(`click`, click, true);
    root.addEventListener(`contextmenu`, context);
    root.addEventListener(`dragstart`, nativeDrag, true);
    document.addEventListener(`keydown`, keyDown);
    document.addEventListener(`visibilitychange`, visibility);
    window.addEventListener(`blur`, cancel);
    window.addEventListener(`resize`, cancel);
    return () => {
      clear();
      root.removeEventListener(`touchstart`, touchStart);
      document.removeEventListener(`touchmove`, touchMove);
      document.removeEventListener(`touchend`, touchEnd);
      document.removeEventListener(`touchcancel`, cancel);
      root.removeEventListener(`pointerdown`, pointerDown, true);
      document.removeEventListener(`pointermove`, pointerMove);
      document.removeEventListener(`pointerup`, pointerUp);
      document.removeEventListener(`pointercancel`, pointerCancel);
      root.removeEventListener(`click`, click, true);
      root.removeEventListener(`contextmenu`, context);
      root.removeEventListener(`dragstart`, nativeDrag, true);
      document.removeEventListener(`keydown`, keyDown);
      document.removeEventListener(`visibilitychange`, visibility);
      window.removeEventListener(`blur`, cancel);
      window.removeEventListener(`resize`, cancel);
    };
  }, [surfaceRef]);
  return { rootRef, previewRef, preview, announcement };
};
