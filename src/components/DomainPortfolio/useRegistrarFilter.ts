import { useEffect, useRef, useState } from 'react';

export const useRegistrarFilter = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus({ preventScroll: true });
    };
    selectRef.current?.focus({ preventScroll: true });
    document.addEventListener(`focusin`, handleOutside);
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`pointerdown`, handleOutside);
    return () => {
      document.removeEventListener(`focusin`, handleOutside);
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`pointerdown`, handleOutside);
    };
  }, [open]);

  return { open, close, setOpen, rootRef, selectRef, buttonRef };
};
