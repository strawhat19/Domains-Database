import { useRef, useState, useEffect, useCallback } from 'react';

export const useMobileNavigation = (pathname: string) => {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && navigationRef.current?.contains(focused)) {
      toggleRef.current?.focus({ preventScroll: true });
      if (document.activeElement === focused) focused.blur();
    }
    setOpen(false);
  }, []);
  const toggle = () => { if (open) close(); else setOpen(true); };

  useEffect(() => { if (compact) close(); }, [pathname, compact, close]);
  useEffect(() => {
    const mobileViewport = window.matchMedia(`(max-width: 1000px)`);
    const handleViewportChange = () => {
      if (mobileViewport.matches) close();
      setCompact(mobileViewport.matches);
      if (!mobileViewport.matches) setOpen(false);
    };
    handleViewportChange();
    mobileViewport.addEventListener(`change`, handleViewportChange);
    return () => mobileViewport.removeEventListener(`change`, handleViewportChange);
  }, [close]);
  useEffect(() => {
    if (!open) return;
    navigationRef.current?.querySelector<HTMLAnchorElement>(`a`)?.focus({ preventScroll: true });
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== `Escape` || event.defaultPrevented) return;
      close();
    };
    document.addEventListener(`keydown`, handleKeyDown);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open, close]);

  return { open, close, toggle, compact, headerRef, toggleRef, navigationRef };
};
