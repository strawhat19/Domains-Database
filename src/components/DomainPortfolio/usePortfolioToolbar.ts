import { useEffect, useRef, useState } from 'react';

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const buffer = document.createElement(`textarea`);
  buffer.value = text;
  buffer.tabIndex = -1;
  buffer.readOnly = true;
  buffer.id = `portfolio-copy-buffer`;
  buffer.className = `portfolio-copy-buffer`;
  buffer.setAttribute(`aria-hidden`, `true`);
  document.body.appendChild(buffer);
  try {
    buffer.select();
    if (!document.execCommand(`copy`)) throw new Error(`Copy Unavailable`);
  } finally {
    buffer.remove();
    focusedElement?.focus({ preventScroll: true });
  }
};

export const usePortfolioToolbar = () => {
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState(``);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const openCopyOptions = () => {
    if (copyState === `copying`) return;
    setCopyMessage(``);
    setCopyState(`idle`);
    setCopyOpen(true);
  };
  const closeCopyOptions = () => {
    if (copyState !== `copying`) setCopyOpen(false);
  };
  const copyDomains = async (text: string, count: number) => {
    if (!text || !count || copyState === `copying`) return;
    setCopyMessage(``);
    setCopyState(`copying`);
    try {
      await copyText(text);
      setCopyMessage(`Copied ${count} Domain(s)`);
      setCopyState(`copied`);
      setCopyOpen(false);
    } catch {
      setCopyMessage(`Could Not Copy Domains — Try Again`);
      setCopyState(`error`);
    }
  };

  return {
    copyOpen,
    copyDomains,
    copyMessage,
    settingsOpen,
    openCopyOptions,
    setSettingsOpen,
    closeCopyOptions,
    settingsButtonRef,
    copied: copyState === `copied`,
    copying: copyState === `copying`,
    copyError: copyState === `error`,
  };
};
