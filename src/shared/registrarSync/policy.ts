import { authAPI } from '../../api/auth';
import { firebaseEnabled } from '../firebase/config';
import { connectionsAPI } from '../../api/connections';
import { REGISTRARS, useLocalStorage, persistenceEnabled } from '../config';
import { SYNC_POLICY_STORAGE_KEY } from '../accountData/keys';
import type { ConnectionProvider } from '../connections/types';
import { accountStorageKey } from '../authentication/userScope';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import type { RegistrarDomain, AccountSyncStatuses, ConnectionSyncStatus, ConnectionSyncStatuses } from './types';

export const MANUAL_SYNC_LIMIT = 3;
export const AUTO_SYNC_INTERVAL_MS = 144 * 60 * 1000;
export const MANUAL_SYNC_WINDOW_MS = 3 * 60 * 1000;
export { SYNC_POLICY_STORAGE_KEY } from '../accountData/keys';

export interface RegistrarSyncPolicy {
  version: 1;
  userId: string;
  lastSyncedAt: number;
  manualAttempts: number[];
  connectionsUpdated: string;
  manualCooldownUntil: number;
  statuses: ConnectionSyncStatuses;
  accountStatuses?: AccountSyncStatuses;
  successfulProviders: ConnectionProvider[];
  automaticSyncPaused?: boolean;
}

export interface ManualSyncReservation {
  allowed: boolean;
  policy: RegistrarSyncPolicy;
}

