import type { DomainRecord } from '../../shared/types';
import type { MouseEvent, KeyboardEvent } from 'react';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';

interface DomainContextMenuTarget {
  x: number;
  y: number;
  domain: DomainRecord;
  domains: DomainRecord[];
}

export type DomainContextMenuAction = `view` | `details` | `group` | `close`;

export const useDomainContextMenu = (
  onAction?: (action: DomainContextMenuAction, domains: DomainRecord[]) => void,
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

  const openForRow = (
    row: HTMLTableRowElement,
    domain: DomainRecord,
    domains: DomainRecord[],
    point?: { x: number; y: number },
  ) => {
    const focused = document.activeElement;
    previousFocusRef.current = focused instanceof HTMLElement && row.contains(focused)
      ? focused : row.querySelector<HTMLInputElement>(`input[type='checkbox']`);
    const bounds = row.getBoundingClientRect();
    setMenu({
      domain,
      domains,
      x: point?.x ?? bounds.left,
      y: point?.y ?? bounds.bottom,
    });
  };

  const open = (event: MouseEvent<HTMLTableRowElement>, domain: DomainRecord, domains: DomainRecord[]) => {
    event.preventDefault();
    event.stopPropagation();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    openForRow(event.currentTarget, domain, domains, keyboard ? undefined : { x: event.clientX, y: event.clientY });
  };

  const activate = (action: DomainContextMenuAction) => {
    if (!menu) return;
    close(true);
    onAction?.(action, menu.domains);
  };

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!menu || !element) return;
    const { width, height } = element.getBoundingClientRect();
    element.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - height - 8))}px`;
    element.querySelector<HTMLButtonElement>(`[role='menuitem']`)?.focus({ preventScroll: true });
  }, [menu]);

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
    if (![ `End`, `Home`, `ArrowUp`, `ArrowDown` ].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>(`[role='menuitem']`) ?? []);
    if (!items.length) return;
    const index = items.findIndex(item => item === document.activeElement);
    const next = event.key === `Home` ? 0 : event.key === `End` ? items.length - 1
      : (index + (event.key === `ArrowDown` ? 1 : -1) + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
  };

  return { menu, open, close, menuRef, activate, onKeyDown, openFromKeyboard: openForRow };
};
