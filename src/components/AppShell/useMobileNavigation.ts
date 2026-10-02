import { useRef, useState, useEffect } from 'react';

export const useMobileNavigation = (pathname: string) => {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const toggle = () => setOpen(value => !value);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    navigationRef.current?.querySelector<HTMLAnchorElement>(`a`)?.focus();
    const mobileViewport = window.matchMedia(`(max-width: 900px)`);
    const handleViewportChange = () => {
      if (!mobileViewport.matches) setOpen(false);
    };
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
    mobileViewport.addEventListener(`change`, handleViewportChange);
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
      mobileViewport.removeEventListener(`change`, handleViewportChange);
    };
  }, [open]);

  return { open, close, toggle, headerRef, toggleRef, navigationRef };
};
