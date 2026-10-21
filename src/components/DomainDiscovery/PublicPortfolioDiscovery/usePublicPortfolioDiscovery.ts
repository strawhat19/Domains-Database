import { useMemo, useState, useDeferredValue } from 'react';
import type { CommunityProfile } from '../../../shared/social/types';
import { filterSharedDomainDiscovery, getSharedDiscoveryFilters, getSharedDomainDiscovery, type PublicDiscoverySort } from '../../../shared/domainSearch/publicDiscovery';

const pageSize = 12;

export const usePublicPortfolioDiscovery = (profiles: CommunityProfile[]) => {
  const [query, setQuery] = useState(``);
  const [status, setStatus] = useState(`all`);
  const [extension, setExtension] = useState(`all`);
  const [limit, setLimit] = useState(pageSize);
  const [sort, setSort] = useState<PublicDiscoverySort>(`newest`);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => getSharedDomainDiscovery(profiles), [profiles]);
  const filters = useMemo(() => getSharedDiscoveryFilters(results), [results]);
  const filtered = useMemo(() => filterSharedDomainDiscovery(results, deferredQuery, extension, status, sort), [results, deferredQuery, extension, status, sort]);
  const changeQuery = (value: string) => { setQuery(value); setLimit(pageSize); };
  const changeStatus = (value: string) => { setStatus(value); setLimit(pageSize); };
  const changeExtension = (value: string) => { setExtension(value); setLimit(pageSize); };
  const changeSort = (value: PublicDiscoverySort) => { setSort(value); setLimit(pageSize); };
  const clearFilters = () => { setQuery(``); setStatus(`all`); setExtension(`all`); setLimit(pageSize); };

  return {
    sort,
    query,
    status,
    filters,
    results,
    extension,
    changeSort,
    changeQuery,
    clearFilters,
    changeStatus,
    changeExtension,
    total: filtered.length,
    visible: filtered.slice(0, limit),
    more: filtered.length > limit,
    filtered: !!query.trim() || status !== `all` || extension !== `all`,
    builderCount: new Set(results.map(result => result.profile.id)).size,
    showMore: () => setLimit(current => current + pageSize),
  };
};
