import { useRef, useState } from 'react';
import { parseDomainCsv } from '../../shared/csv';
import type { DomainInput } from '../../shared/types';
import type { SetupRegistrar } from '../../shared/registrars';
import { validateDomainInput } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';

export interface RegistrarDraft {
  id: string;
  name: string;
  notes: string;
  expiresAt: string;
  autoRenew: boolean;
  renewalPrice: string;
  details?: DomainInput;
}

const newDraft = (): RegistrarDraft => ({
  name: ``,
  notes: ``,
  expiresAt: ``,
  autoRenew: false,
  renewalPrice: ``,
  id: `registrar-draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
});

export const useRegistrarSetup = (onClose: () => void, csvOnly = false) => {
  const data = useDomains();
  const savingRef = useRef(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const [csvNotice, setCsvNotice] = useState(``);
  const [owner, setOwner] = useState(`My Portfolio`);
  const [review, setReview] = useState<DomainInput[]>([]);
  const [drafts, setDrafts] = useState<RegistrarDraft[]>(() => csvOnly ? [] : [newDraft()]);
  const [registrar, setRegistrar] = useState<SetupRegistrar | null>(null);

  const reportError = (message: string) => setError(message);
  const close = () => { if (!savingRef.current) onClose(); };
  const selectRegistrar = (value: SetupRegistrar) => {
    if (savingRef.current) return;
    if (csvOnly && value !== registrar) {
      setDrafts([]);
      setReview([]);
      setCsvNotice(``);
    }
    setRegistrar(value);
    setError(``);
    setStep(1);
  };
  const updateDraft = <Key extends Exclude<keyof RegistrarDraft, `id`>>(id: string, field: Key, value: RegistrarDraft[Key]) => {
    setError(``);
    setDrafts(current => current.map(draft => draft.id === id ? { ...draft, [field]: value } : draft));
  };
  const addDraft = () => {
    setError(``);
    setDrafts(current => [...current, newDraft()]);
  };
  const removeDraft = (id: string) => {
    setError(``);
    setDrafts(current => current.length > 1 ? current.filter(draft => draft.id !== id) : current);
  };
  const loadCsv = (text: string, filename: string) => {
    setError(``);
    if (csvOnly) {
      setDrafts([]);
      setReview([]);
      setCsvNotice(``);
    }
    if (!registrar) { setError(`Choose A Registrar First`); return; }
    try {
      const inputs = parseDomainCsv(text, { registrar, owner, allowMixedRegistrars: csvOnly });
      setDrafts(inputs.map(input => ({
        ...newDraft(),
        details: input,
        name: input.name,
        notes: input.notes,
        expiresAt: input.expiresAt,
        autoRenew: input.autoRenew,
        renewalPrice: String(input.renewalPrice),
      })));
      setCsvNotice(`${inputs.length} domain(s) loaded from ${filename}. Review the details before saving.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Read CSV`);
    }
  };
  const getInputs = () => {
    if (!registrar) throw new Error(`Choose A Registrar First`);
    if (!drafts.length) throw new Error(csvOnly ? `Upload A CSV Before Reviewing` : `Add At Least One Domain`);
    const names = new Set<string>();
    return drafts.map((draft, index) => {
      try {
        const input = validateDomainInput({
          ...draft.details,
          owner: csvOnly ? draft.details?.owner ?? owner : owner,
          registrar: csvOnly ? draft.details?.registrar ?? registrar : registrar,
          name: draft.name,
          notes: draft.notes,
          expiresAt: draft.expiresAt,
          autoRenew: draft.autoRenew,
          renewalPrice: Number(draft.renewalPrice || 0),
        });
        if (names.has(input.name)) throw new Error(`${input.name} Appears More Than Once In This Import`);
        names.add(input.name);
        return input;
      } catch (caught) {
        throw new Error(`Domain ${index + 1}: ${caught instanceof Error ? caught.message : `Invalid Domain`}`);
      }
    });
  };
  const canReview = !csvOnly || Boolean(drafts.length && csvNotice && !error);
  const next = () => {
    if (savingRef.current) return;
    setError(``);
    try {
      if (step === 0) {
        if (!registrar) throw new Error(`Choose A Registrar`);
        setStep(1);
      } else if (step === 1) {
        if (!canReview) throw new Error(`Upload A Valid CSV Before Reviewing`);
        setReview(getInputs());
        setStep(2);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Check Your Domain Details`);
    }
  };
  const back = () => {
    if (savingRef.current) return;
    setError(``);
    setStep(current => current === 2 ? 1 : 0);
  };
  const submit = async () => {
    if (savingRef.current || step !== 2) return;
    setError(``);
    savingRef.current = true;
    setSaving(true);
    try {
      await data.importDomains(getInputs());
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Save Domains`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return {
    step, owner, error, review, drafts, saving, registrar, csvNotice, canReview,
    next, back, close, submit, setOwner, loadCsv, addDraft, removeDraft,
    reportError, updateDraft, selectRegistrar,
  };
};
