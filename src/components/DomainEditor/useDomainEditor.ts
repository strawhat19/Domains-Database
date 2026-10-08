import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { REGISTRARS } from '../../shared/config';
import { getDomainSource, getDomainDeletionRestriction } from '../../shared/domainUtils';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { DomainInput, DomainRecord } from '../../shared/types';
import { markDomainFieldsKnown } from '../../shared/registrarSync/metadata';
import { useDomainGroupEditor } from '../../shared/portfolioPreferences/useDomainGroupEditor';

export const useModalFocus = (
  container: RefObject<HTMLDivElement | null>,
  open: boolean,
  onClose: () => void,
  preventRestoreScroll = false,
) => {
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
      if (previousFocus?.isConnected) {
        const unavailable = previousFocus.matches(`:disabled`) || previousFocus.closest(`[aria-hidden='true']`);
        const fallbackId = unavailable ? previousFocus.dataset.focusFallback : undefined;
        const fallback = fallbackId ? document.getElementById(fallbackId) : null;
        if (fallback?.isConnected && !fallback.matches(`:disabled`) && !fallback.closest(`[aria-hidden='true'], [hidden], [inert]`)) {
          fallback.focus({ preventScroll: true });
        } else previousFocus.focus({ preventScroll: preventRestoreScroll });
      }
    };
  }, [container, open, preventRestoreScroll]);
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
    parentLink: domain?.parentLink ?? ``,
    childLinks: [...(domain?.childLinks ?? [])],
    previewLinks: [...(domain?.previewLinks ?? [])],
    relatedLinks: [...(domain?.relatedLinks ?? [])],
    githubRepoLink: domain?.githubRepoLink ?? ``,
    productionLink: domain?.productionLink ?? ``,
    socialMediaLinks: [...(domain?.socialMediaLinks ?? [])],
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
  const { addDomain, deleteDomain, updateDomain } = useDomains();
  const groupEditor = useDomainGroupEditor(domain?.id);
  const isSynced = domain && getDomainSource(domain) === `registrar`;
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const pendingActionRef = useRef(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const [input, setInput] = useState<DomainInput>(() => getInitialInput(domain));
  const close = () => { if (!pendingActionRef.current) onClose(); };
  useModalFocus(modalRef, true, close);

  useEffect(() => {
    if (confirmingDelete) deleteCancelRef.current?.focus();
  }, [confirmingDelete]);

  const requestDelete = () => {
    if (!domain?.id || pendingActionRef.current || getDomainDeletionRestriction(domain)) return;
    setError(``);
    setConfirmingDelete(true);
  };
  const cancelDelete = () => {
    if (pendingActionRef.current) return;
    setError(``);
    setConfirmingDelete(false);
    deleteButtonRef.current?.focus();
  };
  const handleDelete = async () => {
    if (!domain?.id || !confirmingDelete || pendingActionRef.current) return;
    const restriction = getDomainDeletionRestriction(domain);
    if (restriction) {
      setError(restriction);
      setConfirmingDelete(false);
      return;
    }
    pendingActionRef.current = true;
    setError(``);
    setDeleting(true);
    try {
      await deleteDomain(domain.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Delete Domain`);
    } finally {
      pendingActionRef.current = false;
      setDeleting(false);
    }
  };
  const setField = <Key extends keyof DomainInput>(field: Key, value: DomainInput[Key]) => {
    if (pendingActionRef.current) return;
    if (isSynced && ![`meta`, `mvp`, `future`, `childLinks`, `parentLink`, `difficulty`, `description`, `previewLinks`, `relatedLinks`, `projectStatus`, `githubRepoLink`, `productionLink`, `socialMediaLinks`].includes(field)) return;
    setError(``);
    setInput(previous => markDomainFieldsKnown({ ...previous, [field]: value }, field === `autoRenew` || field === `renewalPrice` ? [field] : []));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmingDelete || pendingActionRef.current) return;
    pendingActionRef.current = true;
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
      pendingActionRef.current = false;
      setSaving(false);
    }
  };
  return {
    error,
    input,
    close,
    deleting,
    setField,
    modalRef,
    groupEditor,
    handleDelete,
    cancelDelete,
    requestDelete,
    handleSubmit,
    deleteButtonRef,
    deleteCancelRef,
    confirmingDelete,
    saving: saving || deleting,
  };
};
