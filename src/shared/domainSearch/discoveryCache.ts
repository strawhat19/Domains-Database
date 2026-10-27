import { normalizeDomainName } from '../domainUtils';
import { domainSearchFields, registrarPurchaseUrl } from './types';
import type { DomainSearchPrice, DomainSearchResult } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DISCOVERY_CACHE_TTL = 60 * 60_000;
const CACHE_VERSION = 1;
const MAX_QUOTES = 256;
const MAX_STORAGE_LENGTH = 512_000;
const owners = new Map<string, OwnerCache>();
const writes = new Map<string, Promise<void>>();

export interface CachedDiscoveryQuote {
  checkedAt: number;
  result: DomainSearchResult;
}

interface OwnerCache {
  scope: string;
  loaded: boolean;
  loading?: Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
  quotes: Map<string, CachedDiscoveryQuote>;
}

const record = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value)
  ? value as Record<string, unknown> : null;
const storageKey = (owner: string) => `domains:discovery-quotes:v1:${encodeURIComponent(owner)}`;
const quoteKey = (result: DomainSearchResult) => `${result.provider}:${result.domain}`;
const normalizePrice = (value: unknown): DomainSearchPrice | undefined | null => {
  if (value === undefined) return undefined;
  const quote = record(value);
  if (!quote || typeof quote.amount !== `number` || !Number.isFinite(quote.amount) || quote.amount < 0
    || typeof quote.currency !== `string` || !/^(?:[A-Z]{3})?$/.test(quote.currency)
    || (quote.years !== undefined && (typeof quote.years !== `number` || !Number.isInteger(quote.years) || quote.years < 1 || quote.years > 10))) return null;
  return { amount: quote.amount, currency: quote.currency, ...(quote.years !== undefined ? { years: quote.years as number } : {}) };
};
const normalizeQuote = (value: unknown, now: number): CachedDiscoveryQuote | null => {
  const entry = record(value);
  const result = record(entry?.result);
  if (!entry || !result || typeof entry.checkedAt !== `number` || !Number.isFinite(entry.checkedAt)
    || entry.checkedAt > now || now - entry.checkedAt >= DISCOVERY_CACHE_TTL || typeof result.available !== `boolean`
    || result.error !== undefined || (result.pending !== undefined && result.pending !== false) || typeof result.domain !== `string`) return null;
  const field = domainSearchFields.find(candidate => candidate.id === result.provider);
  if (!field) return null;
  const renewal = normalizePrice(result.renewal);
  const registration = normalizePrice(result.registration);
  if (renewal === null || registration === null) return null;
  let domain: string;
  try { domain = normalizeDomainName(result.domain); } catch { return null; }
  return {
    checkedAt: entry.checkedAt,
    result: {
      domain,
      label: field.label,
      provider: field.id,
      available: result.available,
      ...(renewal ? { renewal } : {}),
      ...(registration ? { registration } : {}),
      purchaseUrl: registrarPurchaseUrl(field.id, domain),
      ...(typeof result.note === `string` && result.note ? { note: result.note.slice(0, 1200) } : {}),
    },
  };
};
const trimQuotes = (state: OwnerCache, now = Date.now()) => {
  for (const [key, quote] of state.quotes) {
    if (quote.checkedAt > now || now - quote.checkedAt >= DISCOVERY_CACHE_TTL) state.quotes.delete(key);
  }
  if (state.quotes.size <= MAX_QUOTES) return;
  const newest = [...state.quotes].sort((first, second) => second[1].checkedAt - first[1].checkedAt || first[0].localeCompare(second[0]));
  state.quotes = new Map(newest.slice(0, MAX_QUOTES));
};
const persist = (owner: string, state: OwnerCache) => {
  const queued = (writes.get(owner) ?? Promise.resolve()).then(async () => {
    if (owners.get(owner) !== state) return;
    trimQuotes(state);
    const value = JSON.stringify({ version: CACHE_VERSION, scope: state.scope, entries: [...state.quotes.values()] });
    try { await AsyncStorage.setItem(storageKey(owner), value); } catch { /* Quotes remain available in memory. */ }
  }).catch(() => {});
  writes.set(owner, queued);
  void queued.then(() => { if (writes.get(owner) === queued) writes.delete(owner); });
};
const schedulePersistence = (owner: string, state: OwnerCache) => {
  if (state.timer !== undefined) return;
  state.timer = setTimeout(() => {
    state.timer = undefined;
    if (owners.get(owner) === state) persist(owner, state);
  }, 150);
};
const createState = (owner: string, scope: string, loaded: boolean): OwnerCache => {
  const previous = owners.get(owner);
  if (previous?.timer !== undefined) clearTimeout(previous.timer);
  const state: OwnerCache = { scope, loaded, quotes: new Map() };
  owners.set(owner, state);
  if (previous) schedulePersistence(owner, state);
  return state;
};
const loadQuotes = async (owner: string, state: OwnerCache) => {
  try {
    await writes.get(owner);
    if (owners.get(owner) !== state) return;
    const raw = await AsyncStorage.getItem(storageKey(owner));
    if (owners.get(owner) !== state || !raw || raw.length > MAX_STORAGE_LENGTH) return;
    const saved = record(JSON.parse(raw));
    if (saved?.version !== CACHE_VERSION || saved.scope !== state.scope || !Array.isArray(saved.entries)) {
      schedulePersistence(owner, state);
      return;
    }
    const now = Date.now();
    for (const item of saved.entries.slice(0, MAX_QUOTES)) {
      const quote = normalizeQuote(item, now);
      if (!quote) continue;
      const key = quoteKey(quote.result);
      if ((state.quotes.get(key)?.checkedAt ?? -1) < quote.checkedAt) state.quotes.set(key, quote);
    }
    trimQuotes(state, now);
  } catch { /* Invalid or unavailable device storage does not block discovery. */ }
  finally { state.loaded = true; }
};

export const readDiscoveryCache = async (owner: string, scope: string): Promise<Map<string, CachedDiscoveryQuote>> => {
  const current = owners.get(owner);
  const state = current?.scope === scope ? current : createState(owner, scope, Boolean(current));
  if (!state.loaded) {
    state.loading ??= loadQuotes(owner, state);
    await state.loading;
  }
  if (owners.get(owner) !== state) return new Map();
  trimQuotes(state);
  return new Map([...state.quotes].map(([key, quote]) => [key, {
    checkedAt: quote.checkedAt,
    result: {
      ...quote.result,
      ...(quote.result.renewal ? { renewal: { ...quote.result.renewal } } : {}),
      ...(quote.result.registration ? { registration: { ...quote.result.registration } } : {}),
    },
  }]));
};

export const storeDiscoveryQuote = (owner: string, scope: string, result: DomainSearchResult, checkedAt: number): void => {
  const current = owners.get(owner);
  if (current && current.scope !== scope) return;
  const quote = normalizeQuote({ result, checkedAt }, Date.now());
  if (!quote) return;
  const state = current ?? createState(owner, scope, true);
  const key = quoteKey(quote.result);
  if ((state.quotes.get(key)?.checkedAt ?? -1) > checkedAt) return;
  state.quotes.set(key, quote);
  trimQuotes(state);
  schedulePersistence(owner, state);
};
