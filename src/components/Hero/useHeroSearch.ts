import { useState } from 'react';
import { useRouter } from 'expo-router';
import { routes } from '../../shared/routes';

export const useHeroSearch = () => {
  const router = useRouter();
  const [query, setQuery] = useState(``);
  const submit = () => {
    const name = query.trim();
    if (name) router.push({ pathname: routes.search.href, params: { q: name } });
  };

  return { query, submit, setQuery };
};
