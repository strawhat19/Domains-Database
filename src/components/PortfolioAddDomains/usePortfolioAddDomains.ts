import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { useDomains } from '../../shared/domainContext/useDomains';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { getPortfolioSuggestions, getRecentPortfolioItems } from '../../shared/portfolioPreferences/recent';
import type { CustomPortfolioGroup, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

interface PortfolioAddDomainsInput {
  idPrefix: string;
  disabled?: boolean;
  onGrouped?: () => void;
  focusFallbackId?: string;
}
export type PortfolioAddDomainsProps = PortfolioAddDomainsInput & (
  { group: CustomPortfolioGroup; collection?: never } | { collection: CustomPortfolioCollection; group?: never }
);

export const usePortfolioAddDomains = ({ group, collection, idPrefix, onGrouped, focusFallbackId, disabled = false }: PortfolioAddDomainsProps) => {
  const portfolio = useDomains();
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [query, setQueryValue] = useState(``);
  const [error, setError] = useState(``);
  const [inlineQuery, setInlineQueryValue] = useState(``);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const quickAddPending = useRef(false);
  const currentGroup = group ? preferences.customGroups.find(current => current.id === group.id) : undefined;
  const currentCollection = collection ? preferences.collections.find(current => current.id === collection.id) : undefined;
  const currentTarget = collection ? currentCollection : currentGroup;
  const destinationName = currentTarget?.name ?? collection?.name ?? group?.name ?? `Destination`;
  const isApp = !collection && (currentGroup?.isApp ?? group?.isApp ?? false);
  const targetKind = collection ? `collection` : isApp ? `app` : `group`;
  const loading = portfolio.loading || preferences.loading || !portfolio.loaded;
  const unavailable = disabled || loading || !currentTarget;
  const availabilityError = !currentTarget && !preferences.loading ? `This ${collection ? `Collection` : `Group`} Is No Longer Available`
    : loading ? `Portfolio Is Loading — Try Again Shortly` : disabled ? `Portfolio Is Busy — Try Again Shortly` : ``;
  const assignedDomainIds = useMemo(() => new Set([
    ...preferences.customGroups.flatMap(current => current.domainIds),
    ...preferences.collections.flatMap(current => current.domainIds ?? []),
  ]), [preferences.collections, preferences.customGroups]);
  const ungroupedDomains = useMemo(() => {
    const domains = new Map(portfolio.domains.map(domain => [domain.id, domain]));
    return [...domains.values()].filter(domain => !assignedDomainIds.has(domain.id))
      .sort((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: `base` }));
  }, [portfolio.domains, assignedDomainIds]);
  const quickCandidates = useMemo(() => ungroupedDomains
    .filter(domain => preferences.showHiddenDomains || !preferences.hiddenDomainIds.includes(domain.id)),
  [ungroupedDomains, preferences.hiddenDomainIds, preferences.showHiddenDomains]);
  const candidateIds = useMemo(() => new Set(quickCandidates.map(domain => domain.id)), [quickCandidates]);
  const randomizedSuggestions = useMemo(() => getPortfolioSuggestions(quickCandidates), [quickCandidates]);
  const quickSuggestions = useMemo(() => {
    const search = inlineQuery.trim().toLowerCase();
    return search ? getRecentPortfolioItems(quickCandidates.filter(domain => domain.name.toLowerCase().includes(search)), 4) : randomizedSuggestions;
  }, [inlineQuery, quickCandidates, randomizedSuggestions]);
  const matchingDomains = useMemo(() => {
    const search = query.trim().toLowerCase();
    return quickCandidates.filter(domain => domain.name.toLowerCase().includes(search));
  }, [query, quickCandidates]);

  const assignToTarget = (ids: string[]) => collection
    ? Boolean(currentCollection && preferences.assignDomainsToCollection(ids, currentCollection.id))
    : Boolean(currentGroup && preferences.assignDomains(ids, currentGroup.id));

  const closePicker = () => {
    setOpen(false);
    setError(``);
    setQueryValue(``);
    setSelectedIds(new Set());
  };

  useModalFocus(modalRef, open, closePicker, true);

  useEffect(() => {
    if (!open) return;
    const trigger = buttonRef.current;
    const triggerId = trigger?.id ?? `${idPrefix}-add-domains-button`;
    return () => {
      const controls = [
        trigger,
        document.getElementById(triggerId),
        focusFallbackId ? document.getElementById(focusFallbackId) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control?.isConnected && !control.matches(`:disabled`)
        && !control.closest(`[aria-hidden='true'], [hidden], [inert]`))?.focus({ preventScroll: true });
    };
  }, [open, idPrefix, focusFallbackId]);

  const setQuery = (value: string) => {
    setError(``);
    setQueryValue(value);
  };
  const setInlineQuery = (value: string) => {
    setError(``);
    setInlineQueryValue(value);
  };
  const openPicker = () => {
    if (unavailable) return;
    setError(``);
    setQueryValue(``);
    setSelectedIds(new Set());
    setOpen(true);
  };
  const toggleDomain = (id: string) => {
    if (unavailable) return;
    if (!selectedIds.has(id) && !candidateIds.has(id)) {
      setError(`This Domain Is No Longer Available In Database`);
      return;
    }
    setError(``);
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const addQuickDomain = (id: string) => {
    if (open || quickAddPending.current) return false;
    setError(``);
    if (unavailable || !currentTarget) { setError(availabilityError || `Could Not Add Domain`); return false; }
    if (!portfolio.domains.some(domain => domain.id === id)) { setError(`This Domain Is No Longer Available`); return false; }
    if (assignedDomainIds.has(id)) { setError(`This Domain Already Belongs To A Group Or Collection`); return false; }
    if (!preferences.showHiddenDomains && preferences.hiddenDomainIds.includes(id)) { setError(`This Domain Is Hidden — Show Hidden Domains To Add It`); return false; }
    quickAddPending.current = true;
    if (!assignToTarget([id])) {
      quickAddPending.current = false;
      setError(`Could Not Add Domain — Try Again Shortly`);
      return false;
    }
    setInlineQueryValue(``);
    onGrouped?.();
    requestAnimationFrame(() => {
      quickAddPending.current = false;
      const controls = [
        collection ? inlineInputRef.current : null,
        focusFallbackId ? document.getElementById(focusFallbackId) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control?.isConnected && !control.matches(`:disabled`)
        && !control.closest(`[aria-hidden='true'], [hidden], [inert]`))?.focus({ preventScroll: true });
    });
    return true;
  };
  const handleInlineKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== `Enter` && event.key !== `Escape`) return;
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === `Escape`) { setInlineQuery(``); return; }
    if (unavailable || open || quickAddPending.current) return;
    const name = inlineQuery.trim().toLowerCase();
    if (!name) return;
    const domain = quickCandidates.find(candidate => candidate.name.trim().toLowerCase() === name);
    if (!domain) { setError(`No Matching Database Domain — Choose A Suggestion`); return; }
    addQuickDomain(domain.id);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!open) return;
    if (unavailable || !currentTarget) { setError(availabilityError || `Could Not Add Domain(s)`); return; }
    const domainIds = [...selectedIds];
    if (!domainIds.length) { setError(`Choose At Least One Domain`); return; }
    const availableIds = new Set(portfolio.domains.map(domain => domain.id));
    if (domainIds.some(id => !availableIds.has(id))) {
      setError(`Some Selected Domains Are No Longer Available — Reopen To Select Again`);
      return;
    }
    if (domainIds.some(id => assignedDomainIds.has(id))) {
      setError(`Some Selected Domains Already Belong To A Group Or Collection — Reopen To Select Again`);
      return;
    }
    if (!preferences.showHiddenDomains && domainIds.some(id => preferences.hiddenDomainIds.includes(id))) {
      setError(`Some Selected Domains Are Hidden — Reopen To Select Again`);
      return;
    }
    if (!assignToTarget(domainIds)) { setError(`Could Not Add Domain(s) — Try Again Shortly`); return; }
    closePicker();
    onGrouped?.();
  };

  return {
    open,
    isApp,
    query,
    loading,
    setQuery,
    inlineQuery,
    inputRef,
    targetKind,
    buttonRef,
    modalRef,
    openPicker,
    closePicker,
    currentGroup,
    currentTarget,
    unavailable,
    selectedIds,
    toggleDomain,
    handleSubmit,
    addQuickDomain,
    inlineInputRef,
    setInlineQuery,
    quickSuggestions,
    destinationName,
    handleInlineKeyDown,
    quickError: open ? `` : error,
    error: error || availabilityError,
    selectedCount: selectedIds.size,
    matchingCount: matchingDomains.length,
    suggestions: matchingDomains.slice(0, 20),
    isCollection: Boolean(collection),
    ungroupedCount: quickCandidates.length,
  };
};
