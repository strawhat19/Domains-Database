import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../shared/seo';
import type { ExternalMarketResult } from '../shared/marketplace/externalListings';

const statuses = new Set([`ready`, `unconfigured`, `unavailable`, `rate-limited`]);

export const fetchExternalMarketListings = async (query: string, signal: AbortSignal): Promise<ExternalMarketResult> => {
  const path = `/api/marketplace/external?${new URLSearchParams({ query })}`;
  const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), { signal, credentials: `omit` });
  const result = await response.json().catch(() => null) as ExternalMarketResult | null;
  if (!result || !statuses.has(result.status) || !Array.isArray(result.listings)) throw new Error(`Afternic Premium Could Not Be Loaded`);
  return result;
};
