import type { Registrar } from './types';

export const useLocalStorage = true;
export const useSampleData = false;
export const PORTFOLIO_STORAGE_KEY = `domains-database:portfolio:v1`;
export const REGISTRARS: Registrar[] = [
  `GoDaddy`,
  `Porkbun`,
  `NameSilo`,
  `Hostinger`,
  `Namecheap`,
  `Squarespace`,
  `GoDaddy Auctions`,
];
