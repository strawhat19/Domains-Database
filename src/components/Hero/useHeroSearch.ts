import { useState } from 'react';
import { useRouter } from 'expo-router';
import { routes } from '../../shared/routes';
import { useRecentSearches } from '../../shared/domainSearch/useRecentSearches';

export const useHeroSearch = () => {
  const router = useRouter();
  const recent = useRecentSearches();
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
    recentSearches: recent.records,
    recentSearchesError: recent.error,
    recentSearchesLoading: recent.loading,
  };
};
