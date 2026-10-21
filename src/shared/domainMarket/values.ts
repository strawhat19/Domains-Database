import { analyticsDomainName } from '../domainAnalytics/values';

export const MARKET_RANGE = `today 12-m`;
export const MARKET_COUNTRIES = [
  { value: ``, label: `Worldwide` },
  { value: `US`, label: `United States` },
  { value: `GB`, label: `United Kingdom` },
  { value: `CA`, label: `Canada` },
  { value: `AU`, label: `Australia` },
  { value: `IN`, label: `India` },
] as const;

export const normalizeMarketDomain = (value: unknown) => {
  if (typeof value !== `string`) throw new Error(`Enter A Valid Domain Name`);
  return analyticsDomainName(value);
};

export const normalizeMarketCountry = (value: unknown) => {
  if (typeof value !== `string`) throw new Error(`Choose A Supported Country`);
  const country = value.trim().toUpperCase();
  if (!MARKET_COUNTRIES.some(option => option.value === country)) throw new Error(`Choose A Supported Country`);
  return country;
};

export const normalizeMarketKeyword = (value: unknown) => {
  if (typeof value !== `string` || /[,\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Enter One Search Phrase Without Commas Or Control Characters`);
  }
  const keyword = value.trim().replace(/\s+/g, ` `);
  if (!keyword || keyword.length > 80) throw new Error(`Enter A Search Phrase From 1 To 80 Characters`);
  return keyword;
};

export const defaultMarketKeyword = (value: string) => normalizeMarketDomain(value)
  .split(`.`)[0].replace(/[\d-]+/g, ` `).trim().replace(/\s+/g, ` `);
