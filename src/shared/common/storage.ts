import { Platform } from 'react-native';
import { useLocalStorage } from '../config';
import { assertAccountDataWritable } from '../accountData/state';
import AsyncStorage from '@react-native-async-storage/async-storage';

const available = () => useLocalStorage && (Platform.OS !== `web` || typeof window !== `undefined`);
export const readStorage = (key: string): Promise<string | null> => available() ? AsyncStorage.getItem(key) : Promise.resolve(null);
export const writeStorage = async (key: string, value: string): Promise<void> => {
  assertAccountDataWritable(key);
  if (available()) await AsyncStorage.setItem(key, value);
};
export const writeAccountResetStorage = (key: string, value: string): Promise<void> => available() ? AsyncStorage.setItem(key, value) : Promise.resolve();
export const removeStorage = (key: string): Promise<void> => available() ? AsyncStorage.removeItem(key) : Promise.resolve();
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
