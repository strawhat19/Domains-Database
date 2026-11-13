import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const toastPlacements = [`top-left`, `top-right`, `bottom-left`, `bottom-right`] as const;
export type ToastPlacement = typeof toastPlacements[number];

const storageKey = `domains-database:toast-placement:v1`;
const defaultPlacement: ToastPlacement = `bottom-right`;
let placement: ToastPlacement = defaultPlacement;
let revision = 0;
let hydrationStarted = false;
let pendingWrite = Promise.resolve();
const listeners = new Set<() => void>();

const applyPlacement = (value: ToastPlacement) => {
  if (value === placement) return;
  placement = value;
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!hydrationStarted) {
    hydrationStarted = true;
    const initialRevision = revision;
    if (!initialRevision) void AsyncStorage.getItem(storageKey).then(saved => {
      const choice = toastPlacements.find(value => value === saved);
      if (choice && revision === initialRevision) applyPlacement(choice);
    }).catch(() => undefined);
  }
  return () => { listeners.delete(listener); };
};

const readPlacement = () => placement;
const readDefault = () => defaultPlacement;

export const useToastPlacement = () => useSyncExternalStore(subscribe, readPlacement, readDefault);

export const setToastPlacement = (value: ToastPlacement) => {
  revision += 1;
  applyPlacement(value);
  pendingWrite = pendingWrite.then(() => AsyncStorage.setItem(storageKey, value)).catch(() => undefined);
};
