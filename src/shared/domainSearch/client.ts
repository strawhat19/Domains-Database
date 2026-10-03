import { authAPI } from '../../api/auth';
import { connectionsAPI } from '../../api/connections';
import { registrarPurchaseUrl } from './types';
import { normalizeDomainName } from '../domainUtils';
import { connectionFields } from '../connections/types';
import { popularExtensions, sortDomainExtensions, normalizeDomainSearchQuery } from './query';
import type { DomainSearchResult, DomainSearchResults, DomainSearchVariants } from './types';

const cancelled = () => new Error(`Domain Search Cancelled`);
const nextProviderSearch = new Map<string, number>();

const getSearchConnections = async (signal: AbortSignal, expectedUserId?: string, expectedUpdated?: string) => {
  if (signal.aborted) throw cancelled();
  const session = await authAPI.restoreSession();
  const userId = session?.user.id;
  if (!userId || (expectedUserId && expectedUserId !== userId)) throw new Error(`Sign In To Search Your Connected Registrars`);
  const snapshot = await connectionsAPI.getConnections(userId);
  if (signal.aborted) throw cancelled();
  if (expectedUpdated && expectedUpdated !== snapshot.updated) throw new Error(`Connections Changed — Search Again`);
  const fields = connectionFields.filter(field => field.search && snapshot.values[field.id]?.trim());
  if (!fields.length) throw new Error(`Connect A Registrar To Search Domains`);
  return { fields, userId, snapshot };
};

const checkSearchConnections = async (signal: AbortSignal, userId: string, updated: string) => {
  if (signal.aborted) throw cancelled();
  const session = await authAPI.restoreSession();
  if (signal.aborted || session?.user.id !== userId) throw cancelled();
  const latest = await connectionsAPI.getConnections(userId);
  if (signal.aborted) throw cancelled();
  if (latest.updated !== updated) throw new Error(`Connections Changed — Search Again`);
};

const requestRegistrarSearch = async (path: string, body: object, signal: AbortSignal) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 75_000);
  try {
    const response = await fetch(path, {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify(body),
    });
    const result: unknown = await response.json().catch(() => null);
    return { result, status: response.status, ok: response.ok };
  } catch (failure) {
    if (signal.aborted) throw cancelled();
    throw new Error(controller.signal.aborted ? `Registrar Search Timed Out`
      : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : `Could Not Reach Registrar Search`);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener(`abort`, abort);
  }
};

export const getConnectedDomainVariants = async (value: string, signal: AbortSignal, expectedUserId?: string): Promise<DomainSearchVariants> => {
  const query = normalizeDomainSearchQuery(value);
  const { fields, userId, snapshot } = await getSearchConnections(signal, expectedUserId);
  if (query.includes(`.`)) return { query, domains: [query], connectionsUpdated: snapshot.updated };
  const catalogs = await Promise.all(fields.map(async field => {
    try {
      const response = await requestRegistrarSearch(`/api/registrars/extensions`, { provider: field.id, values: snapshot.values[field.id] }, signal);
      const catalog = response.result as { extensions?: unknown; note?: unknown; error?: unknown } | null;
      if (!response.ok) throw new Error(typeof catalog?.error === `string` ? catalog.error : `Extension List Is Unavailable`);
      if (!Array.isArray(catalog?.extensions) || !catalog.extensions.length || catalog.extensions.length > 5000
        || !catalog.extensions.every(extension => typeof extension === `string` && extension.length < 190
          && extension.split(`.`).every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
          && !/^\d+$/.test(extension.split(`.`).at(-1) ?? ``))) throw new Error(`Registrar Returned Invalid Extensions`);
      return { extensions: catalog.extensions as string[], note: typeof catalog.note === `string` ? `${field.label}: ${catalog.note.slice(0, 1200)}` : `` };
    } catch (failure) {
      if (signal.aborted) throw cancelled();
      const message = failure instanceof Error ? failure.message : `Extension List Is Unavailable`;
      return { extensions: [], note: `${field.label}: ${message}` };
    }
  }));
  await checkSearchConnections(signal, userId, snapshot.updated);
  const catalogExtensions = catalogs.flatMap(catalog => catalog.extensions);
  const extensions = sortDomainExtensions(catalogExtensions.length ? catalogExtensions : popularExtensions);
  const notes = catalogs.map(catalog => catalog.note).filter(Boolean);
  if (!catalogExtensions.length) notes.unshift(`Extension Catalogs Are Unavailable — Showing Common Extensions; Search A Full Domain For Any Other Extension`);
  return {
    query,
    domains: extensions.map(extension => `${query}.${extension}`),
    connectionsUpdated: snapshot.updated,
    ...(notes.length ? { note: notes.join(`\n`) } : {}),
  };
};

