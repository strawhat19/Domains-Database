import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';

export const useGroupControls = (domains: DomainRecord[]) => {
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(``);
  const [name, setName] = useState(``);
  const [error, setError] = useState(``);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open]);

  const membership = useMemo(() => new Map(preferences.customGroups.flatMap(group => (
    group.domainIds.map(id => [id, group.id] as const)
  ))), [preferences.customGroups]);

  const filteredDomains = useMemo(() => domains
    .filter(domain => domain.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: `base`, numeric: true })), [domains, query]);

  const createGroup = () => {
    if (!preferences.createGroup(name)) {
      setError(`Enter a unique group name.`);
      return;
    }
    setName(``);
    setError(``);
  };

  return {
    ...preferences,
    open,
    name,
    error,
    query,
    close,
    setName,
    setOpen,
    setQuery,
    rootRef,
    buttonRef,
    membership,
    createGroup,
    filteredDomains,
  };
};
