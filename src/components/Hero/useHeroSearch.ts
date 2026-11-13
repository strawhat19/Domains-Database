import { useState } from 'react';
import { useRouter } from 'expo-router';
import { routes } from '../../shared/routes';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useDomains } from '../../shared/domainContext/useDomains';
import { useRecentSearches } from '../../shared/domainSearch/useRecentSearches';
import { useTrendingDomainCount } from '../../shared/domainSearch/useDomainDiscovery';

export const useHeroSearch = () => {
  const router = useRouter();
  const { ready: themeReady } = useTheme();
  const recent = useRecentSearches();
  const { domains, loading: domainsLoading } = useDomains();
  const trending = useTrendingDomainCount();
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
    trendingCount: trending.count,
    recentSearches: recent.records,
    domainCountLoading: themeReady && domainsLoading,
    recentSearchesError: recent.error,
    recentSearchesLoading: themeReady && recent.loading,
    trendingCountLoading: themeReady && trending.loading,
    loading: !themeReady,
  };
};
