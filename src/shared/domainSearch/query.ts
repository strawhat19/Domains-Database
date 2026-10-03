import { normalizeDomainName } from '../domainUtils';

export const DOMAIN_SEARCH_PAGE_SIZE = 12;

// Largest generic extensions (DNIB Q2 2026), then familiar country and technology choices.
export const popularExtensions = [
  `com`, `net`, `org`, `xyz`, `top`, `info`, `shop`, `online`, `store`, `vip`,
  `co`, `io`, `ai`, `app`, `dev`, `de`, `uk`, `co.uk`, `cn`, `nl`, `ru`, `us`,
  `ca`, `biz`, `me`, `site`, `tech`, `club`, `pro`, `tv`, `cc`, `live`, `cloud`, `website`, `space`,
];

export const normalizeDomainSearchQuery = (value: string) => {
  const candidate = value?.trim()?.toLowerCase();
  if (candidate && /^[^.\s/:?#@]+$/.test(candidate)) {
    return normalizeDomainName(`${candidate}.com`).slice(0, -4);
  }
  return normalizeDomainName(value);
};

export const sortDomainExtensions = (extensions: string[]) => {
  const ranks = new Map(popularExtensions.map((extension, index) => [extension, index]));
  return [...new Set(extensions)].sort((first, second) => {
    const rank = (ranks.get(first) ?? popularExtensions.length) - (ranks.get(second) ?? popularExtensions.length);
    return rank || first.localeCompare(second);
  });
};
