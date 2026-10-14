import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { isMobileSheet } from './useMobileSheet';

const modalStack: object[] = [];
let unlockScroll: (() => void) | null = null;
const inertLayers = new Map<HTMLElement, { count: number; previous: boolean }>();

const isolateModal = (container: HTMLElement | null) => {
  const siblings: HTMLElement[] = [];
  let branch = container;
  while (branch?.parentElement) {
    for (const sibling of Array.from(branch.parentElement.children)) {
      if (!(sibling instanceof HTMLElement) || sibling === branch || [`SCRIPT`, `STYLE`, `LINK`].includes(sibling.tagName)) continue;
      const layer = inertLayers.get(sibling) ?? { count: 0, previous: sibling.inert };
      layer.count += 1;
      inertLayers.set(sibling, layer);
      sibling.inert = true;
      siblings.push(sibling);
    }
    branch = branch.parentElement;
    if (branch === document.body) break;
  }
  return () => {
    for (const sibling of siblings) {
      const layer = inertLayers.get(sibling);
      if (!layer) continue;
      layer.count -= 1;
      if (layer.count) continue;
      sibling.inert = layer.previous;
      inertLayers.delete(sibling);
    }
  };
};

const lockBodyScroll = () => {
  const body = document.body;
  const previous = {
    top: body.style.top,
    left: body.style.left,
    width: body.style.width,
    overflow: body.style.overflow,
    position: body.style.position,
  };
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const fixed = isMobileSheet();
  body.style.overflow = `hidden`;
  if (fixed) {
    body.style.position = `fixed`;
    body.style.top = `${-scrollY}px`;
    body.style.left = `${-scrollX}px`;
    body.style.width = `100%`;
  }
  return () => {
    Object.assign(body.style, previous);
    if (fixed) {
      const scrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = `auto`;
      window.scrollTo(scrollX, scrollY);
      document.documentElement.style.scrollBehavior = scrollBehavior;
    }
  };
};

export const useModalFocus = (
  container: RefObject<HTMLDivElement | null>,
  open: boolean,
  onClose: () => void,
  preventRestoreScroll = false,
) => {
  const closeHandler = useRef(onClose);
  const layer = useRef({});
  closeHandler.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!modalStack.length) unlockScroll = lockBodyScroll();
    modalStack.push(layer.current);
    const restoreBackground = isMobileSheet() ? isolateModal(container.current) : () => {};
    const isTopModal = () => modalStack[modalStack.length - 1] === layer.current;
    const getFocusableElements = () => Array.from(container.current?.querySelectorAll<HTMLElement>(
      `button:not([disabled]):not([tabindex='-1']), button[role='menuitem']:not([disabled]), a[href], input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex='0']`,
    ) ?? []).filter(element => element.offsetParent !== null && !element.closest(`[hidden], [inert], [aria-hidden='true']`));
    const frame = window.requestAnimationFrame(() => {
      if (!isTopModal()) return;
      const initialFocus = container.current?.querySelector<HTMLElement>(`[data-autofocus]`)
        ?? (container.current?.getAttribute(`role`) === `menu`
          ? container.current.querySelector<HTMLElement>(`[role='menuitem']:not([disabled])`) : null);
      // Keep the keyboard closed until a phone user chooses an editable field.
      (initialFocus ?? (isMobileSheet() ? container.current : getFocusableElements()[0]) ?? container.current)?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal() || event.defaultPrevented) return;
      if (event.key === `Escape`) {
        event.preventDefault();
        closeHandler.current();
      }
      if (event.key !== `Tab`) return;
      const focusable = getFocusableElements();
      const last = focusable[focusable.length - 1];
      const first = focusable[0];
      if (!first) {
        event.preventDefault();
        container.current?.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener(`keydown`, handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener(`keydown`, handleKeyDown);
      restoreBackground();
      const position = modalStack.indexOf(layer.current);
      if (position >= 0) modalStack.splice(position, 1);
      if (!modalStack.length) {
        unlockScroll?.();
        unlockScroll = null;
      }
      if (previousFocus?.isConnected) {
        const unavailable = previousFocus.matches(`:disabled`) || previousFocus.closest(`[hidden], [inert], [aria-hidden='true']`);
        const fallbackId = unavailable ? previousFocus.dataset.focusFallback : undefined;
        const fallback = fallbackId ? document.getElementById(fallbackId) : null;
        if (fallback?.isConnected && !fallback.matches(`:disabled`) && !fallback.closest(`[hidden], [inert], [aria-hidden='true']`)) {
          fallback.focus({ preventScroll: true });
        } else if (!unavailable) previousFocus.focus({ preventScroll: preventRestoreScroll || isMobileSheet() });
      }
    };
  }, [container, open, preventRestoreScroll]);
};
