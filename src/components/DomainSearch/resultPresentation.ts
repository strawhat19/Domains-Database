import type { DomainSearchResults } from '../../shared/domainSearch/types';

export type SearchResult = DomainSearchResults[`results`][number];

export const formatSearchPrice = (price: SearchResult[`registration`]) => {
  if (!price || !Number.isFinite(price.amount) || price.amount < 0 || (price.currency && !/^[a-z]{3}$/i.test(price.currency))) {
    return { amount: `—`, term: `Price not provided`, currencyNote: `` };
  }
  const currency = price.currency.toUpperCase();
  let amount: string;
  try {
    amount = currency
      ? new Intl.NumberFormat(`en-US`, { currency, style: `currency`, currencyDisplay: `code` }).format(price.amount)
      : new Intl.NumberFormat(`en-US`, { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(price.amount);
  } catch {
    amount = `${currency ? `${currency} ` : ``}${price.amount.toFixed(2)}`;
  }
  const years = price.years;
  const term = years && Number.isInteger(years) && years > 0 ? `${years} ${years === 1 ? `year` : `years`}` : `Term not provided`;
  return { amount, term, currencyNote: currency ? `` : `Currency Not Supplied` };
};

export const getPurchaseHref = (value: string): `https://${string}` | null => {
  try {
    const url = new URL(value);
    if (url.protocol !== `https:` || url.username || url.password || url.port) return null;
    return url.toString() as `https://${string}`;
  } catch {
    return null;
  }
};
