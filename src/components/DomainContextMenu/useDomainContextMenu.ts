import type { DomainRecord } from '../../shared/types';
import type { MouseEvent, KeyboardEvent } from 'react';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';

interface DomainContextMenuTarget {
  x: number;
  y: number;
  domain: DomainRecord;
  domains: DomainRecord[];
}

export type DomainContextMenuAction = `close` | `group` | `settings` | `assign-group` | `assign-collection`;

const getMenuItems = (element: HTMLDivElement | null) => Array.from(
  element?.querySelectorAll<HTMLButtonElement>(`[role='menuitem']:not([disabled])`) ?? [],
).filter(item => !item.closest(`[hidden], [inert], [aria-hidden='true']`));

export const useDomainContextMenu = (
  onAction?: (action: DomainContextMenuAction, domains: DomainRecord[], domain: DomainRecord, targetId?: string) => void,
  disabled = false,
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [menu, setMenu] = useState<DomainContextMenuTarget | null>(null);

  const close = useCallback((restoreFocus = false) => {
    setMenu(null);
    if (restoreFocus && previousFocusRef.current?.isConnected) {
      previousFocusRef.current.focus({ preventScroll: true });
    }
  }, []);

  const openForTarget = (
    target: HTMLElement,
    domain: DomainRecord,
    domains: DomainRecord[],
    point?: { x: number; y: number },
  ) => {
    const focused = document.activeElement;
    previousFocusRef.current = focused instanceof HTMLElement && target.contains(focused)
      ? focused : target.querySelector<HTMLInputElement>(`input[type='checkbox']`) ?? (target.matches(`a[href], button, [tabindex]`) ? target : null);
    const bounds = target.getBoundingClientRect();
    setMenu({
      domain,
      domains,
      x: point?.x ?? bounds.left,
      y: point?.y ?? bounds.bottom,
    });
  };

  const open = (event: MouseEvent<HTMLElement>, domain: DomainRecord, domains: DomainRecord[]) => {
    event.preventDefault();
    event.stopPropagation();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    openForTarget(event.currentTarget, domain, domains, keyboard ? undefined : { x: event.clientX, y: event.clientY });
  };

  const activate = (action: DomainContextMenuAction, targetId?: string) => {
    if (!menu || (disabled && action !== `close`) || ([`assign-group`, `assign-collection`].includes(action) && !targetId)) return;
    close(true);
    onAction?.(action, menu.domains, menu.domain, targetId);
  };

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!menu || !element) return;
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
  }, [disabled, menu, close]);

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

  return { menu, open, close, menuRef, disabled, activate, onKeyDown, openFromKeyboard: openForTarget };
};
