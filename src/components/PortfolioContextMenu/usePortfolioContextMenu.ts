import type { MouseEvent, KeyboardEvent } from 'react';
import { useModalFocus } from '../MobileSheet/useModalFocus';
import { portfolioHaptic } from '../../shared/common/haptics.web';
import { useMobileSheet, isMobileSheet } from '../MobileSheet/useMobileSheet';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';

interface PortfolioContextMenuTarget<Target> {
  x: number;
  y: number;
  target: Target;
}

const getMenuItems = (element: HTMLElement | null) => Array.from(
  element?.querySelectorAll<HTMLButtonElement>(`[role='menuitem']:not([disabled])`) ?? [],
).filter(item => !item.closest(`[hidden], [inert], [aria-hidden='true']`));

const getMenuControls = (element: HTMLElement | null) => Array.from(
  element?.querySelectorAll<HTMLElement>(`input[type='search']:not([disabled]), [role='menuitem']:not([disabled])`) ?? [],
).filter(item => !item.closest(`[hidden], [inert], [aria-hidden='true']`));

export const usePortfolioContextMenu = <Target>(disabled: boolean, focusSelector: string) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [menu, setMenu] = useState<PortfolioContextMenuTarget<Target> | null>(null);

  const restoreFocusRef = useRef(false);
  const openRef = useRef(false);
  const disabledRef = useRef(disabled);
  const sheetRef = useRef<ReturnType<typeof useMobileSheet> | null>(null);
  disabledRef.current = disabled;
  openRef.current = Boolean(menu);
  const finishClose = useCallback(() => {
    setMenu(null);
    const invokingControl = previousFocusRef.current;
    const restoreFocus = () => {
      if (!invokingControl?.isConnected || invokingControl.matches(`:disabled`) || invokingControl.closest(`[hidden], [inert], [aria-hidden='true']`)) return;
      invokingControl.focus({ preventScroll: true });
    };
    if (restoreFocusRef.current) {
      if (isMobileSheet()) window.requestAnimationFrame(restoreFocus);
      else restoreFocus();
    }
    restoreFocusRef.current = false;
  }, []);
  const sheet = useMobileSheet(finishClose, { open: Boolean(menu) });
  sheetRef.current = sheet;
  const close = useCallback((restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus;
    if (openRef.current) sheetRef.current?.close();
  }, []);
  useModalFocus(menuRef, Boolean(menu) && isMobileSheet(), () => close(true), true);

  const openForRow = (row: HTMLElement, target: Target, point?: { x: number; y: number }) => {
    if (disabled) return;
    const focused = document.activeElement;
    previousFocusRef.current = focused instanceof HTMLElement && row.contains(focused)
      ? focused : row.querySelector<HTMLElement>(focusSelector) ?? (row.matches(`a[href], button, [tabindex]`) ? row : null);
    const bounds = row.getBoundingClientRect();
    setMenu({
      target,
      x: point?.x ?? bounds.left,
      y: point?.y ?? bounds.bottom,
    });
  };

  const open = (event: MouseEvent<HTMLElement>, target: Target) => {
    event.preventDefault();
    event.stopPropagation();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    openForRow(event.currentTarget, target, keyboard ? undefined : { x: event.clientX, y: event.clientY });
  };

  const runAction = (action: () => void) => {
    if (!menu || disabled) return;
    restoreFocusRef.current = true;
    portfolioHaptic(`tap`);
    sheet.dismiss(() => { if (!disabledRef.current) action(); });
  };

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!menu || !element || disabled) return;
    const reposition = () => {
      if (isMobileSheet()) return;
      const { width, height } = element.getBoundingClientRect();
      element.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - height - 8))}px`;
    };
    reposition();
    if (!isMobileSheet()) getMenuItems(element)[0]?.focus({ preventScroll: true });
    if (typeof ResizeObserver === `undefined`) return;
    const observer = new ResizeObserver(reposition);
    observer.observe(element);
    return () => observer.disconnect();
  }, [menu, disabled]);

  useEffect(() => {
    if (disabled && menu) close(true);
  }, [menu, disabled, close]);

  useEffect(() => {
    if (!menu) return;
    const dismiss = () => close();
    const outside = (event: PointerEvent) => {
      if (isMobileSheet()) return;
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) close();
    };
    const keyboard = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === `Escape`) {
        event.preventDefault();
        close(true);
      } else if (event.key === `Tab` && !isMobileSheet()) close(true);
    };
    const scroll = (event: Event) => {
      if (isMobileSheet()) return;
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      close();
    };
    window.addEventListener(`blur`, dismiss);
    if (!isMobileSheet()) window.addEventListener(`resize`, dismiss);
    window.addEventListener(`scroll`, scroll, true);
    document.addEventListener(`keydown`, keyboard);
    document.addEventListener(`pointerdown`, outside);
    return () => {
      window.removeEventListener(`blur`, dismiss);
      window.removeEventListener(`resize`, dismiss);
      window.removeEventListener(`scroll`, scroll, true);
      document.removeEventListener(`keydown`, keyboard);
      document.removeEventListener(`pointerdown`, outside);
    };
  }, [menu, close]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === `Tab` && !isMobileSheet()) {
      const controls = getMenuControls(menuRef.current);
      const index = controls.findIndex(control => control === document.activeElement);
      const next = controls[index + (event.shiftKey ? -1 : 1)];
      if (index < 0 || !next) return;
      event.preventDefault();
      event.stopPropagation();
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: `nearest` });
      return;
    }
    const editable = event.target instanceof HTMLElement ? event.target.closest(`input, textarea, [contenteditable='true']`) : null;
    if (editable) {
      if (!editable.matches(`input[type='search']`) || ![`ArrowUp`, `ArrowDown`].includes(event.key)) return;
      const tree = editable.closest(`.portfolio-destination-tree-picker`)?.querySelector<HTMLElement>(`.portfolio-destination-tree`);
      const items = getMenuItems(tree ?? null);
      const next = event.key === `ArrowDown` ? items[0] : items[items.length - 1];
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: `nearest` });
      return;
    }
    if (![`End`, `Home`, `ArrowUp`, `ArrowDown`].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const items = getMenuItems(menuRef.current);
    if (!items.length) return;
    const index = items.findIndex(item => item === document.activeElement);
    const next = event.key === `Home` ? 0 : event.key === `End` ? items.length - 1
      : (index + (event.key === `ArrowDown` ? 1 : -1) + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
    items[next]?.scrollIntoView({ block: `nearest` });
  };

  return { menu, open, close, sheet, menuRef, disabled, runAction, onKeyDown, openFromKeyboard: openForRow };
};
