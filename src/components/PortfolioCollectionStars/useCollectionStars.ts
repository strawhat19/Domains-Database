import { useEffect, useMemo, useRef, useState } from 'react';
import { copyText } from '../../shared/common/clipboard.web';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { PortfolioCopyFormat } from '../DomainPortfolio/copyFormats';
import type { CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { buildCollectionStars, buildCollectionStarsCopyText } from '../../shared/portfolioPreferences/stars';

export const useCollectionStars = (collection: CustomPortfolioCollection, busy = false) => {
  const domains = useDomains();
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [starring, setStarring] = useState(false);
  const [starError, setStarError] = useState(``);
  const [copyMessage, setCopyMessage] = useState(``);
  const [includeHidden, setIncludeHiddenValue] = useState(true);
  const mounted = useRef(true);
  const pendingCopy = useRef(false);
  const pendingStar = useRef(false);
  const focusFrame = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copyState, setCopyState] = useState<`idle` | `copying` | `copied` | `error`>(`idle`);
  const loading = busy || starring || domains.loading || preferences.loading;
  const summary = useMemo(() => buildCollectionStars(collection.id, preferences.customGroups, domains.domains, collection.domainIds ?? []),
    [collection.id, collection.domainIds, preferences.customGroups, domains.domains]);
  const showHiddenOptions = preferences.showHiddenCollections || preferences.showHiddenGroups || preferences.showHiddenDomains;
  const copySummary = useMemo(() => {
    if (!showHiddenOptions || includeHidden) return summary;
    if (preferences.hiddenCollectionIds.includes(collection.id)) return buildCollectionStars(collection.id, [], []);
    const hiddenGroups = new Set(preferences.hiddenGroupKeys);
    const hiddenDomains = new Set(preferences.hiddenDomainIds);
    const groupedIds = new Set(preferences.customGroups.flatMap(group => group.domainIds));
    const groups = preferences.customGroups.filter(group => !hiddenGroups.has(`custom:${group.id}`));
    const records = domains.domains.filter(domain => !hiddenDomains.has(domain.id));
    const directIds = (collection.domainIds ?? []).filter(id => !groupedIds.has(id));
    return buildCollectionStars(collection.id, groups, records, directIds);
  }, [summary, includeHidden, showHiddenOptions, collection.id, collection.domainIds, domains.domains, preferences.customGroups,
    preferences.hiddenGroupKeys, preferences.hiddenDomainIds, preferences.hiddenCollectionIds]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    };
  }, []);

  useEffect(() => {
    if (copyState !== `copied`) return;
    const timeout = window.setTimeout(() => {
      setCopyMessage(``);
      setCopyState(`idle`);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const openStars = async () => {
    if (loading || pendingCopy.current || pendingStar.current) return;
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    setStarError(``);
    setCopyMessage(``);
    setCopyState(`idle`);
    setCopyOpen(false);
    if (summary.count) {
      setOpen(true);
      return;
    }
    const groups = preferences.customGroups.filter(group => group.collectionId === collection.id);
    const groupedIds = new Set(preferences.customGroups.flatMap(group => group.domainIds));
    const selectedIds = new Set([
      ...groups.flatMap(group => group.domainIds),
      ...(collection.domainIds ?? []).filter(id => !groupedIds.has(id)),
    ]);
    const domainIds = domains.domains.filter(domain => selectedIds.has(domain.id)).map(domain => domain.id);
    if (!groups.length && !domainIds.length) return;
    pendingStar.current = true;
    setStarring(true);
    try {
      if (domainIds.length) await domains.starDomains(domainIds);
      if (groups.length && !preferences.starGroups(groups.map(group => group.id))) throw new Error(`Could Not Star Collection Items — Try Again`);
    } catch (reason) {
      if (mounted.current) setStarError(reason instanceof Error ? reason.message : `Could Not Star Collection Items — Try Again`);
    } finally {
      pendingStar.current = false;
      if (mounted.current) setStarring(false);
    }
  };
  const closeStars = () => {
    if (pendingCopy.current) return;
    setCopyOpen(false);
    setOpen(false);
    focusFrame.current = window.requestAnimationFrame(() => {
      const button = buttonRef.current;
      const fallbackId = button?.dataset.focusFallback;
      const controls = [
        button,
        fallbackId ? document.getElementById(fallbackId) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control?.isConnected && !control.matches(`:disabled`)
        && !control.closest(`[hidden], [inert], [aria-hidden='true']`))?.focus({ preventScroll: true });
      focusFrame.current = null;
    });
  };
  const openCopyOptions = () => {
    if (loading || !summary.count || pendingCopy.current) return;
    setCopyMessage(``);
    setCopyState(`idle`);
    setIncludeHiddenValue(true);
    setCopyOpen(true);
  };
  const setIncludeHidden = (included: boolean) => {
    if (pendingCopy.current) return;
    setIncludeHiddenValue(included);
    setCopyMessage(``);
    setCopyState(`idle`);
  };
  const closeCopyOptions = () => {
    if (!pendingCopy.current) setCopyOpen(false);
  };
  const copyStars = async (format: PortfolioCopyFormat) => {
    if (!open || !copyOpen || loading || !copySummary.count || pendingCopy.current) return;
    const text = buildCollectionStarsCopyText(collection, copySummary, format);
    if (!text) return;
    pendingCopy.current = true;
    setCopyMessage(``);
    setCopyState(`copying`);
    try {
      await copyText(text, `portfolio-collection-${collection.id}-stars-copy-buffer`);
      if (!mounted.current) return;
      setCopyMessage(`Copied ${copySummary.count} Starred Item(s)`);
      setCopyState(`copied`);
      setCopyOpen(false);
    } catch {
      if (!mounted.current) return;
      setCopyMessage(`Could Not Copy Stars — Try Again`);
      setCopyState(`error`);
    } finally {
      pendingCopy.current = false;
    }
  };

  return {
    open,
    summary,
    loading,
    starring,
    copyOpen,
    starError,
    buttonRef,
    openStars,
    copyStars,
    closeStars,
    copyMessage,
    copySummary,
    includeHidden,
    openCopyOptions,
    closeCopyOptions,
    setIncludeHidden,
    showHiddenOptions,
    dismissStarError: () => setStarError(``),
    copied: copyState === `copied`,
    copying: copyState === `copying`,
    copyError: copyState === `error`,
  };
};
