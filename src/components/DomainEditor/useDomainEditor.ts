import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { REGISTRARS } from '../../shared/config';
import { getDomainSource } from '../../shared/domainUtils';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { DomainInput, DomainRecord } from '../../shared/types';
import { markDomainFieldsKnown } from '../../shared/registrarSync/metadata';
import { useDomainGroupEditor } from '../../shared/portfolioPreferences/useDomainGroupEditor';

export const useModalFocus = (container: RefObject<HTMLDivElement | null>, open: boolean, onClose: () => void) => {
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = `hidden`;
    const getFocusableElements = () => Array.from(container.current?.querySelectorAll<HTMLElement>(
      `button:not([disabled]):not([tabindex="-1"]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]`,
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
    meta: domain?.meta,
    name: domain?.name ?? ``,
    notes: domain?.notes ?? ``,
    owner: domain?.owner ?? ``,
    mvp: domain?.mvp ?? ``,
    future: domain?.future ?? ``,
    difficulty: domain?.difficulty,
    projectStatus: normalizeDomainProjectStatus(domain?.projectStatus),
    description: domain?.description ?? ``,
    autoRenew: domain?.autoRenew ?? true,
    renewalPrice: domain?.renewalPrice ?? 0,
    createdAt: domain?.createdAt,
    expiresAt: domain?.expiresAt ?? expiresAt,
    registrar: domain?.registrar ?? REGISTRARS?.[0] ?? `Namecheap`,
  };
};

export const useDomainEditor = (domain: DomainRecord | null | undefined, onClose: () => void) => {
  const { addDomain, updateDomain } = useDomains();
  const groupEditor = useDomainGroupEditor(domain?.id);
  const isSynced = domain && getDomainSource(domain) === `registrar`;
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<DomainInput>(() => getInitialInput(domain));
  const close = () => { if (!saving) onClose(); };
  useModalFocus(modalRef, true, close);
  const setField = <Key extends keyof DomainInput>(field: Key, value: DomainInput[Key]) => {
    if (isSynced && ![`meta`, `mvp`, `future`, `difficulty`, `description`, `projectStatus`].includes(field)) return;
    setError(``);
    setInput(previous => markDomainFieldsKnown({ ...previous, [field]: value }, field === `autoRenew` || field === `renewalPrice` ? [field] : []));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError(``);
    setSaving(true);
    const domainInput = {
      ...input,
      mvp: input.mvp?.trim() ?? ``,
      future: input.future?.trim() ?? ``,
      owner: input.owner.trim(),
      name: input.name.trim().toLowerCase(),
      description: input.description?.trim() ?? ``,
    };
    try {
      if (domain?.id) {
        groupEditor.validateGroup();
        await updateDomain(domain.id, domainInput);
        groupEditor.saveGroup(domain.id);
      } else await addDomain(domainInput);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Save Domain`);
    } finally {
      setSaving(false);
    }
  };
  return { error, input, close, saving, setField, modalRef, groupEditor, handleSubmit };
};
