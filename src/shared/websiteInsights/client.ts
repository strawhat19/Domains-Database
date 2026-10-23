import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import type { WebsiteInsights } from './types';
import { normalizeWebsiteInsights } from './values';
import { getFeatureAuthorization } from '../planAccess/service';

export const getWebsiteInsights = async (domain: string, signal: AbortSignal): Promise<WebsiteInsights> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 100_000);
  try {
    const authorization = await getFeatureAuthorization(true);
    const response = await fetch(Platform.OS === `web` ? `/api/website-insights` : absoluteSiteUrl(`/api/website-insights`), {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      body: JSON.stringify({ domain }),
      headers: { ...authorization, 'Content-Type': `application/json` },
    });
    const value: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const record = value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
      throw new Error(typeof record?.error === `string` && record.error.length <= 300 ? record.error : `Website Insights Are Unavailable`);
    }
    return normalizeWebsiteInsights(value, domain);
  } catch (failure) {
    if (controller.signal.aborted) throw new Error(signal.aborted ? `Website Insights Cancelled` : `Website Insights Timed Out`);
    if (failure instanceof TypeError) throw new Error(`Could Not Reach Website Insights`);
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};
