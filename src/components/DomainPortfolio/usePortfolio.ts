import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DomainRecord } from '../../shared/types';
import { useModalFocus } from '../DomainEditor/useDomainEditor';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getDomainStatus } from '../../shared/domainUtils';
import { parseDomainCsv, exportDomainCsv } from '../../shared/csv';

export type SortField = `name` | `registrar` | `expiresAt` | `autoRenew` | `renewalPrice`;

const downloadCsv = (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: `text/csv;charset=utf-8;` }));
  const link = document.createElement(`a`);
  link.id = `portfolio-csv-download`;
  link.className = `portfolio-csv-download`;
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const usePortfolio = () => {
  const data = useDomains();
  const [query, setQuery] = useState(``);
  const [localError, setLocalError] = useState(``);
  const [sortField, setSortField] = useState<SortField>(`expiresAt`);
  const [sortDirection, setSortDirection] = useState<`asc` | `desc`>(`asc`);
  const [registrarFilter, setRegistrarFilter] = useState(`All Registrars`);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingId, setPendingId] = useState(``);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const closeDelete = () => { if (!pendingId) setDeletingDomain(null); };
  useModalFocus(deleteModalRef, Boolean(deletingDomain), closeDelete);
  const filteredDomains = useMemo(() => {
    const search = query.trim().toLowerCase();
    return data.domains.filter(domain => {
      const matchesRegistrar = registrarFilter === `All Registrars` || domain.registrar === registrarFilter;
      const matchesSearch = `${domain.name} ${domain.owner} ${domain.registrar} ${domain.notes}`.toLowerCase().includes(search);
      return matchesRegistrar && matchesSearch;
    }).sort((first, second) => {
      const firstValue = first[sortField];
      const secondValue = second[sortField];
      const comparison = typeof firstValue === `string` && typeof secondValue === `string`
        ? firstValue.localeCompare(secondValue)
        : Number(firstValue) - Number(secondValue);
      return sortDirection === `asc` ? comparison : -comparison;
    });
  }, [data.domains, query, registrarFilter, sortField, sortDirection]);
  const summary = useMemo(() => ({
    count: data.domains.length,
    annualCost: data.domains.reduce((total, domain) => total + domain.renewalPrice, 0),
    attention: data.domains.filter(domain => getDomainStatus(domain.expiresAt) !== `Active`).length,
    hasSampleData: data.domains.some(domain => domain.isSample),
  }), [data.domains]);
  const changeSort = (field: SortField) => {
    setSortDirection(sortField === field && sortDirection === `asc` ? `desc` : `asc`);
    setSortField(field);
  };
  const openEditor = (domain?: DomainRecord) => {
    setEditingDomain(domain ?? null);
    setEditorOpen(true);
  };
  const requestImport = () => {
    setConnectionsOpen(false);
    importInputRef.current?.click();
  };
  const requestDelete = (domain: DomainRecord) => {
    setLocalError(``);
    setDeletingDomain(domain);
  };
  const clearError = () => setLocalError(``);
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ``;
    if (!file || importing) return;
    setImporting(true);
    setLocalError(``);
    data.clearNotice();
    try {
      const inputs = parseDomainCsv(await file.text());
      await data.importDomains(inputs);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Import CSV`);
    } finally {
      setImporting(false);
    }
  };
  const exportDomains = () => downloadCsv(exportDomainCsv(data.domains), `domains-${new Date().toISOString().slice(0, 10)}.csv`);
  const downloadTemplate = () => downloadCsv(exportDomainCsv([]), `domains-template.csv`);
  const toggleAutoRenew = async (domain: DomainRecord) => {
    if (pendingId) return;
    setPendingId(domain.id);
    setLocalError(``);
    try {
      const { name, owner, notes, registrar, expiresAt, renewalPrice } = domain;
      await data.updateDomain(domain.id, { name, owner, notes, registrar, expiresAt, renewalPrice, autoRenew: !domain.autoRenew });
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Update Domain`);
    } finally {
      setPendingId(``);
    }
  };
  const confirmDelete = async () => {
    if (!deletingDomain || pendingId) return;
    setPendingId(deletingDomain.id);
    setLocalError(``);
    try {
      await data.deleteDomain(deletingDomain.id);
      setDeletingDomain(null);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Remove Domain`);
    } finally {
      setPendingId(``);
    }
  };
  return {
    ...data, query, summary, pendingId, sortField, importing, openEditor, changeSort, setQuery, localError,
    clearError, editorOpen, sortDirection, exportDomains, handleImport, editingDomain, registrarFilter,
    closeDelete, requestDelete, deletingDomain, deleteModalRef, importInputRef, requestImport, confirmDelete, downloadTemplate, filteredDomains,
    setEditorOpen, setDeletingDomain, setRegistrarFilter, toggleAutoRenew, connectionsOpen, setConnectionsOpen,
  };
};
