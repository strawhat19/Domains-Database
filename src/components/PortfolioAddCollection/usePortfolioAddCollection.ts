import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export interface PortfolioAddCollectionProps {
  idPrefix: string;
  disabled?: boolean;
}

export const usePortfolioAddCollection = ({ disabled = false }: PortfolioAddCollectionProps) => {
  const preferences = usePortfolioPreferences();
  const [name, setNameValue] = useState(``);
  const [error, setError] = useState(``);
  const inputRef = useRef<HTMLInputElement>(null);
  const unavailable = disabled || preferences.loading;

  const setName = (value: string) => {
    setError(``);
    setNameValue(value);
  };
  const clearDraft = () => {
    setNameValue(``);
    setError(``);
  };
  const showError = (message: string) => {
    setError(message);
    inputRef.current?.focus({ preventScroll: true });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== `Escape`) return;
    event.preventDefault();
    event.stopPropagation();
    clearDraft();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailable) return;
    const trimmedName = name.trim();
    if (!trimmedName) { showError(`Enter A Collection Name`); return; }
    if (trimmedName.length > 80) { showError(`Collection Name Must Be 80 Characters Or Fewer`); return; }
    if (isPortfolioNameTaken(preferences, trimmedName)) {
      showError(`A Collection Or Group With This Name Already Exists`);
      return;
    }
    if (!preferences.createCollection(trimmedName)) { showError(`Could Not Add Collection`); return; }
    clearDraft();
    inputRef.current?.focus({ preventScroll: true });
  };

  return { name, error, setName, inputRef, unavailable, handleSubmit, handleKeyDown };
};
