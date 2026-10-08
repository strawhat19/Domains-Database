import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DomainRecord } from '../../shared/types';
import { getCsvFile } from '../../shared/csvFiles.web';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getDomainSource, getDomainStatus, getRegistrarCounts } from '../../shared/domainUtils';
import { parseDomainCsv, exportDomainCsv } from '../../shared/csv';
import { sortPortfolioDomains } from '../../shared/portfolioPreferences/groups';
import { PORTFOLIO_COLUMNS, getPortfolioColumnValue, type PortfolioColumn } from '../../shared/portfolioColumns';

export type SortField = PortfolioColumn;

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
  const [sortField, setSortField] = useState<SortField | null>(`name`);
  const [sortDirection, setSortDirection] = useState<`asc` | `desc`>(`asc`);
  const [registrarFilter, setRegistrarFilter] = useState(`All Registrars`);
  const [setupOpen, setSetupOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingId, setPendingId] = useState(``);
  const importingRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sortedDomains = useMemo(() => sortPortfolioDomains(data.domains, sortField ?? `name`, sortField ? sortDirection : `asc`), [data.domains, sortField, sortDirection]);
  const registrarDomains = useMemo(() => sortedDomains.filter(domain => (
    registrarFilter === `All Registrars` || domain.registrar === registrarFilter
  )), [sortedDomains, registrarFilter]);
  const filteredDomains = useMemo(() => {
    const search = query.trim().toLowerCase();
    return registrarDomains.filter(domain => [
      domain.name,
      domain.title,
      domain.description,
      domain.projectStatus,
      ...PORTFOLIO_COLUMNS.map(column => getPortfolioColumnValue(domain, column.field)),
    ].join(` `).toLowerCase().includes(search));
  }, [query, registrarDomains]);
  const summary = useMemo(() => ({
    count: data.domains.length,
    registrarCounts: getRegistrarCounts(data.domains),
    knownCostCount: data.domains.filter(domain => typeof getPortfolioColumnValue(domain, `renewalPrice`) === `number`).length,
    annualCost: data.domains.reduce((total, domain) => total + domain.renewalPrice, 0),
    attention: data.domains.filter(domain => getDomainStatus(domain) !== `Active`).length,
    hasSampleData: data.domains.some(domain => domain.isSample),
  }), [data.domains]);
  const changeSort = (field: SortField) => {
    if (sortField === field && sortDirection === `desc`) {
      setSortField(null);
      return;
    }
    setSortDirection(sortField === field && sortDirection === `asc` ? `desc` : `asc`);
    setSortField(field);
  };
  const toggleManualOrder = () => {
    setSortField(sortField ? null : `name`);
    setSortDirection(`asc`);
  };
  const openEditor = (domain?: DomainRecord) => {
    setEditingDomain(domain ?? null);
    setEditorOpen(true);
  };
  const openSetup = () => {
    setQuery(``);
    setLocalError(``);
    setRegistrarFilter(`All Registrars`);
    setSetupOpen(true);
  };
  const closeSetup = () => setSetupOpen(false);
  const requestImport = () => {
    importInputRef.current?.click();
  };
  const clearError = () => setLocalError(``);
  const importFiles = async (files: File[]) => {
    if (importingRef.current || data.loading) return;
    setLocalError(``);
    data.clearNotice();
    try {
      const file = getCsvFile(files);
      importingRef.current = true;
      setImporting(true);
      const inputs = parseDomainCsv(await file.text());
      await data.importDomains(inputs);
      setQuery(``);
      setRegistrarFilter(`All Registrars`);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Import CSV`);
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  };
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ``;
    if (files.length) await importFiles(files);
  };
  const exportDomains = async () => {
    if (exporting) return;
    setExporting(true);
    setLocalError(``);
    try {
      const domains = await data.prepareExport();
      downloadCsv(exportDomainCsv(domains), `domains-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Export CSV`);
    } finally {
      setExporting(false);
    }
  };
  const downloadTemplate = () => downloadCsv(exportDomainCsv([]), `domains-template.csv`);
  const toggleAutoRenew = async (domain: DomainRecord) => {
    if (pendingId || getDomainSource(domain) === `registrar`) return;
    setPendingId(domain.id);
    setLocalError(``);
    try {
      await data.updateDomain(domain.id, { ...domain, autoRenew: !domain.autoRenew });
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Update Domain`);
    } finally {
      setPendingId(``);
    }
  };
  const changeProjectStatus = async (domain: DomainRecord, projectStatus: DomainRecord[`projectStatus`]) => {
    if (pendingId || projectStatus === domain.projectStatus) return;
    setPendingId(domain.id);
    setLocalError(``);
    try {
      await data.updateDomain(domain.id, { ...domain, projectStatus });
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Update Domain`);
    } finally {
      setPendingId(``);
    }
  };
  const changeDescription = async (domain: DomainRecord, description: string): Promise<boolean> => {
    const nextDescription = description.trim();
    if (nextDescription === (domain.description ?? ``)) return true;
    if (pendingId) return false;
    setPendingId(domain.id);
    setLocalError(``);
    try {
      await data.updateDomain(domain.id, { ...domain, description: nextDescription });
      return true;
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : `Unable To Update Domain`);
      return false;
    } finally {
      setPendingId(``);
    }
  };
  return {
    ...data, query, summary, pendingId, sortField, importing, openEditor, changeSort, setQuery, localError,
    clearError, editorOpen, sortDirection, exportDomains, exporting, importFiles, handleImport, editingDomain, registrarFilter,
    importInputRef, requestImport, downloadTemplate, filteredDomains, sortedDomains, registrarDomains,
    setupOpen, openSetup, closeSetup, setEditorOpen, changeDescription, setRegistrarFilter, toggleAutoRenew, toggleManualOrder, changeProjectStatus,
  };
};
