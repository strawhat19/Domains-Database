import type { Registrar } from './types';
import { firebaseEnabled } from './firebase/config';

export const cubes = false;
export const useLocalStorage = !firebaseEnabled;
export const persistenceEnabled = useLocalStorage || firebaseEnabled;
export const useSampleData = false;
export const useStackPill = true;
export const PORTFOLIO_PREVIEW_LIMIT = 100;
export const PORTFOLIO_STORAGE_KEY = `domains-database:portfolio:v1`;
export const REGISTRARS: Registrar[] = [
  `Vercel`,
  `GoDaddy`,
  `Porkbun`,
  `NameSilo`,
  `Hostinger`,
  `Namecheap`,
  `Squarespace`,
  `GoDaddy Auctions`,
];
