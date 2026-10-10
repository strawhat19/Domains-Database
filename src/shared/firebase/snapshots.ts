import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseDb, getFirebaseAuth } from './client';
import { getAppCollectionIDNumber } from '../common/ids';
import { collection, onSnapshot, onSnapshotsInSync, type DocumentData } from 'firebase/firestore';

export interface StorageScope { key: string; userId: string }
export interface SavedValue { revision: number; value: string | null; firebaseUid: string }
export interface SplitSnapshot { name: string; field: string; collection: string; type: string }
interface Subscriber { next: (value: string | null) => boolean | void; error?: (error: Error) => void; value?: string | null }
interface PendingRead { resolve: (value: SavedValue) => void; reject: (error: Error) => void }
interface StorageSnapshot {
  scope: StorageScope;
  value?: SavedValue;
  committed?: SavedValue;
  error?: Error;
  reads: Set<PendingRead>;
  subscribers: Set<Subscriber>;
}
interface CollectionSnapshot {
  ready: boolean;
  pending: boolean;
  retryAt: number;
  error?: Error;
  stop: () => void;
  records: Map<string, DocumentData>;
}
interface AccountSnapshot {
  uid: string;
  stop: () => void;
  storage: Map<string, StorageSnapshot>;
  collections: Map<string, CollectionSnapshot>;
}

