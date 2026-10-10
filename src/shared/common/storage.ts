import { AppState, Platform } from 'react-native';
import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import { assertAccountDataWritable } from '../accountData/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readFirestoreStorage, writeFirestoreStorage, removeFirestoreStorage, getFirestoreStorageScope, subscribeFirestoreStorage } from '../firebase/storage';

const cloudAccount = (key: string) => firebaseEnabled && !useLocalStorage && Boolean(getFirestoreStorageScope(key));
const available = () => (useLocalStorage || firebaseEnabled) && (Platform.OS !== `web` || typeof window !== `undefined`);
interface StorageSubscriber {
  value?: string | null;
  next: (value: string | null) => boolean | void;
  error?: (error: Error) => void;
}
interface LocalSubscription { revision: number; subscribers: Set<StorageSubscriber> }
const localSubscriptions = new Map<string, LocalSubscription>();
let stopLocalObservers: (() => void) | undefined;
const notifyLocalStorage = (key: string, value: string | null) => {
  const state = localSubscriptions.get(key);
  if (!state) return;
  state.revision += 1;
  for (const subscriber of state.subscribers) {
    if (subscriber.value === value) continue;
    subscriber.value = value;
    try { subscriber.next(value); } catch { /* Keep storage observers independent. */ }
  }
};
const refreshLocalStorage = (key: string) => {
  const state = localSubscriptions.get(key);
  if (!state) return;
  const revision = ++state.revision;
  void (available() ? AsyncStorage.getItem(key) : Promise.resolve(null)).then(value => {
    if (localSubscriptions.get(key) === state && state.revision === revision) notifyLocalStorage(key, value);
  }).catch(failure => {
    if (localSubscriptions.get(key) !== state || state.revision !== revision) return;
    const error = failure instanceof Error ? failure : new Error(`Saved Data Could Not Be Read`);
    for (const subscriber of state.subscribers) subscriber.error?.(error);
  });
};
const observeLocalStorage = () => {
  if (stopLocalObservers) return;
  const refresh = () => { for (const key of localSubscriptions.keys()) refreshLocalStorage(key); };
  const changed = (event: StorageEvent) => {
    for (const key of localSubscriptions.keys()) {
      if (event.key === null || event.key === key || event.key === `@AsyncStorage:${key}`) refreshLocalStorage(key);
    }
  };
  const subscription = AppState.addEventListener(`change`, state => { if (state === `active`) refresh(); });
  if (typeof window !== `undefined`) {
    window.addEventListener(`focus`, refresh);
    window.addEventListener(`storage`, changed);
  }
  stopLocalObservers = () => {
    subscription.remove();
    if (typeof window !== `undefined`) {
      window.removeEventListener(`focus`, refresh);
      window.removeEventListener(`storage`, changed);
    }
    stopLocalObservers = undefined;
  };
};
export const subscribeStorage = (key: string, next: StorageSubscriber[`next`], error?: StorageSubscriber[`error`]): (() => void) => {
  if (cloudAccount(key)) {
    try { return subscribeFirestoreStorage(key, next, error); }
    catch (failure) {
      error?.(failure instanceof Error ? failure : new Error(`Cloud Storage Is Unavailable`));
      return () => {};
    }
  }
  let state = localSubscriptions.get(key);
  if (!state) {
    state = { revision: 0, subscribers: new Set() };
    localSubscriptions.set(key, state);
  }
  const subscriber: StorageSubscriber = { next, error };
  state.subscribers.add(subscriber);
  observeLocalStorage();
  refreshLocalStorage(key);
  return () => {
    state.subscribers.delete(subscriber);
    if (!state.subscribers.size) localSubscriptions.delete(key);
    if (!localSubscriptions.size) stopLocalObservers?.();
  };
};
export const readStorage = (key: string): Promise<string | null> => cloudAccount(key)
  ? readFirestoreStorage(key)
  : available() ? AsyncStorage.getItem(key) : Promise.resolve(null);
export const writeStorage = async (key: string, value: string): Promise<void> => {
  assertAccountDataWritable(key);
  if (cloudAccount(key)) await writeFirestoreStorage(key, value);
  else if (available()) { await AsyncStorage.setItem(key, value); notifyLocalStorage(key, value); }
};
export const writeAccountResetStorage = async (key: string, value: string): Promise<void> => {
  if (cloudAccount(key)) await writeFirestoreStorage(key, value, true);
  else if (available()) { await AsyncStorage.setItem(key, value); notifyLocalStorage(key, value); }
};
export const removeStorage = async (key: string): Promise<void> => {
  if (cloudAccount(key)) await removeFirestoreStorage(key);
  else if (available()) { await AsyncStorage.removeItem(key); notifyLocalStorage(key, null); }
};
export const createOperationQueue = (lockKey?: string) => {
  let queue: Promise<unknown> = Promise.resolve();
  return <T,>(operation: () => Promise<T>): Promise<T> => {
    const run = async (): Promise<T> => lockKey && Platform.OS === `web` && typeof navigator !== `undefined` && navigator.locks?.request
      ? await navigator.locks.request(lockKey, operation)
      : await operation();
    const result = queue.then(run, run);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
};
