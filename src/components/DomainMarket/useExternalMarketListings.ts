import { useEffect, useState } from 'react';
import { fetchExternalMarketListings } from '../../api/externalMarket';
import type { ExternalMarketResult } from '../../shared/marketplace/externalListings';

type DiscoveryResult = ExternalMarketResult | { status: `loading`; listings: []; message?: undefined };
const pending: DiscoveryResult = { status: `loading`, listings: [] };

export const useExternalMarketListings = (enabled: boolean, query: string, inAppDomains?: readonly string[]) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ query: string; attempt: number; data: ExternalMarketResult }>();
  const current = enabled && result?.query === query && result.attempt === attempt ? result.data : pending;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setResult({ query, attempt, data: { status: `unavailable`, listings: [], message: `Afternic Premium Search Timed Out` } });
    }, 18_000);
    void fetchExternalMarketListings(query, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ query, attempt, data });
    }, () => {
      if (!controller.signal.aborted) setResult({ query, attempt, data: { status: `unavailable`, listings: [] } });
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [attempt, enabled, query]);

  const inApp = new Set(inAppDomains?.map(domain => domain.toLowerCase()));
  const listings = current.listings.filter(listing => !inApp.has(listing.domain.toLowerCase()));
  return { ...current, listings, retry: () => setAttempt(previous => previous + 1) };
};