export const splitSnapshots: Record<string, SplitSnapshot> = {
  [`domains-database:portfolio:v1`]: { name: `portfolio`, field: `domains`, collection: `domains`, type: `Domain` },
  [`domains-database:connections:v1`]: { name: `connections`, field: `accounts`, collection: `connections`, type: `Connection` },
  [`domains-database:auction-inventory:v1`]: { name: `auctionInventory`, field: `records`, collection: `auctionInventory`, type: `Auction` },
};
const accounts = new Map<string, AccountSnapshot>();
export const storageWriteBaselines = new Map<string, SavedValue>();
export const storageSubscribedBaselines = new Map<string, SavedValue>();
let observingAuth = false;
const unreadable = () => new Error(`Saved Cloud Data Could Not Be Read`);
const isRecord = (value: unknown): value is DocumentData => Boolean(value) && typeof value === `object` && !Array.isArray(value);
const revisionOf = (record?: DocumentData) => {
  if (!record) return 0;
  if (!Number.isSafeInteger(record.revision) || record.revision < 1) throw unreadable();
  return record.revision as number;
};
const reportError = (state: StorageSnapshot, error: Error) => {
  if (state.error?.message === error.message) return;
  state.error = error;
  for (const read of state.reads) read.reject(error);
  state.reads.clear();
  for (const subscriber of state.subscribers) {
    subscriber.value = undefined;
    try { subscriber.error?.(error); } catch { /* One subscriber cannot interrupt other consumers. */ }
  }
};
const deliver = (state: StorageSnapshot, value: SavedValue) => {
  state.error = undefined;
  state.value = value;
  for (const read of state.reads) read.resolve(value);
  state.reads.clear();
  for (const subscriber of state.subscribers) {
    const key = `${state.scope.key}:user:${state.scope.userId}`;
    if (subscriber.value === value.value) {
      if (storageSubscribedBaselines.get(key)?.value === value.value) storageSubscribedBaselines.set(key, value);
      continue;
    }
    subscriber.value = value.value;
    try {
      if (subscriber.next(value.value) !== false) storageSubscribedBaselines.set(key, value);
    } catch { /* One subscriber cannot interrupt other consumers. */ }
  }
};
const compose = (account: AccountSnapshot, state: StorageSnapshot): SavedValue | undefined => {
  const split = splitSnapshots[state.scope.key];
  const names = split ? [`snapshots`, split.collection] : [`data`, `storageKeys`];
  const sources = names.map(name => account.collections.get(name));
  const failure = sources.find(source => source?.error)?.error;
  if (failure) throw failure;
  if (sources.some(source => !source?.ready || source.pending)) return;
  const [metadata, records] = sources as CollectionSnapshot[];
  if (split) {
    const record = metadata.records.get(split.name);
    if (!record) return { value: null, revision: 0, firebaseUid: account.uid };
    const revision = revisionOf(record);
    if (!isRecord(record.snapshot) || !Array.isArray(record.ids)
      || new Set(record.ids).size !== record.ids.length
      || record.ids.some((id: unknown) => typeof id !== `string` || getAppCollectionIDNumber(id, split.type) < 1)) throw unreadable();
    if (!Number.isSafeInteger(record.snapshot.nextNumber) || record.snapshot.nextNumber < 1) throw unreadable();
    const indexed = new Set<string>(record.ids);
    const ids = [...record.ids.filter((id: string) => records.records.has(id)), ...[...records.records.keys()].filter(id => !indexed.has(id))];
    const values = ids.map((id: string) => {
      const value = records.records.get(id);
      if (!value || value.id !== id || getAppCollectionIDNumber(id, split.type) < 1
        || value.number !== getAppCollectionIDNumber(id, split.type)) throw unreadable();
      return value;
    });
    const nextNumber = values.reduce((next, value) => Math.max(next, value.number + 1), record.snapshot.nextNumber as number);
    return { revision, firebaseUid: account.uid, value: JSON.stringify({ ...record.snapshot, nextNumber, [split.field]: values }) };
  }
  const index = records.records.get(encodeURIComponent(state.scope.key));
  if (!index) return { value: null, revision: 0, firebaseUid: account.uid };
  if (typeof index.id !== `string` || getAppCollectionIDNumber(index.id, `Data`) !== index.number) throw unreadable();
  const record = metadata.records.get(index.id);
  if (!record || record.id !== index.id || record.key !== state.scope.key || typeof record.value !== `string`) throw unreadable();
  return { value: record.value, revision: revisionOf(record), firebaseUid: account.uid };
};
const flush = (userId: string, account: AccountSnapshot) => {
  if (accounts.get(userId) !== account || getFirebaseAuth().currentUser?.uid !== account.uid) return;
  for (const state of account.storage.values()) {
    try {
      const value = compose(account, state);
      if (!value) continue;
      if (state.committed) {
        if (state.committed.value === null ? value.value !== null : value.revision < state.committed.revision) continue;
        state.committed = undefined;
      }
      deliver(state, value);
    } catch (failure) { reportError(state, failure instanceof Error ? failure : unreadable()); }
  }
};
export const clearCloudSnapshots = () => {
  storageWriteBaselines.clear();
  storageSubscribedBaselines.clear();
  for (const account of accounts.values()) {
    account.stop();
    for (const source of account.collections.values()) source.stop();
    for (const state of account.storage.values()) {
      reportError(state, new Error(`Your Account Changed — Try Again`));
      state.subscribers.clear();
    }
  }
  accounts.clear();
};
const observeAuth = () => {
  if (observingAuth) return;
  observingAuth = true;
  onAuthStateChanged(getFirebaseAuth(), user => {
    if ([...accounts.values()].some(account => account.uid !== user?.uid)) clearCloudSnapshots();
  });
};
const watchCollection = (userId: string, account: AccountSnapshot, name: string) => {
  const previous = account.collections.get(name);
  if (previous && (!previous.error || Date.now() < previous.retryAt)) return;
  previous?.stop();
  const source: CollectionSnapshot = { ready: false, pending: false, retryAt: 0, records: new Map(), stop: () => {} };
  account.collections.set(name, source);
  source.stop = onSnapshot(collection(getFirebaseDb(), `users`, userId, name), { includeMetadataChanges: true }, snapshot => {
    if (accounts.get(userId) !== account) return;
    source.pending = snapshot.metadata.hasPendingWrites;
    if (snapshot.metadata.fromCache || source.pending) return;
    source.error = undefined;
    source.ready = true;
    source.records = new Map(snapshot.docs.map(record => [record.id, record.data()]));
  }, failure => {
    source.error = failure;
    source.retryAt = Date.now() + 60_000;
    flush(userId, account);
  });
};
const getStorageSnapshot = (scope: StorageScope) => {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error(`Sign In To Access Your Saved Data`);
  observeAuth();
  let account = accounts.get(scope.userId);
  if (account && account.uid !== uid) { clearCloudSnapshots(); account = undefined; }
  if (!account) {
    account = { uid, storage: new Map(), collections: new Map(), stop: () => {} };
    accounts.set(scope.userId, account);
    const current = account;
    // Publish after every listener affected by a commit has received its snapshot.
    account.stop = onSnapshotsInSync(getFirebaseDb(), () => flush(scope.userId, current));
  }
  let state = account.storage.get(scope.key);
  if (!state) {
    state = { scope, reads: new Set(), subscribers: new Set() };
    account.storage.set(scope.key, state);
  }
  const split = splitSnapshots[scope.key];
  const names = split ? [`snapshots`, split.collection] : [`data`, `storageKeys`];
  for (const name of names) watchCollection(scope.userId, account, name);
  if (state.error && names.every(name => !account?.collections.get(name)?.error)) state.error = undefined;
  flush(scope.userId, account);
  return state;
};
export const readCloudSnapshot = (scope: StorageScope): Promise<SavedValue> => {
  const state = getStorageSnapshot(scope);
  if (state.error) return Promise.reject(state.error);
  if (state.value) return Promise.resolve(state.value);
  return new Promise((resolve, reject) => { state.reads.add({ resolve, reject }); });
};
export const subscribeCloudSnapshot = (scope: StorageScope, next: Subscriber[`next`], error?: Subscriber[`error`]) => {
  const state = getStorageSnapshot(scope);
  const subscriber: Subscriber = { next, error };
  state.subscribers.add(subscriber);
  if (state.error) error?.(state.error);
  else if (state.value) {
    subscriber.value = state.value.value;
    if (next(state.value.value) !== false) storageSubscribedBaselines.set(`${scope.key}:user:${scope.userId}`, state.value);
  }
  return () => { state.subscribers.delete(subscriber); };
};
export const publishCloudSnapshot = (scope: StorageScope, value: SavedValue) => {
  const account = accounts.get(scope.userId);
  const state = account?.storage.get(scope.key);
  if (!state || account?.uid !== value.firebaseUid) return;
  if (value.value !== null && (state.value?.revision ?? 0) > value.revision) return;
  let current: SavedValue | undefined;
  try { current = account ? compose(account, state) : undefined; }
  catch { /* A confirmed save can precede recovery of the collection listener. */ }
  state.committed = current?.revision === value.revision && current?.value === value.value ? undefined : value;
  storageSubscribedBaselines.set(`${scope.key}:user:${scope.userId}`, value);
  deliver(state, value);
};
