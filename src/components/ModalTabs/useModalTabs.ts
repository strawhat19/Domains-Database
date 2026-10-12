import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { ModalTabsProps } from './types';

export const useModalTabs = <Tab extends string,>({ value, options, onChange, disabled }: ModalTabsProps<Tab>) => {
  const buttons = useRef(new Map<Tab, HTMLButtonElement>());

  const setButton = (id: Tab, button: HTMLButtonElement | null) => {
    if (button) buttons.current.set(id, button);
    else buttons.current.delete(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: Tab) => {
    if (event.key === `Enter` || event.key === ` `) event.stopPropagation();
    if (disabled || !options.length || ![`ArrowLeft`, `ArrowRight`, `Home`, `End`].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const currentIndex = Math.max(0, options.findIndex(option => option.id === currentTab));
    const nextIndex = event.key === `Home` ? 0 : event.key === `End` ? options.length - 1
      : (currentIndex + (event.key === `ArrowRight` ? 1 : -1) + options.length) % options.length;
    const nextTab = options?.[nextIndex]?.id;
    if (nextTab === undefined) return;
    if (value !== nextTab) onChange(nextTab);
    buttons.current.get(nextTab)?.focus();
  };

  return { setButton, onKeyDown };
};
