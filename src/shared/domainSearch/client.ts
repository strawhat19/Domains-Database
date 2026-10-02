import { authAPI } from '../../api/auth';
import type { DomainSearchResults, DomainSearchResult } from './types';
import { connectionsAPI } from '../../api/connections';
import { registrarPurchaseUrl } from './types';
import { normalizeDomainName } from '../domainUtils';
import { connectionFields } from '../connections/types';

export const searchConnectedDomains = async (query: string, signal: AbortSignal, expectedUserId?: string): Promise<DomainSearchResults> => {
  if (signal.aborted) throw new Error(`Domain Search Cancelled`);
  const domain = normalizeDomainName(query);
  const session = await authAPI.restoreSession();
  const userId = session?.user.id;
  if (!userId || (expectedUserId && expectedUserId !== userId)) throw new Error(`Sign In To Search Your Connected Registrars`);
  const snapshot = await connectionsAPI.getConnections(userId);
  if (signal.aborted) throw new Error(`Domain Search Cancelled`);
  const fields = connectionFields.filter(field => field.search && snapshot.values[field.id]?.trim());
  const results = await Promise.all(fields.map(async field => {
    const base: DomainSearchResult = { domain, provider: field.id, label: field.label, purchaseUrl: registrarPurchaseUrl(field.id, domain) };
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener(`abort`, abort, { once: true });
    if (signal.aborted) abort();
    const timeout = setTimeout(abort, 75_000);
    try {
      const response = await fetch(`/api/registrars/search`, {
        method: `POST`,
        credentials: `omit`,
        signal: controller.signal,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ domain, provider: field.id, values: snapshot.values[field.id] }),
      });
      const result = await response.json().catch(() => null) as (DomainSearchResult & { error?: string }) | null;
      if (!response.ok) throw new Error(result?.error || `Registrar Search Is Unavailable`);
      if (!result || result.provider !== field.id || result.domain !== domain
        || (result.available !== undefined && typeof result.available !== `boolean`)) throw new Error(`Registrar Returned Invalid Search Results`);
      for (const quote of [result.registration, result.renewal]) {
        if (quote !== undefined && (!quote || typeof quote !== `object` || Array.isArray(quote)
          || typeof quote.amount !== `number` || !Number.isFinite(quote.amount) || quote.amount < 0
          || typeof quote.currency !== `string` || !/^(?:[A-Z]{3})?$/.test(quote.currency)
          || (quote.years !== undefined && (!Number.isInteger(quote.years) || quote.years < 1 || quote.years > 10)))) {
          throw new Error(`Registrar Returned Invalid Pricing`);
        }
      }
      return { ...base, available: result.available, renewal: result.renewal, registration: result.registration,
        note: typeof result.note === `string` ? result.note.slice(0, 1200) : undefined };
    } catch (failure) {
      if (signal.aborted) throw new Error(`Domain Search Cancelled`);
      const error = controller.signal.aborted ? `Registrar Search Timed Out`
        : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : `Could Not Reach Registrar Search`;
      return { ...base, error };
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener(`abort`, abort);
    }
  }));
  if (signal.aborted) throw new Error(`Domain Search Cancelled`);
  const currentSession = await authAPI.restoreSession();
  if (signal.aborted || currentSession?.user.id !== userId) throw new Error(`Domain Search Cancelled`);
  const latest = await connectionsAPI.getConnections(userId);
  if (latest.updated !== snapshot.updated) throw new Error(`Connections Changed — Search Again`);
  return { results, searchedAt: new Date().toISOString() };
};
