import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export interface PortfolioAddGroupProps {
  idPrefix: string;
  disabled?: boolean;
  collectionId?: string | null;
}

export const usePortfolioAddGroup = ({ disabled = false, collectionId = null }: PortfolioAddGroupProps) => {
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [name, setNameValue] = useState(``);
  const [error, setError] = useState(``);
  const opened = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const unavailable = disabled || preferences.loading;

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
    else if (opened.current) buttonRef.current?.focus({ preventScroll: true });
    opened.current = open;
  }, [open]);

  const setName = (value: string) => {
    setError(``);
    setNameValue(value);
  };
  const close = () => {
    setOpen(false);
    setNameValue(``);
    setError(``);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== `Escape`) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailable) return;
    if (collectionId && !preferences.collections.some(collection => collection.id === collectionId)) {
      setError(`This Collection Is No Longer Available`);
      return;
    }
    const groupId = preferences.createGroup(name);
    if (!groupId) {
      setError(`Enter A Unique Group Name`);
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (collectionId && !preferences.assignGroupCollection(groupId, collectionId)) {
      preferences.deleteGroup(groupId);
      setError(`Could Not Add Group To Collection`);
      return;
    }
    close();
  };

  return { open, name, error, close, setName, setOpen, inputRef, buttonRef, unavailable, handleSubmit, handleKeyDown };
};
