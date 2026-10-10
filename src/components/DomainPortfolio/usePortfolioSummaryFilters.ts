import { useMemo, useState } from 'react';
import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';
import { getPortfolioColumnValue } from '../../shared/portfolioColumns';

const normalizeRegistrar = (value: string) => value.trim() || `Unknown Registrar`;
const normalizeExtension = (value: string) => {
  const extension = value.trim().toLowerCase().replace(/^\.+/, ``);
  return extension ? `.${extension}` : ``;
};
const getDomainExtension = (domain: DomainRecord) => {
  const value = getPortfolioColumnValue(domain, `tld`);
  return typeof value === `string` ? normalizeExtension(value) : ``;
};
const toggleValue = (values: string[], value: string) => values.includes(value)
  ? values.filter(current => current !== value) : [...values, value];

export const usePortfolioSummaryFilters = (domains: DomainRecord[], loading: boolean) => {
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [registrarFilters, setRegistrarFilters] = useState<string[]>([]);
  const [extensionFilters, setExtensionFilters] = useState<string[]>([]);
  const extensionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const domain of domains) {
      const extension = getDomainExtension(domain);
      if (extension) counts.set(extension, (counts.get(extension) ?? 0) + 1);
    }
    return Array.from(counts, ([extension, count]) => ({ extension, count }))
      .sort((first, second) => second.count - first.count || first.extension.localeCompare(second.extension));
  }, [domains]);
  const filteredDomains = useMemo(() => {
    const registrars = new Set(registrarFilters);
    const extensions = new Set(extensionFilters);
    return domains.filter(domain => (
      (!registrars.size || registrars.has(normalizeRegistrar(domain.registrar ?? ``)))
      && (!extensions.size || extensions.has(getDomainExtension(domain)))
      && (!attentionOnly || getDomainStatus(domain) !== `Active`)
    ));
  }, [domains, attentionOnly, registrarFilters, extensionFilters]);
  const clearSummaryFilters = () => {
    setAttentionOnly(false);
    setRegistrarFilters([]);
    setExtensionFilters([]);
  };
  const setRegistrarFilter = (value: string) => {
    if (loading) return;
    const registrar = normalizeRegistrar(value);
    if (registrar === `Multiple Registrars`) return;
    setRegistrarFilters(registrar === `All Registrars` ? [] : [registrar]);
  };
  const toggleRegistrarFilter = (value: string) => {
    if (loading) return;
    const registrar = normalizeRegistrar(value);
    if (registrar === `Multiple Registrars`) return;
    setRegistrarFilters(current => registrar === `All Registrars` ? [] : toggleValue(current, registrar));
  };
  const toggleExtensionFilter = (value: string) => {
    if (loading) return;
    const extension = normalizeExtension(value);
    if (extension) setExtensionFilters(current => toggleValue(current, extension));
  };
  const toggleAttentionFilter = () => {
    if (!loading) setAttentionOnly(current => !current);
  };

  return {
    attentionOnly,
    extensionCounts,
    registrarFilters,
    extensionFilters,
    setRegistrarFilter,
    clearSummaryFilters,
    toggleRegistrarFilter,
    toggleExtensionFilter,
    toggleAttentionFilter,
    domains: filteredDomains,
    activeFilterCount: registrarFilters.length + extensionFilters.length + Number(attentionOnly),
    registrarFilter: !registrarFilters.length ? `All Registrars` : registrarFilters.length === 1 ? registrarFilters[0] ?? `All Registrars` : `Multiple Registrars`,
  };
};
