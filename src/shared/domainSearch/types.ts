import type { ConnectionProvider } from '../connections/types';

export interface DomainSearchPrice {
  years?: number;
  amount: number;
  currency: string;
}

export interface DomainSearchResult {
  note?: string;
  error?: string;
  label: string;
  domain: string;
  available?: boolean;
  purchaseUrl: string;
  provider: ConnectionProvider;
  renewal?: DomainSearchPrice;
  registration?: DomainSearchPrice;
}

export interface DomainSearchResults {
  searchedAt: string;
  results: DomainSearchResult[];
}

export const registrarPurchaseUrl = (provider: ConnectionProvider, domain: string) => {
  const name = encodeURIComponent(domain);
  const links: Record<ConnectionProvider, string> = {
    porkbun: `https://porkbun.com/checkout/search?q=${name}`,
    hostinger: `https://www.hostinger.com/domain-name-search`,
    namesilo: `https://www.namesilo.com/domain/search-domains?query=${name}`,
    godaddy: `https://www.godaddy.com/domainsearch/find?domainToCheck=${name}`,
    namecheap: `https://www.namecheap.com/domains/registration/results/?domain=${name}`,
  };
  return links[provider];
};
