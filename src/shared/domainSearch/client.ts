import { Platform } from 'react-native';
import { authAPI } from '../../api/auth';
import { absoluteSiteUrl } from '../seo';
import { normalizeDomainName } from '../domainUtils';
import { connectionsAPI } from '../../api/connections';
import { getServerSearchProviders } from './availability';
import { readDiscoveryCache, storeDiscoveryQuote } from './discoveryCache';
import { canUseConnectionProvider } from '../accountPlans';
import type { ConnectionSnapshot } from '../connections/types';
import { domainSearchFields, registrarPurchaseUrl } from './types';
import { getPlanAccess, getFeatureAuthorization } from '../planAccess/service';
import { popularExtensions, sortDomainExtensions, normalizeDomainSearchQuery } from './query';
import type { DomainSearchResult, DomainSearchResults, DomainSearchVariants, DomainSearchProvider, DomainSearchProgress } from './types';

const cancelled = () => new Error(`Domain Search Cancelled`);
const nextProviderSearch = new Map<string, number>();
class RegistrarSearchTransportError extends Error {}

interface SearchConnections {
  paid: boolean;
  userId: string | null;
  connectionsUpdated: string;
  snapshot: ConnectionSnapshot | null;
  sources: { values?: string; field: { id: DomainSearchProvider; label: string } }[];
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
  const access = userId ? await getPlanAccess(userId) : null;
  if (signal.aborted || (expectedUserId !== undefined && expectedUserId !== userId)) throw cancelled();
  const [serverResult, privateResult] = await Promise.allSettled([
    getServerSearchProviders(signal),
    userId ? connectionsAPI.getConnections(userId) : Promise.resolve(null),
  ]);
  if (signal.aborted) throw cancelled();
  if (userId && privateResult.status === `rejected`) throw privateResult.reason;
  const providers: DomainSearchProvider[] = serverResult.status === `fulfilled` ? serverResult.value : [];
  const privateSnapshot = privateResult.status === `fulfilled` ? privateResult.value : null;
  const sources = domainSearchFields.flatMap<SearchConnections['sources'][number]>(field => {
    if (field.id !== `vercel` && !canUseConnectionProvider(field.id, access?.paid === true)) return [];
    const values = canUseConnectionProvider(field.id, access?.paid === true) ? privateSnapshot?.values[field.id]?.trim() : undefined;
    return values ? [{ field, values }] : providers.includes(field.id) ? [{ field }] : [];
  });
  if (!sources.length) {
    if (serverResult.status === `rejected`) throw serverResult.reason;
    if (privateResult.status === `rejected`) throw privateResult.reason;
    throw new Error(userId ? `Connect A Registrar To Search Domains` : `Domain Search Is Not Configured`);
  }
  if (!access?.paid) sources.splice(1);
  const snapshot = sources.some(source => source.values !== undefined) ? privateSnapshot : null;
  const connectionsUpdated = JSON.stringify({ providers, privateUpdated: snapshot?.updated ?? null });
  if (expectedUpdated !== undefined && expectedUpdated !== connectionsUpdated) throw new Error(`Connections Changed — Search Again`);
  const connections = { userId, sources, snapshot, connectionsUpdated, paid: access?.paid === true };
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
    const authorization = await getFeatureAuthorization().catch(failure => {
      if (failure instanceof TypeError || failure?.code === `auth/network-request-failed`) {
        throw new RegistrarSearchTransportError(`Could Not Verify Your Session For Registrar Search`);
      }
      throw failure;
    });
    const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
      method: `POST`,
      credentials: `omit`,
      signal: controller.signal,
      headers: { ...authorization, 'Content-Type': `application/json` },
      body: JSON.stringify(body),
    });
    const result: unknown = await response.json().catch(() => null);
    return { result, status: response.status, ok: response.ok };
  } catch (failure) {
    if (signal.aborted) throw cancelled();
    if (controller.signal.aborted) throw new RegistrarSearchTransportError(`Registrar Search Timed Out`);
    if (failure instanceof TypeError) throw new RegistrarSearchTransportError(`Could Not Reach Registrar Search`);
    throw failure;
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
  onProgress?: (results: DomainSearchResults, progress: DomainSearchProgress) => void,
  options?: { discoveryCache?: boolean; refresh?: boolean },
): Promise<DomainSearchResults> => {
  const names = [...new Set(domains.map(normalizeDomainName))];
  const connections = await getSearchConnections(signal, expectedUserId, expectedUpdated);
  const { sources, userId, connectionsUpdated } = connections;
  const cacheOwner = userId ?? `guest`;
  const cacheScope = JSON.stringify([connectionsUpdated, connections.paid, sources.map(({ field, values }) => [field.id, values !== undefined])]);
  const cached = options?.discoveryCache ? await readDiscoveryCache(cacheOwner, cacheScope) : null;
  if (signal.aborted) throw cancelled();
  let completed = 0;
  let checkedAt: number | undefined;
  const total = names.length * sources.length;
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
  if (!options?.refresh) for (const domain of results) for (let index = 0; index < domain.connections.length; index++) {
    const saved = cached?.get(`${domain.connections[index].provider}:${domain.domain}`);
    if (!saved) continue;
    completed += 1;
    domain.connections[index] = { ...saved.result };
    checkedAt = Math.min(checkedAt ?? saved.checkedAt, saved.checkedAt);
  }
  const snapshotResults = (): DomainSearchResults => ({
    searchedAt: new Date(checkedAt ?? Date.now()).toISOString(),
    connectionsUpdated,
    results: results.map(result => ({ ...result, connections: [...result.connections] })),
  });
  onProgress?.(snapshotResults(), { total, completed });
  await Promise.all(sources.map(async ({ field, values }, providerIndex) => {
    const pace = field.id === `namecheap` ? 4000 : 1000;
    const providerKey = `${values === undefined ? `server` : userId}:${field.id}`;
    const pending = names.flatMap((domain, index) => results[index]?.connections?.[providerIndex]?.pending ? [{ domain, index }] : []);
    let batchSize = field.id === `godaddy` && (values === undefined || /^GODADDY_PAT=/m.test(values)) ? 25 : 1;
    let blockedError = ``;
    for (let offset = 0; offset < pending.length;) {
      if (signal.aborted) throw cancelled();
      const batch = pending.slice(offset, offset + batchSize);
      const useBatch = batch.length > 1;
      let requested = false;
      let retryAfterMs = pace;
      let valuesByDomain: unknown[] = [];
      let batchError = ``;
      try {
        if (blockedError) throw new Error(blockedError);
        const wait = (nextProviderSearch.get(providerKey) ?? 0) - Date.now();
        if (wait > 0) await pauseSearch(wait, signal);
        requested = true;
        const input = {
          provider: field.id,
          ...(useBatch ? { domains: batch.map(item => item.domain) } : { domain: batch[0]?.domain }),
          ...(values !== undefined ? { values } : {}),
        };
        const submit = () => requestRegistrarSearch(`/api/registrars/search`, input, signal);
        const response = await submit().catch(async failure => {
          if (!options?.discoveryCache || !(failure instanceof RegistrarSearchTransportError)) throw failure;
          await pauseSearch(pace, signal);
          return submit();
        });
        const body = response.result as { results?: unknown; error?: string } | null;
        if (!response.ok) {
          if (useBatch && response.status === 501) {
            batchSize = 1;
            nextProviderSearch.set(providerKey, Date.now() + pace);
            continue;
          }
          const error = typeof body?.error === `string` ? body.error : `Registrar Search Is Unavailable`;
          if ([401, 403, 429].includes(response.status)) blockedError = error;
          throw new Error(error);
        }
        if (useBatch && (!Array.isArray(body?.results) || body.results.length !== batch.length)) throw new Error(`Registrar Returned Invalid Search Results`);
        valuesByDomain = useBatch ? body?.results as unknown[] : [response.result];
      } catch (failure) {
        if (signal.aborted) throw cancelled();
        if (options?.discoveryCache && failure instanceof RegistrarSearchTransportError) blockedError = failure.message;
        batchError = failure instanceof Error ? failure.message : `Could Not Reach Registrar Search`;
      }
      for (const [batchIndex, { domain, index }] of batch.entries()) {
        const base = { ...results[index].connections[providerIndex], pending: false };
        const value = valuesByDomain[batchIndex] as DomainSearchResult | null | undefined;
        let result: DomainSearchResult;
        try {
          if (batchError) throw new Error(batchError);
          if (!value || value.provider !== field.id || value.domain !== domain
            || (value.available !== undefined && typeof value.available !== `boolean`)) throw new Error(`Registrar Returned Invalid Search Results`);
          if (typeof value.error === `string`) throw new Error(value.error);
          if (value.retryAfterMs !== undefined) {
            if (!Number.isFinite(value.retryAfterMs) || value.retryAfterMs < 0 || value.retryAfterMs > 300_000) throw new Error(`Registrar Returned Invalid Search Timing`);
            retryAfterMs = Math.max(retryAfterMs, value.retryAfterMs);
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
          result = { ...base, error: failure instanceof Error ? failure.message : `Could Not Reach Registrar Search` };
        }
        results[index].connections[providerIndex] = result;
        completed += 1;
        if (options?.discoveryCache && !signal.aborted) {
          const resultCheckedAt = Date.now();
          checkedAt = Math.min(checkedAt ?? resultCheckedAt, resultCheckedAt);
          storeDiscoveryQuote(cacheOwner, cacheScope, result, resultCheckedAt);
        }
      }
      if (requested) nextProviderSearch.set(providerKey, Date.now() + retryAfterMs);
      if (!signal.aborted) onProgress?.(snapshotResults(), { total, completed });
      offset += batch.length;
    }
  }));
  await checkSearchConnections(signal, connections);
  return snapshotResults();
};
