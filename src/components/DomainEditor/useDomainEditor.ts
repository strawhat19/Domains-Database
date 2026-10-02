import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { REGISTRARS } from '../../shared/config';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { DomainInput, DomainRecord } from '../../shared/types';

export const useModalFocus = (container: RefObject<HTMLDivElement | null>, open: boolean, onClose: () => void) => {
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = `hidden`;
    const getFocusableElements = () => Array.from(container.current?.querySelectorAll<HTMLElement>(
      `button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]`,
    ) ?? []).filter(element => element.offsetParent !== null);
    const frame = window.requestAnimationFrame(() => {
      const initialFocus = container.current?.querySelector<HTMLElement>(`[data-autofocus]`);
      (initialFocus ?? getFocusableElements()?.[0] ?? container.current)?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === `Escape`) {
        event.preventDefault();
        closeHandler.current();
      }
      if (event.key !== `Tab`) return;
      const focusable = getFocusableElements();
      const last = focusable?.[focusable.length - 1];
      const first = focusable?.[0];
      if (!first) {
        event.preventDefault();
        container.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !container.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener(`keydown`, handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(`keydown`, handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [container, open]);
};

const getInitialInput = (domain?: DomainRecord | null): DomainInput => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAt = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, `0`)}-${String(nextYear.getDate()).padStart(2, `0`)}`;
  return {
    name: domain?.name ?? ``,
    notes: domain?.notes ?? ``,
    owner: domain?.owner ?? ``,
    autoRenew: domain?.autoRenew ?? true,
    renewalPrice: domain?.renewalPrice ?? 0,
    expiresAt: domain?.expiresAt?.slice(0, 10) ?? expiresAt,
    registrar: domain?.registrar ?? REGISTRARS?.[0] ?? `Namecheap`,
  };
};

export const useDomainEditor = (domain: DomainRecord | null | undefined, onClose: () => void) => {
  const { addDomain, updateDomain } = useDomains();
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<DomainInput>(() => getInitialInput(domain));
  const close = () => { if (!saving) onClose(); };
  useModalFocus(modalRef, true, close);
  const setField = <Key extends keyof DomainInput>(field: Key, value: DomainInput[Key]) => {
    setError(``);
    setInput(previous => ({ ...previous, [field]: value }));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError(``);
    setSaving(true);
    const domainInput = { ...input, name: input.name.trim().toLowerCase(), owner: input.owner.trim(), notes: input.notes.trim() };
    try {
      if (domain?.id) await updateDomain(domain.id, domainInput);
      else await addDomain(domainInput);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Save Domain`);
    } finally {
      setSaving(false);
    }
  };
  return { error, input, close, saving, setField, modalRef, handleSubmit };
};
