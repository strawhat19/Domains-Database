import { authAPI } from '../../api/auth';
import { connectionsAPI } from '../../api/connections';
import { registrarPurchaseUrl } from './types';
import { normalizeDomainName } from '../domainUtils';
import { connectionFields } from '../connections/types';
import { getServerSearchProviders } from './availability';
import { popularExtensions, sortDomainExtensions, normalizeDomainSearchQuery } from './query';
import type { ConnectionProvider, ConnectionSnapshot } from '../connections/types';
import type { DomainSearchResult, DomainSearchResults, DomainSearchVariants } from './types';

const cancelled = () => new Error(`Domain Search Cancelled`);
const nextProviderSearch = new Map<string, number>();

interface SearchConnections {
  userId: string | null;
  connectionsUpdated: string;
  snapshot: ConnectionSnapshot | null;
  sources: { field: typeof connectionFields[number]; values?: string }[];
}

const checkSearchConnections = async (signal: AbortSignal, { userId, snapshot }: SearchConnections) => {
  if (signal.aborted) throw cancelled();
  if (userId === null) return;
  const session = await authAPI.restoreSession();
  if (signal.aborted || (session?.user.id ?? null) !== userId) throw cancelled();
  if (!snapshot) return;
  const latest = await connectionsAPI.getConnections(userId);
  if (signal.aborted) throw cancelled();
  if (latest.updated !== snapshot.updated) throw new Error(`Connections Changed — Search Again`);
};

const getSearchConnections = async (signal: AbortSignal, expectedUserId?: string | null, expectedUpdated?: string): Promise<SearchConnections> => {
  if (signal.aborted) throw cancelled();
  const session = expectedUserId === null ? null : await authAPI.restoreSession();
  const userId = session?.user.id ?? null;
  if (signal.aborted || (expectedUserId !== undefined && expectedUserId !== userId)) throw cancelled();
  const [serverResult, privateResult] = await Promise.allSettled([
    getServerSearchProviders(signal),
    userId ? connectionsAPI.getConnections(userId) : Promise.resolve(null),
  ]);
  if (signal.aborted) throw cancelled();
  if (userId && privateResult.status === `rejected`) throw privateResult.reason;
  const providers: ConnectionProvider[] = serverResult.status === `fulfilled` ? serverResult.value : [];
  const privateSnapshot = privateResult.status === `fulfilled` ? privateResult.value : null;
  const sources = connectionFields.filter(field => field.search).flatMap<SearchConnections['sources'][number]>(field => privateSnapshot?.values[field.id]?.trim()
    ? [{ field, values: privateSnapshot.values[field.id] }]
    : providers.includes(field.id) ? [{ field }] : []);
  if (!sources.length) {
    if (serverResult.status === `rejected`) throw serverResult.reason;
    if (privateResult.status === `rejected`) throw privateResult.reason;
    throw new Error(userId ? `Connect A Registrar To Search Domains` : `Domain Search Is Not Configured`);
  }
  const snapshot = sources.some(source => source.values !== undefined) ? privateSnapshot : null;
  const connectionsUpdated = JSON.stringify({ providers, privateUpdated: snapshot?.updated ?? null });
  if (expectedUpdated !== undefined && expectedUpdated !== connectionsUpdated) throw new Error(`Connections Changed — Search Again`);
  const connections = { userId, sources, snapshot, connectionsUpdated };
  await checkSearchConnections(signal, connections);
  return connections;
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

export const getConnectedDomainVariants = async (value: string, signal: AbortSignal, expectedUserId?: string | null): Promise<DomainSearchVariants> => {
  const query = normalizeDomainSearchQuery(value);
  const connections = await getSearchConnections(signal, expectedUserId);
  const { sources, connectionsUpdated } = connections;
  if (query.includes(`.`)) return { query, domains: [query], connectionsUpdated };
  const catalogs = await Promise.all(sources.map(async ({ field, values }) => {
    try {
      const response = await requestRegistrarSearch(`/api/registrars/extensions`, {
        provider: field.id,
        ...(values !== undefined ? { values } : {}),
      }, signal);
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
  await checkSearchConnections(signal, connections);
  const catalogExtensions = catalogs.flatMap(catalog => catalog.extensions);
  const extensions = sortDomainExtensions(catalogExtensions.length ? catalogExtensions : popularExtensions);
  const notes = catalogs.map(catalog => catalog.note).filter(Boolean);
  if (!catalogExtensions.length) notes.unshift(`Extension Catalogs Are Unavailable — Showing Common Extensions; Search A Full Domain For Any Other Extension`);
  return {
    query,
    domains: extensions.map(extension => `${query}.${extension}`),
    connectionsUpdated,
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
  expectedUserId?: string | null,
  expectedUpdated?: string,
  onProgress?: (results: DomainSearchResults) => void,
): Promise<DomainSearchResults> => {
  const names = [...new Set(domains.map(normalizeDomainName))];
  const connections = await getSearchConnections(signal, expectedUserId, expectedUpdated);
  const { sources, userId, connectionsUpdated } = connections;
  const results = names.map(domain => ({
    domain,
    connections: sources.map(({ field }) => ({
      domain,
      pending: true,
      label: field.label,
      provider: field.id,
      purchaseUrl: registrarPurchaseUrl(field.id, domain),
    } as DomainSearchResult)),
  }));
  const snapshotResults = (): DomainSearchResults => ({
    searchedAt: new Date().toISOString(),
    connectionsUpdated,
    results: results.map(result => ({ ...result, connections: [...result.connections] })),
  });
  onProgress?.(snapshotResults());
  await Promise.all(sources.map(async ({ field, values }, providerIndex) => {
    const pace = field.id === `namecheap` ? 4000 : 1000;
    const providerKey = `${values === undefined ? `server` : userId}:${field.id}`;
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
        const response = await requestRegistrarSearch(`/api/registrars/search`, {
          domain,
          provider: field.id,
          ...(values !== undefined ? { values } : {}),
        }, signal);
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
  await checkSearchConnections(signal, connections);
  return snapshotResults();
};
