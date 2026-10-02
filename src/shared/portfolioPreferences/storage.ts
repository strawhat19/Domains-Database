import { Platform } from 'react-native';
import { useLocalStorage } from '../config';
import type { PortfolioPreferences } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREFERENCES_STORAGE_KEY = `domains-database:preferences:v1`;

export const readPortfolioPreferences = async () => {
  if (!useLocalStorage) return null;
  if (Platform.OS !== `web`) return AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
  return typeof window === `undefined` ? null : window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
};

export const savePortfolioPreferences = async (preferences: PortfolioPreferences) => {
  if (!useLocalStorage) return;
  const value = JSON.stringify(preferences);
  if (Platform.OS !== `web`) return AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, value);
  if (typeof window !== `undefined`) window.localStorage.setItem(PREFERENCES_STORAGE_KEY, value);
};
