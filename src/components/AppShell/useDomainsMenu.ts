import { useRef, useState, useEffect, useCallback } from 'react';

export const useDomainsMenu = (pathname: string) => {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && submenuRef.current?.contains(focused)) {
      toggleRef.current?.focus({ preventScroll: true });
      if (document.activeElement === focused) focused.blur();
    }
    setOpen(false);
  }, []);
  const expand = () => setOpen(true);
  const toggle = () => { if (open) close(); else expand(); };

  useEffect(() => close(), [pathname, close]);
  useEffect(() => {
    const groupedViewport = window.matchMedia(`(min-width: 1001px) and (max-width: 1480px)`);
    const handleViewportChange = () => {
      close();
      setGrouped(groupedViewport.matches);
    };
    handleViewportChange();
    groupedViewport.addEventListener(`change`, handleViewportChange);
    return () => groupedViewport.removeEventListener(`change`, handleViewportChange);
  }, [close]);
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== `Escape` || event.defaultPrevented) return;
      if (rootRef.current?.contains(document.activeElement)) event.preventDefault();
      close();
    };
    document.addEventListener(`keydown`, handleKeyDown, true);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown, true);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open, close]);

  return { open, close, expand, toggle, grouped, rootRef, toggleRef, submenuRef };
};
