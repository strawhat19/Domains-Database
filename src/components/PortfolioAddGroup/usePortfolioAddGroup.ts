import { useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { normalizePortfolioName, isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';
import { getPortfolioSuggestions, getRecentPortfolioItems } from '../../shared/portfolioPreferences/recent';

export interface PortfolioAddGroupProps {
  idPrefix: string;
  disabled?: boolean;
  collectionId?: string | null;
}

export const usePortfolioAddGroup = ({ disabled = false, collectionId = null }: PortfolioAddGroupProps) => {
  const preferences = usePortfolioPreferences();
  const [name, setNameValue] = useState(``);
  const [error, setError] = useState(``);
  const inputRef = useRef<HTMLInputElement>(null);
  const collection = preferences.collections.find(collection => collection.id === collectionId);
  const unavailable = disabled || preferences.loading || Boolean(collectionId && !collection);
  const destinationName = collectionId ? collection?.name ?? `Collection` : `Database`;
  const candidates = useMemo(() => {
    if (!collectionId || unavailable) return [];
    const hiddenKeys = new Set(preferences.hiddenGroupKeys);
    return preferences.customGroups.filter(group => !group.collectionId && (preferences.showHiddenGroups || !hiddenKeys.has(`custom:${group.id}`)));
  }, [collectionId, unavailable, preferences.customGroups, preferences.hiddenGroupKeys, preferences.showHiddenGroups]);
  const randomizedSuggestions = useMemo(() => getPortfolioSuggestions(candidates), [candidates]);
  const suggestions = useMemo(() => {
    const search = normalizePortfolioName(name);
    return search ? getRecentPortfolioItems(candidates.filter(group => normalizePortfolioName(group.name).includes(search)), 4) : randomizedSuggestions;
  }, [name, candidates, randomizedSuggestions]);

  const setName = (value: string) => {
    setError(``);
    setNameValue(value);
  };
  const clearDraft = () => {
    setNameValue(``);
    setError(``);
    inputRef.current?.focus({ preventScroll: true });
  };
  const showError = (message: string) => {
    setError(message);
    inputRef.current?.focus({ preventScroll: true });
  };
  const addSuggestedGroup = (id: string) => {
    if (!collectionId || !preferences.collections.some(collection => collection.id === collectionId)) {
      setError(`This Collection Is No Longer Available`);
      return false;
    }
    if (unavailable) return false;
    const source = preferences.customGroups.find(group => group.id === id);
    if (!source || (!preferences.showHiddenGroups && preferences.hiddenGroupKeys.includes(`custom:${id}`))) {
      setError(`This Group Is No Longer Available`);
      return false;
    }
    if (source.collectionId) {
      setError(`This Group Is No Longer In Database`);
      return false;
    }
    if (!preferences.assignGroupCollection(source.id, collectionId)) {
      setError(`Could Not Add Group To Collection`);
      return false;
    }
    clearDraft();
    return true;
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== `Escape`) return;
    event.preventDefault();
    event.stopPropagation();
    clearDraft();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (collectionId && !preferences.collections.some(collection => collection.id === collectionId)) {
      showError(`This Collection Is No Longer Available`);
      return;
    }
    if (unavailable) return;
    const trimmedName = name.trim();
    if (!trimmedName) { showError(`Enter A Group Name`); return; }
    if (trimmedName.length > 80) { showError(`Group Name Must Be 80 Characters Or Fewer`); return; }
    if (normalizePortfolioName(trimmedName) === `ungrouped`) { showError(`Ungrouped Is A Reserved Group Name`); return; }
    const existing = candidates.find(group => normalizePortfolioName(group.name) === normalizePortfolioName(trimmedName));
    if (existing) { addSuggestedGroup(existing.id); return; }
    if (isPortfolioNameTaken(preferences, trimmedName)) { showError(`A Collection Or Group With This Name Already Exists`); return; }
    const groupId = preferences.createGroup(trimmedName);
    if (!groupId) {
      showError(`Could Not Add Group`);
      return;
    }
    if (collectionId && !preferences.assignGroupCollection(groupId, collectionId)) {
      preferences.deleteGroup(groupId);
      setError(`Could Not Add Group To Collection`);
      return;
    }
    clearDraft();
  };

  return { name, error, setName, inputRef, suggestions, unavailable, handleSubmit, handleKeyDown, destinationName, addSuggestedGroup };
};
