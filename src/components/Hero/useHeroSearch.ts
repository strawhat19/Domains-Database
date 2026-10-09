import { useState } from 'react';
import { useRouter } from 'expo-router';
import { routes } from '../../shared/routes';
import { useAfterPaint } from '../../shared/common/useAfterPaint';
import { useDomains } from '../../shared/domainContext/useDomains';
import { useDomainDiscovery } from '../../shared/domainSearch/useDomainDiscovery';
import { useRecentSearches } from '../../shared/domainSearch/useRecentSearches';

export const useHeroSearch = () => {
  const router = useRouter();
  const recent = useRecentSearches();
  const { domains, loading: domainsLoading } = useDomains();
  const discoveryReady = useAfterPaint(!domainsLoading);
  const discovery = useDomainDiscovery(!discoveryReady);
  const [query, setQuery] = useState(``);
  const searchDomain = (value: string) => {
    const name = value.trim();
    if (!name) return;
    setQuery(name);
    void recent.rememberSearch(name).catch(() => undefined);
    router.push({ pathname: routes.search.href, params: { q: name } });
  };
  const submit = () => searchDomain(query);

  return {
    query,
    submit,
    setQuery,
    searchDomain,
    domainCount: domainsLoading ? 0 : domains.length,
    trendingCount: discovery.results.length,
    recentSearches: recent.records,
    domainCountLoading: domainsLoading,
    recentSearchesError: recent.error,
    recentSearchesLoading: recent.loading,
    trendingCountLoading: !discoveryReady || discovery.accessLoading || discovery.loading,
  };
};
