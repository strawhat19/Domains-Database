import { useRef, useState, useEffect } from 'react';

export const useDomainsMenu = (pathname: string) => {
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const expand = () => setOpen(true);
  const toggle = () => setOpen(value => !value);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const groupedViewport = window.matchMedia(`(min-width: 1001px) and (max-width: 1480px)`);
    const handleViewportChange = () => {
      setOpen(false);
      setGrouped(groupedViewport.matches);
    };
    handleViewportChange();
    groupedViewport.addEventListener(`change`, handleViewportChange);
    return () => groupedViewport.removeEventListener(`change`, handleViewportChange);
  }, []);
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
    };
    document.addEventListener(`keydown`, handleKeyDown);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleKeyDown);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open]);

  return { open, close, expand, toggle, grouped, rootRef, toggleRef };
};