const pauseSearch = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const abort = () => {
    clearTimeout(timer);
    signal.removeEventListener(`abort`, abort);
    reject(cancelled());
  };
  const timer = setTimeout(() => {
    signal.removeEventListener(`abort`, abort);
    resolve();
  }, milliseconds);
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
});

export const searchConnectedDomains = async (
  domains: string[],
  signal: AbortSignal,
  expectedUserId?: string,
  expectedUpdated?: string,
  onProgress?: (results: DomainSearchResults) => void,
): Promise<DomainSearchResults> => {
  const names = [...new Set(domains.map(normalizeDomainName))];
  const { fields, userId, snapshot } = await getSearchConnections(signal, expectedUserId, expectedUpdated);
  const results = names.map(domain => ({
    domain,
    connections: fields.map(field => ({
      domain,
      pending: true,
      label: field.label,
      provider: field.id,
      purchaseUrl: registrarPurchaseUrl(field.id, domain),
    } as DomainSearchResult)),
  }));
  const snapshotResults = (): DomainSearchResults => ({
    searchedAt: new Date().toISOString(),
    connectionsUpdated: snapshot.updated,
    results: results.map(result => ({ ...result, connections: [...result.connections] })),
  });
  onProgress?.(snapshotResults());
  await Promise.all(fields.map(async (field, providerIndex) => {
    const pace = field.id === `namecheap` ? 4000 : 1000;
    const providerKey = `${userId}:${field.id}`;
    let blockedError = ``;
    for (const [index, domain] of names.entries()) {
      if (signal.aborted) throw cancelled();
      const base = { ...results[index].connections[providerIndex], pending: false };
      let requested = false;
      let retryAfterMs = pace;
      let result: DomainSearchResult;
      try {
        if (blockedError) throw new Error(blockedError);
        const wait = (nextProviderSearch.get(providerKey) ?? 0) - Date.now();
        if (wait > 0) await pauseSearch(wait, signal);
        requested = true;
        const response = await requestRegistrarSearch(`/api/registrars/search`, { domain, provider: field.id, values: snapshot.values[field.id] }, signal);
        const value = response.result as (DomainSearchResult & { error?: string }) | null;
        if (!response.ok) {
          const error = typeof value?.error === `string` ? value.error : `Registrar Search Is Unavailable`;
          if ([401, 403, 429].includes(response.status)) blockedError = error;
          throw new Error(error);
        }
        if (!value || value.provider !== field.id || value.domain !== domain
          || (value.available !== undefined && typeof value.available !== `boolean`)) throw new Error(`Registrar Returned Invalid Search Results`);
        if (value.retryAfterMs !== undefined) {
          if (!Number.isFinite(value.retryAfterMs) || value.retryAfterMs < 0 || value.retryAfterMs > 300_000) throw new Error(`Registrar Returned Invalid Search Timing`);
          retryAfterMs = Math.max(pace, value.retryAfterMs);
        }
        for (const quote of [value.registration, value.renewal]) {
          if (quote !== undefined && (!quote || typeof quote !== `object` || Array.isArray(quote)
            || typeof quote.amount !== `number` || !Number.isFinite(quote.amount) || quote.amount < 0
            || typeof quote.currency !== `string` || !/^(?:[A-Z]{3})?$/.test(quote.currency)
            || (quote.years !== undefined && (!Number.isInteger(quote.years) || quote.years < 1 || quote.years > 10)))) {
            throw new Error(`Registrar Returned Invalid Pricing`);
          }
        }
        result = { ...base, available: value.available, renewal: value.renewal, registration: value.registration,
          note: typeof value.note === `string` ? value.note.slice(0, 1200) : undefined };
      } catch (failure) {
        if (signal.aborted) throw cancelled();
        result = { ...base, error: failure instanceof Error ? failure.message : `Could Not Reach Registrar Search` };
      } finally {
        if (requested) nextProviderSearch.set(providerKey, Date.now() + retryAfterMs);
      }
      results[index].connections[providerIndex] = result;
      if (!signal.aborted) onProgress?.(snapshotResults());
    }
  }));
  await checkSearchConnections(signal, userId, snapshot.updated);
  return snapshotResults();
};
