import { authAPI } from '../../api/auth';
import { useLocalStorage } from '../config';
import { normalizeConnections } from './values';
import { accountStorageKey } from '../authentication/userScope';
import { EMPTY_CONNECTIONS, type ConnectionValues, type ConnectionSnapshot } from './types';
import { readStorage, writeStorage, removeStorage, createOperationQueue } from '../common/storage';

export const CONNECTIONS_STORAGE_KEY = `domains-database:connections:v1`;
const listeners = new Set<(userId: string) => void>();
const serialize = createOperationQueue(CONNECTIONS_STORAGE_KEY);
export const subscribeConnections = (listener: (userId: string) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const notifyConnections = (userId: string) => {
  for (const listener of listeners) {
    try { listener(userId); } catch { /* Saved connections are independent of subscribers. */ }
  }
};
const sessionUser = async (expectedUserId?: string) => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Save Connections`);
  const session = await authAPI.restoreSession();
  const userId = session?.user.id;
  if (!userId || (expectedUserId && userId !== expectedUserId)) throw new Error(`Sign In To Manage Connections`);
  return userId;
};

export const getConnections = (expectedUserId?: string): Promise<ConnectionSnapshot> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  const saved = await readStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId));
  if (!saved) return { userId, version: 1, updated: ``, values: { ...EMPTY_CONNECTIONS } };
  try {
    const snapshot = JSON.parse(saved) as ConnectionSnapshot;
    if (snapshot?.version !== 1 || snapshot.userId !== userId || typeof snapshot.updated !== `string`) throw new Error();
    return { userId, version: 1, updated: snapshot.updated, values: normalizeConnections(snapshot.values) };
  } catch {
    throw new Error(`Saved Connections Could Not Be Read`);
  }
});

export const saveConnections = (values: ConnectionValues, expectedUserId?: string): Promise<ConnectionSnapshot> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  const snapshot: ConnectionSnapshot = { userId, version: 1, updated: new Date().toISOString(), values: normalizeConnections(values) };
  await writeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId), JSON.stringify(snapshot));
  notifyConnections(userId);
  return snapshot;
});

export const clearConnections = (expectedUserId?: string): Promise<void> => serialize(async () => {
  const userId = await sessionUser(expectedUserId);
  await removeStorage(accountStorageKey(CONNECTIONS_STORAGE_KEY, userId));
  notifyConnections(userId);
});
