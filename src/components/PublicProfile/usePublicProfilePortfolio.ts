import { api } from '../../api';
import { useFocusEffect } from 'expo-router';
import { useLocalStorage } from '../../shared/config';
import { useCallback, useRef, useState } from 'react';
import { marketplaceAPI } from '../../api/marketplace';
import type { PublicProfilePortfolio } from '../../shared/publicDirectory/profilePortfolio';

type PortfolioResult = { id: string; data: PublicProfilePortfolio | null; error: boolean };

export const usePublicProfilePortfolio = (id?: string) => {
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [revision, setRevision] = useState(0);
  const currentId = useRef(id);
  currentId.current = id;

  useFocusEffect(useCallback(() => {
    setResult(null);
    if (!id) return;
    const controller = new AbortController();
    const load = useLocalStorage ? api.getLocalPublicProfilePortfolio(id) : marketplaceAPI.getPublicProfilePortfolio(id, controller.signal);
    void load.then(data => {
      if (!controller.signal.aborted && currentId.current === id) setResult({ id, data, error: false });
    }, () => {
      if (!controller.signal.aborted && currentId.current === id) setResult({ id, data: null, error: true });
    });
    return () => controller.abort();
  }, [id, revision]));

  const current = result?.id === id ? result : null;
  return { data: current?.data, error: current?.error, loading: Boolean(id && !current), retry: () => setRevision(value => value + 1) };
};
