import { useEffect, useMemo, useRef, useState } from 'react';
import { copyText } from '../../shared/common/clipboard.web';
import type { PortfolioSections } from '../../shared/portfolioPreferences/types';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { buildPortfolioCopyText, excludeHiddenPortfolioSections, type PortfolioCopyFormat } from '../DomainPortfolio/copyFormats';

export interface PortfolioRowCopyProps {
  id: string;
  label: string;
  disabled?: boolean;
  iconSize?: number;
  treeAvailable?: boolean;
  focusFallbackId?: string;
  sections: PortfolioSections;
}

const getSectionDomainIds = (sections: PortfolioSections) => [...new Set([
  ...sections.mainGroups.flatMap(group => group.domains.map(domain => domain.id)),
  ...sections.collections.flatMap(section => section.groups.flatMap(group => group.domains.map(domain => domain.id))),
])];

export const usePortfolioRowCopy = ({ id, label, sections, disabled = false, treeAvailable = true, focusFallbackId }: PortfolioRowCopyProps) => {
  const preferences = usePortfolioPreferences();
  const [open, setOpen] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(true);
  const [copyMessage, setCopyMessage] = useState(``);
  const mounted = useRef(true);
  const pendingCopy = useRef(false);
  const focusFrame = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copyState, setCopyState] = useState<`idle` | `copying` | `copied` | `error`>(`idle`);
  const showHiddenOptions = preferences.showHiddenGroups || preferences.showHiddenDomains || preferences.showHiddenCollections;
  const originalCount = useMemo(() => getSectionDomainIds(sections).length, [sections]);
  const copySections = useMemo(() => includeHidden || !showHiddenOptions ? sections : excludeHiddenPortfolioSections(sections, preferences),
    [sections, preferences, includeHidden, showHiddenOptions]);
  const domainIds = useMemo(() => getSectionDomainIds(copySections), [copySections]);
  const count = domainIds.length;
  const unavailable = disabled || !originalCount;

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

  const restoreFocus = () => {
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    focusFrame.current = window.requestAnimationFrame(() => {
      const controls = [
        buttonRef.current,
        document.getElementById(id),
        focusFallbackId ? document.getElementById(focusFallbackId) : null,
        document.getElementById(`portfolio-groups-button`),
      ];
      controls.find(control => control?.isConnected && !control.matches(`:disabled`)
        && !control.closest(`[hidden], [inert], [aria-hidden='true']`)
        && control.getClientRects().length)?.focus({ preventScroll: true });
      focusFrame.current = null;
    });
  };

  const openCopyOptions = () => {
    if (unavailable || pendingCopy.current) return;
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    setIncludeHidden(true);
    setCopyMessage(``);
    setCopyState(`idle`);
    setOpen(true);
  };

  const closeCopyOptions = () => {
    if (pendingCopy.current) return;
    setOpen(false);
    setCopyMessage(``);
    setCopyState(`idle`);
    restoreFocus();
  };

  const changeIncludeHidden = (included: boolean) => {
    if (pendingCopy.current) return;
    setIncludeHidden(included);
    setCopyMessage(``);
    setCopyState(`idle`);
  };

  const copyDomains = async (format: PortfolioCopyFormat) => {
    if (!open || unavailable || !count || pendingCopy.current || (format !== `list` && !treeAvailable)) return;
    const text = buildPortfolioCopyText(copySections, domainIds, true, format);
    if (!text) return;
    pendingCopy.current = true;
    setCopyMessage(``);
    setCopyState(`copying`);
    try {
      await copyText(text, `${id}-buffer`);
      if (!mounted.current) return;
      setCopyMessage(`Copied ${count} Domain(s) From ${label}`);
      setCopyState(`copied`);
      setOpen(false);
      restoreFocus();
    } catch {
      if (!mounted.current) return;
      setCopyMessage(`Could Not Copy Domains — Try Again`);
      setCopyState(`error`);
    } finally {
      pendingCopy.current = false;
    }
  };

  return {
    open,
    count,
    buttonRef,
    unavailable,
    copyDomains,
    copyMessage,
    includeHidden,
    openCopyOptions,
    showHiddenOptions,
    closeCopyOptions,
    changeIncludeHidden,
    copied: copyState === `copied`,
    copying: copyState === `copying`,
    copyError: copyState === `error`,
  };
};
