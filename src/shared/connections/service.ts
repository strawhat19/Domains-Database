import { authAPI } from '../../api/auth';
import { firebaseEnabled } from '../firebase/config';
import { genID, isAppCollectionID } from '../common/ids';
import { CONNECTIONS_STORAGE_KEY } from '../accountData/keys';
import { useLocalStorage, persistenceEnabled } from '../config';
import { accountStorageKey } from '../authentication/userScope';
import { requestEnvironmentConnectionsImport } from './environment';
import { readStorage, writeStorage, subscribeStorage, createOperationQueue } from '../common/storage';
import { connectionValues, normalizeConnections, normalizeConnectionAccounts } from './values';
import { EMPTY_CONNECTIONS, connectionFields, type ConnectionValues, type ConnectionAccount, type ConnectionSnapshot, type ConnectionProvider, type EnvironmentImportResult } from './types';

export { CONNECTIONS_STORAGE_KEY } from '../accountData/keys';
const listeners = new Set<(userId: string) => void>();
const serialize = createOperationQueue(CONNECTIONS_STORAGE_KEY);
export const subscribeConnections = (listener: (userId: string) => void, userId?: string, onError?: (error: Error) => void) => {
  if (userId && firebaseEnabled && !useLocalStorage) {
    return subscribeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId), () => listener(userId), onError);
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const notifyConnections = (userId: string) => {
  for (const listener of listeners) {
    try { listener(userId); } catch { /* Saved connections are independent of subscribers. */ }
  }
};
const sessionUser = async (expectedUserId?: string) => {
  if (!persistenceEnabled) throw new Error(`Connect A Backend To Save Connections`);
  const session = await authAPI.restoreSession();
  const userId = session?.user.id;
  if (!userId || (expectedUserId && userId !== expectedUserId)) throw new Error(`Sign In To Manage Connections`);
  return userId;
};
const emptySnapshot = (userId: string): ConnectionSnapshot => ({
  userId, version: 2, updated: ``, nextNumber: 1, accounts: [], values: { ...EMPTY_CONNECTIONS },
});
const storedSnapshot = ({ values: _values, ...snapshot }: ConnectionSnapshot) => JSON.stringify(snapshot);
const readConnections = async (userId: string): Promise<ConnectionSnapshot> => {
  const saved = await readStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId));
  if (!saved) return emptySnapshot(userId);
  try {
    const snapshot = JSON.parse(saved) as ConnectionSnapshot | (Omit<ConnectionSnapshot, `version` | `accounts` | `nextNumber`> & { version: 1 });
    if (snapshot?.userId !== userId || typeof snapshot.updated !== `string`) throw new Error();
    if (snapshot.version === 1) {
      const values = normalizeConnections(snapshot.values);
      const accounts = connectionFields.filter(field => values[field.id]).map((field, index) => {
        const number = index + 1;
        return { number, provider: field.id, values: values[field.id], id: genID(`Connection`, number, field.label).id };
      });
      const migrated: ConnectionSnapshot = { ...emptySnapshot(userId), updated: snapshot.updated, nextNumber: accounts.length + 1, accounts, values };
      await sessionUser(userId);
      await writeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId), storedSnapshot(migrated));
      return migrated;
    }
    if (snapshot.version !== 2 || !Array.isArray(snapshot.accounts)
      || !Number.isSafeInteger(snapshot.nextNumber) || snapshot.nextNumber < 1) throw new Error();
    const accounts = normalizeConnectionAccounts(snapshot.accounts);
    const numbers = new Set<number>();
    if (accounts.length !== snapshot.accounts.length || accounts.some(account => {
      const duplicate = numbers.has(account.number);
      numbers.add(account.number);
      return duplicate || account.number < 1 || account.number >= snapshot.nextNumber
        || !isAppCollectionID(account.id, `Connection`) || !account.id.startsWith(`Connection_${account.number}_`);
    })) throw new Error();
    return { userId, version: 2, updated: snapshot.updated, nextNumber: snapshot.nextNumber, accounts, values: connectionValues(accounts) };
  } catch {
    throw new Error(`Saved Connections Could Not Be Read`);
  }
};

export const getConnections = (expectedUserId?: string): Promise<ConnectionSnapshot> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  const snapshot = await readConnections(userId);
  await sessionUser(userId);
  return snapshot;
});

export const importEnvironmentConnections = (providers?: readonly ConnectionProvider[], expectedUserId?: string, signal?: AbortSignal): Promise<EnvironmentImportResult> => serialize(async () => {
  if (useLocalStorage) throw new Error(`Connect Firebase To Import Server Connections`);
  const session = await authAPI.restoreSession();
  const user = session?.user;
  if (!user?.id || !user.active || !user.firebase_uid || (expectedUserId && user.id !== expectedUserId)) throw new Error(`Sign In To Import Connections`);
  const result = await requestEnvironmentConnectionsImport(user.id, user.firebase_uid, providers, signal);
  await sessionUser(user.id);
  return result;
});

export const saveConnections = (input: ConnectionValues | readonly ConnectionAccount[], expectedUserId?: string): Promise<ConnectionSnapshot> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  const previous = await readConnections(userId);
  const source = Array.isArray(input) ? input : connectionFields.map(field => {
    const existing = previous.accounts.find(account => account.provider === field.id);
    return { provider: field.id, values: (input as ConnectionValues)[field.id], id: existing?.id ?? `draft-${field.id}`, number: existing?.number ?? 0 };
  });
  let nextNumber = previous.nextNumber;
  const accounts = normalizeConnectionAccounts(source).map(account => {
    const existing = previous.accounts.find(value => value.id === account.id);
    if (existing) return { ...account, number: existing.number };
    const number = nextNumber++;
    const label = connectionFields.find(field => field.id === account.provider)?.label ?? account.provider;
    return { ...account, number, id: genID(`Connection`, number, label).id };
  });
  const snapshot: ConnectionSnapshot = { userId, version: 2, nextNumber, accounts, updated: new Date().toISOString(), values: connectionValues(accounts) };
  await sessionUser(userId);
  await writeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId), storedSnapshot(snapshot));
  notifyConnections(userId);
  return snapshot;
});

export const clearConnections = (expectedUserId?: string): Promise<void> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  const previous = await readConnections(userId);
  const snapshot = { ...emptySnapshot(userId), nextNumber: previous.nextNumber, updated: new Date().toISOString() };
  await sessionUser(userId);
  await writeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId), storedSnapshot(snapshot));
  notifyConnections(userId);
});
