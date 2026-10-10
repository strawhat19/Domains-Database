import type { MouseEvent, KeyboardEvent } from 'react';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import type { CustomPortfolioGroup } from '../../shared/portfolioPreferences/types';

interface GroupContextMenuTarget {
  x: number;
  y: number;
  group: CustomPortfolioGroup;
}

export type GroupContextMenuAction = `delete` | `convert` | `convert-to-app` | `convert-to-group` | `assign-collection`;

const getMenuItems = (element: HTMLDivElement | null) => Array.from(
  element?.querySelectorAll<HTMLButtonElement>(`[role='menuitem']:not([disabled])`) ?? [],
).filter(item => !item.closest(`[hidden], [inert], [aria-hidden='true']`));

export const useGroupContextMenu = (
  onAction: (action: GroupContextMenuAction, group: CustomPortfolioGroup, collectionId?: string) => void,
  disabled = false,
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [menu, setMenu] = useState<GroupContextMenuTarget | null>(null);

  const close = useCallback((restoreFocus = false) => {
    setMenu(null);
    if (restoreFocus && previousFocusRef.current?.isConnected && !previousFocusRef.current.matches(`:disabled`)) {
      previousFocusRef.current.focus({ preventScroll: true });
    }
  }, []);

  const openForRow = (row: HTMLElement, group: CustomPortfolioGroup, point?: { x: number; y: number }) => {
    if (disabled) return;
    const focused = document.activeElement;
    previousFocusRef.current = focused instanceof HTMLElement && row.contains(focused)
      ? focused : row.querySelector<HTMLButtonElement>(`.portfolio-group-settings`);
    const bounds = row.getBoundingClientRect();
    setMenu({
      group,
      x: point?.x ?? bounds.left,
      y: point?.y ?? bounds.bottom,
    });
  };

  const open = (event: MouseEvent<HTMLElement>, group: CustomPortfolioGroup) => {
    event.preventDefault();
    event.stopPropagation();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    openForRow(event.currentTarget, group, keyboard ? undefined : { x: event.clientX, y: event.clientY });
  };

  const activate = (action: GroupContextMenuAction, collectionId?: string) => {
    if (!menu || disabled || (action === `delete` && menu.group.isApp) || (action === `assign-collection` && !collectionId)) return;
    close(true);
    onAction(action, menu.group, collectionId);
  };

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!menu || !element || disabled) return;
    const reposition = () => {
      const { width, height } = element.getBoundingClientRect();
      element.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - height - 8))}px`;
    };
    reposition();
    getMenuItems(element)[0]?.focus({ preventScroll: true });
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
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) close();
    };
    const keyboard = (event: globalThis.KeyboardEvent) => {
      if (event.key === `Escape`) {
        event.preventDefault();
        close(true);
      } else if (event.key === `Tab`) close(true);
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      close();
    };
    window.addEventListener(`blur`, dismiss);
    window.addEventListener(`resize`, dismiss);
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

  return { menu, open, close, menuRef, disabled, activate, onKeyDown, openFromKeyboard: openForRow };
};
