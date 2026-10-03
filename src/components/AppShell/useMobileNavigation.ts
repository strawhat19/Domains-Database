import { useRef, useState, useEffect } from 'react';

export const useMobileNavigation = (pathname: string) => {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const toggle = () => setOpen(value => !value);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mobileViewport = window.matchMedia(`(max-width: 1200px)`);
    const handleViewportChange = () => {
      setCompact(mobileViewport.matches);
      if (!mobileViewport.matches) setOpen(false);
    };
    handleViewportChange();
    mobileViewport.addEventListener(`change`, handleViewportChange);
    return () => mobileViewport.removeEventListener(`change`, handleViewportChange);
  }, []);
  useEffect(() => {
    if (!open) return;
    navigationRef.current?.querySelector<HTMLAnchorElement>(`a`)?.focus({ preventScroll: true });
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener(`keydown`, handleKeyDown);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open]);

  return { open, close, toggle, compact, headerRef, toggleRef, navigationRef };
};
