import { useMemo, useState } from 'react';
import type { PortfolioFilterField } from './filters';
import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';
import { getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { getDomainFilterValues, buildPortfolioFilterSections, buildPortfolioFilterLocations } from './filters';
import type { CustomPortfolioGroup, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';

export type { PortfolioFilterField } from './filters';

interface PortfolioSummaryFilterOptions {
  starredDomainIds?: readonly string[];
  customGroups?: CustomPortfolioGroup[];
  collections?: CustomPortfolioCollection[];
}

const EMPTY_GROUPS: CustomPortfolioGroup[] = [];
const EMPTY_COLLECTIONS: CustomPortfolioCollection[] = [];

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

export const usePortfolioSummaryFilters = (domains: DomainRecord[], loading: boolean, options: PortfolioSummaryFilterOptions = {}) => {
  const customGroups = options.customGroups ?? EMPTY_GROUPS;
  const collections = options.collections ?? EMPTY_COLLECTIONS;
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [groupFilters, setGroupFilters] = useState<string[]>([]);
  const [registrarFilters, setRegistrarFilters] = useState<string[]>([]);
  const [extensionFilters, setExtensionFilters] = useState<string[]>([]);
  const [collectionFilters, setCollectionFilters] = useState<string[]>([]);
  const [facetFilters, setFacetFilters] = useState<Partial<Record<PortfolioFilterField, string[]>>>({});
  const starredIds = useMemo(() => options.starredDomainIds ? new Set(options.starredDomainIds) : undefined, [options.starredDomainIds]);
  const locations = useMemo(() => buildPortfolioFilterLocations(domains, customGroups, collections), [domains, customGroups, collections]);
  const filterSections = useMemo(() => buildPortfolioFilterSections(domains, starredIds), [domains, starredIds]);
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
    const selectedLocations = new Set([
      ...groupFilters.flatMap(id => [...(locations.groupDomains.get(id) ?? [])]),
      ...collectionFilters.flatMap(id => [...(locations.collectionDomains.get(id) ?? [])]),
    ]);
    const activeFacets = Object.entries(facetFilters) as [PortfolioFilterField, string[]][];
    return domains.filter(domain => (
      (!registrars.size || registrars.has(normalizeRegistrar(domain.registrar ?? ``)))
      && (!extensions.size || extensions.has(getDomainExtension(domain)))
      && (!attentionOnly || getDomainStatus(domain) !== `Active`)
      && ((!groupFilters.length && !collectionFilters.length) || selectedLocations.has(domain.id))
      && activeFacets.every(([field, values]) => !values.length || getDomainFilterValues(domain, field, starredIds).some(value => values.includes(value)))
    ));
  }, [domains, locations, starredIds, facetFilters, groupFilters, attentionOnly, registrarFilters, extensionFilters, collectionFilters]);
  const clearLocationFilters = () => {
    setGroupFilters([]);
    setCollectionFilters([]);
  };
  const clearSummaryFilters = () => {
    setFacetFilters({});
    setAttentionOnly(false);
    setRegistrarFilters([]);
    setExtensionFilters([]);
    clearLocationFilters();
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
  const toggleCollectionFilter = (value: string) => {
    if (loading) return;
    setCollectionFilters(current => current.includes(value) || locations.collectionDomains.has(value) ? toggleValue(current, value) : current);
  };
  const toggleGroupFilter = (value: string) => {
    if (loading) return;
    setGroupFilters(current => current.includes(value) || locations.groupDomains.has(value) ? toggleValue(current, value) : current);
  };
  const toggleFacetFilter = (field: PortfolioFilterField, value: string) => {
    if (loading) return;
    setFacetFilters(current => {
      if (!current[field]?.includes(value) && !filterSections.find(section => section.id === field)?.options.some(option => option.value === value)) return current;
      const next = { ...current };
      const values = toggleValue(current[field] ?? [], value);
      if (values.length) next[field] = values;
      else delete next[field];
      return next;
    });
  };

  return {
    attentionOnly,
    facetFilters,
    groupFilters,
    filterSections,
    extensionCounts,
    registrarFilters,
    extensionFilters,
    collectionFilters,
    toggleFacetFilter,
    toggleGroupFilter,
    setRegistrarFilter,
    clearLocationFilters,
    clearSummaryFilters,
    toggleRegistrarFilter,
    toggleExtensionFilter,
    toggleAttentionFilter,
    toggleCollectionFilter,
    domains: filteredDomains,
    destinationBranches: locations.branches,
    activeFilterCount: registrarFilters.length + extensionFilters.length + groupFilters.length + collectionFilters.length + Object.values(facetFilters).reduce((count, values) => count + (values?.length ?? 0), 0) + Number(attentionOnly),
    registrarFilter: !registrarFilters.length ? `All Registrars` : registrarFilters.length === 1 ? registrarFilters[0] ?? `All Registrars` : `Multiple Registrars`,
  };
};
