import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

export interface ProjectSelectOption {
  value: string;
  label: string;
}

interface ProjectSelectInput {
  value?: string;
  allowUnset?: boolean;
  options: readonly ProjectSelectOption[];
  onChange: (value: string | undefined) => void;
}

export const useProjectSelect = ({ value, options, onChange, allowUnset = true }: ProjectSelectInput) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value) + Number(allowUnset));
  const count = options.length + Number(allowUnset);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  const toggle = () => {
    setActiveIndex(selectedIndex);
    setOpen(current => !current);
  };
  const choose = (nextValue: string | undefined) => {
    onChange(nextValue);
    close();
  };

  useEffect(() => {
    if (open) optionRefs.current?.[activeIndex]?.focus();
  }, [open, activeIndex]);
  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener(`mousedown`, handleOutside);
    return () => document.removeEventListener(`mousedown`, handleOutside);
  }, [open]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === `Tab` && open) {
      triggerRef.current?.focus();
      setOpen(false);
      return;
    }
    if (event.key === `Escape` && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === `ArrowDown` || event.key === `ArrowUp`) {
      event.preventDefault();
      event.stopPropagation();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else setActiveIndex(current => (current + (event.key === `ArrowDown` ? 1 : -1) + count) % count);
    } else if (open && (event.key === `Home` || event.key === `End`)) {
      event.preventDefault();
      setActiveIndex(event.key === `Home` ? 0 : count - 1);
    }
  };

  return { open, close, toggle, choose, onBlur, rootRef, onKeyDown, activeIndex, optionRefs, triggerRef };
};
