import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { buildPortfolioGroups } from '../../shared/portfolioPreferences/groups';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { normalizePortfolioName, isPortfolioNameTaken } from '../../shared/portfolioPreferences/names';

export const useGroupControls = (domains: DomainRecord[]) => {
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(``);
  const [name, setName] = useState(``);
  const [error, setError] = useState(``);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const positionPanel = () => {
      const panel = panelRef.current;
      const toolbar = rootRef.current?.closest<HTMLElement>(`.portfolio-toolbar`);
      if (!panel || !toolbar) return;
      const bounds = toolbar.getBoundingClientRect();
      const headerBottom = document.getElementById(`site-header`)?.getBoundingClientRect().bottom ?? 0;
      const headingBottom = toolbar.closest(`.domain-portfolio`)?.querySelector<HTMLElement>(`.portfolio-heading-row`)?.getBoundingClientRect().bottom ?? 0;
      const above = bounds.top - Math.max(0, headerBottom, headingBottom) - 24;
      const below = window.innerHeight - bounds.bottom - 24;
      const opensAbove = below < 240 && above > below;
      panel.dataset.placement = opensAbove ? `top` : `bottom`;
      panel.style.maxHeight = `${Math.max(0, Math.min(520, opensAbove ? above : below))}px`;
    };
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleFocusOutside = (event: FocusEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== `Escape`) return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus({ preventScroll: true });
    };
    positionPanel();
    panelRef.current?.querySelector<HTMLSelectElement>(`select`)?.focus({ preventScroll: true });
    window.addEventListener(`resize`, positionPanel);
    window.addEventListener(`scroll`, positionPanel, { passive: true });
    document.addEventListener(`focusin`, handleFocusOutside);
    document.addEventListener(`keydown`, handleEscape);
    document.addEventListener(`pointerdown`, handleOutsideClick);
    return () => {
      window.removeEventListener(`resize`, positionPanel);
      window.removeEventListener(`scroll`, positionPanel);
      document.removeEventListener(`focusin`, handleFocusOutside);
      document.removeEventListener(`keydown`, handleEscape);
      document.removeEventListener(`pointerdown`, handleOutsideClick);
    };
  }, [open]);

  const groupCount = useMemo(() => preferences.groupBy === `none` ? 0
    : preferences.groupBy === `custom` ? preferences.customGroups.length
    : buildPortfolioGroups(domains, preferences).length, [domains, preferences]);

  const membership = useMemo(() => new Map(preferences.customGroups.flatMap(group => (
    group.domainIds.map(id => [id, group.id] as const)
  ))), [preferences.customGroups]);

  const filteredDomains = useMemo(() => domains
    .filter(domain => domain.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: `base`, numeric: true })), [domains, query]);

  const createGroup = () => {
    if (preferences.loading) { setError(`Portfolio Is Loading — Try Again Shortly`); return; }
    const trimmedName = name.trim();
    if (!trimmedName) { setError(`Enter A Group Name`); return; }
    if (trimmedName.length > 80) { setError(`Group Name Must Be 80 Characters Or Fewer`); return; }
    if (normalizePortfolioName(trimmedName) === `ungrouped`) { setError(`Ungrouped Is A Reserved Group Name`); return; }
    if (isPortfolioNameTaken(preferences, trimmedName)) { setError(`A Collection Or Group With This Name Already Exists`); return; }
    if (!preferences.createGroup(trimmedName)) {
      setError(`Could Not Add Group`);
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
    panelRef,
    buttonRef,
    groupCount,
    membership,
    createGroup,
    filteredDomains,
  };
};