const providers: ConnectionProvider[] = [`vercel`, `godaddy`, `porkbun`, `namesilo`, `hostinger`, `namecheap`, `squarespace`];
const listeners = new Set<(userId: string) => void>();
const serialize = createOperationQueue(SYNC_POLICY_STORAGE_KEY);
export const subscribeSyncPolicy = (listener: (userId: string) => void, userId?: string, onError?: (error: Error) => void) => {
  if (userId && firebaseEnabled && !useLocalStorage) {
    return subscribeStorage(accountStorageKey(SYNC_POLICY_STORAGE_KEY, userId), () => listener(userId), onError);
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const notifySyncPolicy = (userId: string) => {
  for (const listener of listeners) {
    try { listener(userId); } catch { /* Saved verification is independent of subscriber state. */ }
  }
};
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === `object` && !Array.isArray(value);
const isTimestamp = (value: unknown): value is number => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 && value <= 8.64e15;
const isDateString = (value: unknown) => typeof value === `string` && (!value || Number.isFinite(Date.parse(value)));
const isJSONValue = (value: unknown, depth = 0): boolean => {
  if (value === null || typeof value === `string` || typeof value === `boolean`) return true;
  if (typeof value === `number`) return Number.isFinite(value);
  if (depth > 20) return false;
  if (Array.isArray(value)) return value.length <= 10000 && value.every(item => isJSONValue(item, depth + 1));
  return isRecord(value) && Object.values(value).every(item => isJSONValue(item, depth + 1));
};
const isDomain = (value: unknown): value is RegistrarDomain => {
  if (!isRecord(value) || typeof value.name !== `string` || !value.name.trim() || value.name.length > 253) return false;
  if (value.registrar !== `` && !REGISTRARS.some(registrar => registrar === value.registrar)) return false;
  if ([`status`, `expiresAt`, `createdAt`, `providerId`].some(key => value[key] !== undefined && typeof value[key] !== `string`)) return false;
  if ([`locked`, `privacy`, `autoRenew`].some(key => value[key] !== undefined && typeof value[key] !== `boolean`)) return false;
  if (value.meta !== undefined && (!isRecord(value.meta) || !isJSONValue(value.meta))) return false;
  if (value.renewalEstimate !== undefined) {
    const estimate = value.renewalEstimate;
    if (!isRecord(estimate) || typeof estimate.currency !== `string` || !estimate.currency.trim()) return false;
    if (typeof estimate.amount !== `number` || !Number.isFinite(estimate.amount) || estimate.amount < 0) return false;
  }
  return true;
};
const isStatus = (value: unknown): value is ConnectionSyncStatus => {
  if (!isRecord(value) || typeof value.message !== `string` || !isDateString(value.checkedAt)) return false;
  if (typeof value.count !== `number` || !Number.isSafeInteger(value.count) || value.count < 0) return false;
  if (![`idle`, `checking`, `connected`, `error`].includes(value.state as string)) return false;
  return value.discoveredDomains === undefined || (Array.isArray(value.discoveredDomains)
    && value.discoveredDomains.length <= 10000 && value.discoveredDomains.every(isDomain));
};
const isPolicy = (value: unknown, userId: string): value is RegistrarSyncPolicy => {
  if (!isRecord(value) || value.version !== 1 || value.userId !== userId || !isDateString(value.connectionsUpdated)) return false;
  if (value.automaticSyncPaused !== undefined && typeof value.automaticSyncPaused !== `boolean`) return false;
  if (!isTimestamp(value.lastSyncedAt) || !isTimestamp(value.manualCooldownUntil)) return false;
  if (!Array.isArray(value.manualAttempts) || value.manualAttempts.length > MANUAL_SYNC_LIMIT || !value.manualAttempts.every(isTimestamp)) return false;
  if (!Array.isArray(value.successfulProviders) || new Set(value.successfulProviders).size !== value.successfulProviders.length) return false;
  if (!value.successfulProviders.every(provider => providers.includes(provider as ConnectionProvider))) return false;
  const statuses = value.statuses;
  return isRecord(statuses) && providers.every(provider => isStatus(statuses[provider]))
    && (value.accountStatuses === undefined || (isRecord(value.accountStatuses) && Object.values(value.accountStatuses).every(isStatus)));
};
const emptyStatuses = (): ConnectionSyncStatuses => ({
  vercel: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  godaddy: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  porkbun: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namesilo: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  hostinger: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namecheap: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  squarespace: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
});
const migrateLegacyPolicy = (value: unknown) => {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.statuses)) return value;
  const defaults = emptyStatuses();
  const statuses = { ...value.statuses };
  for (const provider of [`vercel`, `squarespace`] as const) {
    if (!Object.prototype.hasOwnProperty.call(statuses, provider)) statuses[provider] = defaults[provider];
  }
  return { ...value, statuses };
};
const emptyPolicy = (userId: string): RegistrarSyncPolicy => ({
  userId,
  version: 1,
  lastSyncedAt: 0,
  manualAttempts: [],
  connectionsUpdated: ``,
  manualCooldownUntil: 0,
  statuses: emptyStatuses(),
  successfulProviders: [],
});
const requireSession = async (userId: string) => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Sync Settings`);
  const session = await authAPI.restoreSession();
  if (!userId?.trim() || session?.user?.id !== userId) throw new Error(`Sign In To Sync Your Domains`);
};
const readPolicy = async (userId: string): Promise<RegistrarSyncPolicy> => {
  await requireSession(userId);
  const saved = await readStorage(accountStorageKey(SYNC_POLICY_STORAGE_KEY, userId));
  let policy = emptyPolicy(userId);
  if (saved !== null) {
    try {
      const parsed: unknown = migrateLegacyPolicy(JSON.parse(saved));
      if (!isPolicy(parsed, userId)) throw new Error();
      policy = parsed;
    } catch { throw new Error(`Saved Sync Settings Could Not Be Read`); }
  }
  await requireSession(userId);
  return policy;
};
const writePolicy = async (policy: RegistrarSyncPolicy, current = () => true): Promise<RegistrarSyncPolicy> => {
  const serialized = JSON.stringify(policy);
  const stored: unknown = JSON.parse(serialized);
  if (!isPolicy(stored, policy.userId)) throw new Error(`Sync Settings Could Not Be Saved`);
  await requireSession(policy.userId);
  if (!current()) throw new Error(`Sync Changed — Please Try Again`);
  await writeStorage(accountStorageKey(SYNC_POLICY_STORAGE_KEY, policy.userId), serialized);
  notifySyncPolicy(policy.userId);
  return stored;
};

export const getSyncPolicy = (userId: string): Promise<RegistrarSyncPolicy> => serialize(() => readPolicy(userId));
export const resumeAutomaticSync = (userId: string, current: () => boolean): Promise<RegistrarSyncPolicy> => serialize(async () => {
  const previous = await readPolicy(userId);
  if (!current()) throw new Error(`Your Account Changed — Try Again`);
  return previous.automaticSyncPaused ? writePolicy({ ...previous, automaticSyncPaused: false }, current) : previous;
});
export const isSyncCacheFresh = (policy: RegistrarSyncPolicy, connectionsUpdated: string, now = Date.now()) => policy.lastSyncedAt > 0
  && policy.connectionsUpdated === connectionsUpdated && now >= policy.lastSyncedAt && now - policy.lastSyncedAt < AUTO_SYNC_INTERVAL_MS;

export const saveSyncCache = (userId: string, connectionsUpdated: string, statuses: ConnectionSyncStatuses, lastSyncedAt: number, current: () => boolean, accountStatuses?: AccountSyncStatuses): Promise<RegistrarSyncPolicy> => serialize(async () => {
  const previous = await readPolicy(userId);
  const latest = await connectionsAPI.getConnections(userId);
  if (!current()) throw new Error(`Sync Changed — Please Try Again`);
  if (latest.updated !== connectionsUpdated) throw new Error(`Connections Changed — Save Again To Sync`);
  const sameConnections = previous.connectionsUpdated === connectionsUpdated;
  const successful = sameConnections ? previous.successfulProviders : [];
  const connected = providers.filter(provider => statuses[provider]?.state === `connected`
    || latest.accounts.some(account => account.provider === provider && accountStatuses?.[account.id]?.state === `connected`));
  const syncedAt = lastSyncedAt || (sameConnections ? previous.lastSyncedAt : 0);
  return writePolicy({ ...previous, statuses, accountStatuses, connectionsUpdated, lastSyncedAt: syncedAt, automaticSyncPaused: false, successfulProviders: [...new Set([...successful, ...connected])] }, current);
});

export const reserveManualSync = (userId: string): Promise<ManualSyncReservation> => serialize(async () => {
  const previous = await readPolicy(userId);
  const now = Date.now();
  if (previous.manualCooldownUntil > now) return { allowed: false, policy: previous };
  const attempts = previous.manualCooldownUntil > 0 ? [] : previous.manualAttempts.filter(timestamp => timestamp > now - MANUAL_SYNC_WINDOW_MS);
  if (attempts.length >= MANUAL_SYNC_LIMIT) {
    const manualCooldownUntil = Math.max(...attempts) + MANUAL_SYNC_WINDOW_MS;
    const policy = await writePolicy({ ...previous, manualAttempts: attempts, manualCooldownUntil });
    return { allowed: false, policy };
  }
  const manualAttempts = [...attempts, now];
  const manualCooldownUntil = manualAttempts.length === MANUAL_SYNC_LIMIT ? now + MANUAL_SYNC_WINDOW_MS : 0;
  const policy = await writePolicy({ ...previous, manualAttempts, manualCooldownUntil });
  return { allowed: true, policy };
});

export const clearSyncCache = (userId: string): Promise<RegistrarSyncPolicy> => serialize(async () => {
  const previous = await readPolicy(userId);
  return writePolicy({ ...previous, lastSyncedAt: 0, connectionsUpdated: ``, accountStatuses: {}, statuses: emptyStatuses(), successfulProviders: [] });
});
