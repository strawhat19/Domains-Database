import { useRef, useState } from 'react';
import { saveCsvFile } from '../../shared/csvFiles';
import type { DomainInput } from '../../shared/types';
import { parseDomainCsv, exportDomainCsv } from '../../shared/csv';
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

export const useRegistrarSetup = (onClose: () => void) => {
  const data = useDomains();
  const savingRef = useRef(false);
  const exportingRef = useRef(false);
  const [error, setError] = useState(``);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [csvNotice, setCsvNotice] = useState(``);
  const [review, setReview] = useState<DomainInput[]>([]);
  const [entryTab, setEntryTab] = useState<`connect` | `csv`>(`connect`);
  const canReview = !data.loading && Boolean(review.length && !error);
  const reportError = (message: string) => setError(message);
  const close = () => { if (!savingRef.current && !exportingRef.current) onClose(); };

  const loadCsv = (text: string, filename: string) => {
    setError(``);
    setReview([]);
    setCsvNotice(``);
    try {
      const inputs = parseDomainCsv(text, { allowMixedRegistrars: true });
      const names = new Set<string>();
      inputs.forEach(input => {
        if (names.has(input.name)) throw new Error(`${input.name} Appears More Than Once In This Import`);
        names.add(input.name);
      });
      setReview(inputs);
      setCsvNotice(`${inputs.length} domain(s) loaded from ${filename}. Review the details before saving.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Read CSV`);
    }
  };
  const submit = async () => {
    if (savingRef.current || exportingRef.current || !canReview) return;
    savingRef.current = true;
    setSaving(true);
    setError(``);
    try {
      await data.importDomains(review);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Save Domains`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const exportCsv = async (template = false) => {
    if (exportingRef.current || savingRef.current || data.loading) return;
    exportingRef.current = true;
    setExporting(true);
    setError(``);
    try {
      const domains = template ? [] : await data.prepareExport();
      await saveCsvFile(exportDomainCsv(domains), template ? `domains-template.csv` : `domains-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable To Export CSV`);
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };
  const downloadTemplate = () => exportCsv(true);

  return {
    error, review, saving, entryTab, exporting, csvNotice, canReview,
    close, submit, loadCsv, exportCsv, setEntryTab, reportError, downloadTemplate,
    canExport: !data.loading && data.domains.length > 0,
  };
};
