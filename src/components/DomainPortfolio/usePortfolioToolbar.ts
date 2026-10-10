import { useEffect, useRef, useState } from 'react';
import { copyText } from '../../shared/common/clipboard.web';
import { usePortfolioActionsVisibility } from './usePortfolioActionsVisibility';

export const usePortfolioToolbar = () => {
  const actions = usePortfolioActionsVisibility();
  const [copyOpen, setCopyOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState(``);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [includeHidden, setIncludeHidden] = useState(true);
  const pendingCopy = useRef(false);
  const [copyState, setCopyState] = useState<`idle` | `copying` | `copied` | `error`>(`idle`);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (copyState !== `copied`) return;
    const timeout = window.setTimeout(() => {
      setCopyMessage(``);
      setCopyState(`idle`);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const openSettings = () => {
    setColumnsOpen(false);
    setSettingsOpen(true);
  };
  const openCopyOptions = () => {
    if (pendingCopy.current) {
      setCopyOpen(true);
      if (typeof document !== `undefined`) document.getElementById(`portfolio-copy-options-dialog`)?.focus({ preventScroll: true });
      return;
    }
    setCopyMessage(``);
    setCopyState(`idle`);
    setIncludeHidden(true);
    setCopyOpen(true);
  };
  const closeCopyOptions = () => {
    if (!pendingCopy.current) setCopyOpen(false);
  };
  const changeIncludeHidden = (included: boolean) => {
    if (pendingCopy.current) return;
    setIncludeHidden(included);
    setCopyMessage(``);
    setCopyState(`idle`);
  };
  const copyDomains = async (text: string, count: number) => {
    if (!text || pendingCopy.current) return;
    pendingCopy.current = true;
    setCopyMessage(``);
    setCopyState(`copying`);
    try {
      await copyText(text);
      setCopyMessage(count ? `Copied ${count} Domain(s)` : `Copied Portfolio Structure`);
      setCopyState(`copied`);
      setCopyOpen(false);
    } catch {
      setCopyMessage(`Could Not Copy Domains — Try Again`);
      setCopyState(`error`);
    } finally {
      pendingCopy.current = false;
    }
  };

  return {
    ...actions,
    copyOpen,
    columnsOpen,
    copyDomains,
    copyMessage,
    includeHidden,
    settingsOpen,
    openSettings,
    setColumnsOpen,
    openCopyOptions,
    setSettingsOpen,
    closeCopyOptions,
    changeIncludeHidden,
    settingsButtonRef,
    copied: copyState === `copied`,
    copying: copyState === `copying`,
    copyError: copyState === `error`,
  };
};
