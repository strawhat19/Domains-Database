import { useTagPicker } from './useTagPicker';
import type { TagPickerProps } from './types';
import { DOMAIN_TAGS } from '../../shared/domainTags';
import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

export const useWebTagPicker = (props: TagPickerProps) => {
  const picker = useTagPicker(props);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchRef = useRef({ text: ``, time: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.max(0, DOMAIN_TAGS.findIndex(tag => picker.tags.includes(tag)));
  const close = () => {
    picker.close();
    triggerRef.current?.focus({ preventScroll: true });
  };
  const toggle = () => {
    if (props.disabled) return;
    setActiveIndex(selectedIndex);
    picker.toggle();
  };

  useEffect(() => {
    if (!picker.open) return;
    const option = optionRefs.current?.[activeIndex];
    option?.focus({ preventScroll: true });
    option?.scrollIntoView({ block: `nearest` });
  }, [picker.open, activeIndex]);

  useEffect(() => {
    if (!picker.open) return;
    const handleOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) picker.setOpen(false);
    };
    document.addEventListener(`pointerdown`, handleOutside);
    return () => document.removeEventListener(`pointerdown`, handleOutside);
  }, [picker.open, picker.setOpen]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) picker.close();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.disabled || event.nativeEvent.isComposing) return;
    if (event.key === `Tab` && picker.open) {
      close();
      return;
    }
    if (event.key === `Escape` && picker.open) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === `ArrowDown` || event.key === `ArrowUp`) {
      event.preventDefault();
      event.stopPropagation();
      if (!picker.open) {
        setActiveIndex(selectedIndex);
        picker.setOpen(true);
      } else setActiveIndex(current => (current + (event.key === `ArrowDown` ? 1 : -1) + DOMAIN_TAGS.length) % DOMAIN_TAGS.length);
      return;
    }
    if (picker.open && (event.key === `Home` || event.key === `End`)) {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex(event.key === `Home` ? 0 : DOMAIN_TAGS.length - 1);
      return;
    }
    if (picker.open && event.key.length === 1 && event.key !== ` ` && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const time = Date.now();
      const character = event.key.toUpperCase();
      const previous = time - searchRef.current.time < 700 ? searchRef.current.text : ``;
      const search = previous === character ? character : `${previous}${character}`;
      searchRef.current = { text: search, time };
      const nextIndex = DOMAIN_TAGS.findIndex((_, offset) => {
        const index = (activeIndex + offset + 1) % DOMAIN_TAGS.length;
        return DOMAIN_TAGS[index]?.startsWith(search) ?? false;
      });
      if (nextIndex !== -1) setActiveIndex((activeIndex + nextIndex + 1) % DOMAIN_TAGS.length);
    }
  };

  return { ...picker, close, toggle, onBlur, rootRef, onKeyDown, activeIndex, optionRefs, triggerRef, setActiveIndex };
};
