import { authAPI } from '../../api/auth';
import { Types } from '../../types/types';
import { useLocalStorage } from '../config';
import { normalizeDomainName } from '../domainUtils';
import { getAppCollectionIDNumber } from '../common/ids';
import { connectionFields } from '../connections/types';
import { registrarPurchaseUrl } from '../domainSearch/types';
import { WatchedDomain } from '../models/watching/WatchedDomain';
import { accountStorageKey } from '../authentication/userScope';
import type { DomainSearchPrice, DomainSearchResult, DomainSearchDomainResult } from '../domainSearch/types';
import { readStorage, writeStorage, createOperationQueue } from '../common/storage';

export const WATCHING_STORAGE_KEY = `domains-database:watching:v1`;
const serialize = createOperationQueue(WATCHING_STORAGE_KEY);

interface WatchingSnapshot {
  version: 1;
  userId: string;
  nextNumber: number;
  records: WatchedDomain[];
}

const requireUser = async (expectedUserId?: string | null) => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Save Watching`);
  const session = await authAPI.restoreSession();
  const userId = session?.user.id;
  if (!userId) throw new Error(`Sign In To Watch Domains`);
  if (expectedUserId !== undefined && expectedUserId !== userId) throw new Error(`Your Account Changed — Try Again`);
  return userId;
};

const normalizePrice = (price?: DomainSearchPrice): DomainSearchPrice | undefined => {
  if (price === undefined) return undefined;
  if (!price || typeof price !== `object` || Array.isArray(price)
    || !Number.isFinite(price.amount) || price.amount < 0
    || typeof price.currency !== `string` || !/^(?:[A-Z]{3})?$/.test(price.currency)
    || (price.years !== undefined && (!Number.isInteger(price.years) || price.years < 1 || price.years > 10))) {
    throw new Error(`Domain Search Prices Could Not Be Read`);
  }
  return { ...price };
};

const normalizeConnections = (connections: DomainSearchResult[], domain: string): DomainSearchResult[] => {
  if (!Array.isArray(connections)) throw new Error(`Domain Search Results Could Not Be Read`);
  const providers = new Set<string>();
  return connections.map(connection => {
    const field = connectionFields.find(field => field.search && field.id === connection?.provider);
    if (!field || providers.has(field.id) || connection.domain !== domain
      || (connection.note !== undefined && typeof connection.note !== `string`)
      || (connection.error !== undefined && typeof connection.error !== `string`)
      || (connection.pending !== undefined && typeof connection.pending !== `boolean`)
      || (connection.available !== undefined && typeof connection.available !== `boolean`)
      || (connection.retryAfterMs !== undefined && (!Number.isFinite(connection.retryAfterMs) || connection.retryAfterMs < 0))) {
      throw new Error(`Domain Search Results Could Not Be Read`);
    }
    providers.add(field.id);
    return {
      domain,
      label: field.label,
      provider: field.id,
      note: connection.note,
      error: connection.error,
      pending: connection.pending,
      available: connection.available,
      renewal: normalizePrice(connection.renewal),
      retryAfterMs: connection.retryAfterMs,
      registration: normalizePrice(connection.registration),
      purchaseUrl: registrarPurchaseUrl(field.id, domain),
    };
  });
};

const readWatching = async (userId: string): Promise<WatchingSnapshot> => {
  const saved = await readStorage(accountStorageKey(WATCHING_STORAGE_KEY, userId));
  if (saved === null) return { version: 1, userId, records: [], nextNumber: 1 };
  try {
    const snapshot = JSON.parse(saved) as WatchingSnapshot;
    if (snapshot?.version !== 1 || snapshot.userId !== userId || !Array.isArray(snapshot.records)
      || !Number.isSafeInteger(snapshot.nextNumber) || snapshot.nextNumber < 1) throw new Error();
    const ids = new Set<string>();
    const numbers = new Set<number>();
    const domains = new Set<string>();
    const records = snapshot.records.map(record => {
      if (!record || record.uid !== userId || record.type !== Types.WatchedDomain
        || typeof record.domain !== `string` || normalizeDomainName(record.domain) !== record.domain
        || typeof record.listName !== `string` || !record.listName.trim() || typeof record.mock !== `boolean`
        || !Number.isSafeInteger(record.number) || record.number < 1
        || getAppCollectionIDNumber(record.id, Types.WatchedDomain) !== record.number
        || ids.has(record.id) || numbers.has(record.number) || domains.has(record.domain)
        || typeof record.created !== `string` || !Number.isFinite(Date.parse(record.created))
        || typeof record.updated !== `string` || !Number.isFinite(Date.parse(record.updated))
        || typeof record.checkedAt !== `string` || !Number.isFinite(Date.parse(record.checkedAt))) throw new Error();
      ids.add(record.id);
      numbers.add(record.number);
      domains.add(record.domain);
      return new WatchedDomain({ ...record, connections: normalizeConnections(record.connections, record.domain) });
    });
    return { version: 1, userId, records, nextNumber: Math.max(snapshot.nextNumber, ...records.map(record => record.number + 1)) };
  } catch {
    throw new Error(`Saved Watching Data Could Not Be Read`);
  }
};

const saveWatching = async (snapshot: WatchingSnapshot) => {
  await requireUser(snapshot.userId);
  await writeStorage(accountStorageKey(WATCHING_STORAGE_KEY, snapshot.userId), JSON.stringify({
    ...snapshot,
    records: snapshot.records.map(record => record.toRecord()),
  }));
};

const mockConnections = (domain: string): DomainSearchResult[] => {
  const hash = Array.from(domain).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  const available = hash % 7 !== 0;
  return connectionFields.filter(field => field.search).map((field, index) => {
    const amount = (899 + index * 150 + hash % 600) / 100;
    return {
      domain,
      available,
      pending: false,
      label: field.label,
      provider: field.id,
      purchaseUrl: registrarPurchaseUrl(field.id, domain),
      note: `Mock Registrar Data — Connect A Backend For Live Updates`,
      ...(available ? {
        registration: { amount, years: 1, currency: `USD` },
        renewal: { years: 1, currency: `USD`, amount: Math.round((amount + 4) * 100) / 100 },
      } : {}),
    };
  });
};

export const getWatching = (expectedUserId?: string | null): Promise<WatchedDomain[]> => serialize(async () => {
  const userId = await requireUser(expectedUserId);
  const snapshot = await readWatching(userId);
  await requireUser(userId);
  return snapshot.records;
});

export const watchDomain = (input: DomainSearchDomainResult, expectedUserId?: string | null): Promise<WatchedDomain> => serialize(async () => {
  const userId = await requireUser(expectedUserId);
  const domain = normalizeDomainName(input?.domain);
  const snapshot = await readWatching(userId);
  const existing = snapshot.records.find(record => record.domain === domain);
  if (existing) {
    await requireUser(userId);
    return existing;
  }
  const timestamp = new Date().toISOString();
  const record = new WatchedDomain({
    domain,
    uid: userId,
    mock: false,
    listName: `Watching`,
    created: timestamp,
    checkedAt: timestamp,
    number: snapshot.nextNumber,
    connections: normalizeConnections(input.connections, domain).map(connection => connection.pending ? {
      ...connection,
      pending: false,
      note: connection.note || `Availability Was Still Being Checked When Saved`,
    } : connection),
  });
  snapshot.nextNumber += 1;
  snapshot.records.push(record);
  await saveWatching(snapshot);
  return record;
});

export const removeWatch = (id: string, expectedUserId?: string | null): Promise<void> => serialize(async () => {
  const userId = await requireUser(expectedUserId);
  const snapshot = await readWatching(userId);
  if (!snapshot.records.some(record => record.id === id)) throw new Error(`Watched Domain Could Not Be Found`);
  snapshot.records = snapshot.records.filter(record => record.id !== id);
  await saveWatching(snapshot);
});

export const syncWatching = (expectedUserId?: string | null): Promise<WatchedDomain[]> => serialize(async () => {
  const userId = await requireUser(expectedUserId);
  const snapshot = await readWatching(userId);
  const timestamp = new Date().toISOString();
  snapshot.records = snapshot.records.map(record => new WatchedDomain({
    ...record,
    mock: true,
    updated: timestamp,
    checkedAt: timestamp,
    connections: mockConnections(record.domain),
  }));
  await saveWatching(snapshot);
  return snapshot.records;
});
