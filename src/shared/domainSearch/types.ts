import { connectionFields, type ConnectionProvider } from '../connections/types';

export type DomainSearchProvider = Exclude<ConnectionProvider, `squarespace`>;
type DomainSearchField = Extract<typeof connectionFields[number], { search: true }>;

export const domainSearchFields = connectionFields.filter((field): field is DomainSearchField => field.search);

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
  pending?: boolean;
  available?: boolean;
  purchaseUrl: string;
  retryAfterMs?: number;
  provider: DomainSearchProvider;
  renewal?: DomainSearchPrice;
  registration?: DomainSearchPrice;
}

export interface DomainSearchDomainResult {
  domain: string;
  connections: DomainSearchResult[];
}

export interface DomainSearchVariants {
  note?: string;
  query: string;
  domains: string[];
  connectionsUpdated: string;
}

export interface DomainSearchResults {
  searchedAt: string;
  connectionsUpdated: string;
  results: DomainSearchDomainResult[];
}

export const registrarPurchaseUrl = (provider: DomainSearchProvider, domain: string) => {
  const name = encodeURIComponent(domain);
  const links: Record<DomainSearchProvider, string> = {
    vercel: `https://vercel.com/domains`,
    porkbun: `https://porkbun.com/checkout/search?q=${name}`,
    hostinger: `https://www.hostinger.com/domain-name-search`,
    namesilo: `https://www.namesilo.com/domain/search-domains?query=${name}`,
    godaddy: `https://www.godaddy.com/domainsearch/find?domainToCheck=${name}`,
    namecheap: `https://www.namecheap.com/domains/registration/results/?domain=${name}`,
  };
  return links[provider];
};
