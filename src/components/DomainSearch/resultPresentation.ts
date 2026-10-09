import type { DomainSearchResult, DomainSearchDomainResult } from '../../shared/domainSearch/types';

export type SearchResult = DomainSearchResult;
export type SearchDomainResult = DomainSearchDomainResult;
type SearchStatus = { label: string; state: `available` | `unavailable` | `unknown` | `error` | `pending` };

const getRegistrationQuote = (result: SearchResult) => {
  const price = result.registration;
  return price && Number.isFinite(price.amount) && price.amount >= 0 && /^(?:[a-z]{3})?$/i.test(price.currency) ? price : undefined;
};

const compareRegistrationPrices = (first: SearchResult, second: SearchResult) => {
  const firstPrice = getRegistrationQuote(first);
  const secondPrice = getRegistrationQuote(second);
  if (!firstPrice || !secondPrice) return Number(Boolean(secondPrice)) - Number(Boolean(firstPrice)) || first.label.localeCompare(second.label);
  const firstCurrency = firstPrice.currency.toUpperCase();
  const secondCurrency = secondPrice.currency.toUpperCase();
  if (firstCurrency !== secondCurrency) {
    return Number(!firstCurrency) - Number(!secondCurrency)
      || Number(secondCurrency === `USD`) - Number(firstCurrency === `USD`)
      || firstCurrency.localeCompare(secondCurrency);
  }
  return firstPrice.amount - secondPrice.amount || first.label.localeCompare(second.label);
};

export const getAvailableConnections = (result: SearchDomainResult) => result.connections.filter(connection => (
  connection.available === true && !connection.pending && !connection.error
)).sort(compareRegistrationPrices);

export const getSearchPriceOrder = (connections: SearchResult[]) => {
  const currencies = new Set(connections.flatMap(connection => {
    const price = getRegistrationQuote(connection);
    return price ? [price.currency.toUpperCase()] : [];
  }));
  return `${currencies.size > 1 ? `Grouped by currency · ` : ``}Registration price: low to high`;
};

export const getSearchStatus = (result: SearchResult): SearchStatus => {
  if (result.pending) return { label: `Checking…`, state: `pending` };
  if (result.error) return { label: `Check failed`, state: `error` };
  if (result.available === true) return { label: `Available`, state: `available` };
  if (result.available === false) return { label: `Unavailable`, state: `unavailable` };
  return { label: `Not confirmed`, state: `unknown` };
};

export const getDomainSearchStatus = (result: SearchDomainResult): SearchStatus & { summary: string } => {
  const statuses = result.connections.map(getSearchStatus);
  const total = statuses.length;
  const available = statuses.filter(status => status.state === `available`).length;
  const confirmed = statuses.filter(status => status.state === `available` || status.state === `unavailable`).length;
  const connections = total === 1 ? `connection` : `connections`;

  if (available) return { label: `Available`, state: `available`, summary: `Available at ${available} ${available === 1 ? `connection` : `connections`}` };
  if (statuses.some(status => status.state === `pending`)) return { label: `Checking…`, state: `pending`, summary: `${confirmed} of ${total} ${connections} confirmed` };
  if (total && confirmed === total) return { label: `Unavailable`, state: `unavailable`, summary: `Checked with ${total} ${connections}` };
  if (total && statuses.every(status => status.state === `error`)) return { label: `Check failed`, state: `error`, summary: `Could not check ${total} ${connections}` };
  return { label: `Not confirmed`, state: `unknown`, summary: `${confirmed} of ${total} ${connections} confirmed` };
};

export const formatSearchPrice = (price: SearchResult[`registration`]) => {
  if (!price || !Number.isFinite(price.amount) || price.amount < 0 || (price.currency && !/^[a-z]{3}$/i.test(price.currency))) {
    return { amount: `—`, term: `Price not provided`, currencyNote: `` };
  }
  const currency = price.currency.toUpperCase();
  let amount: string;
  try {
    amount = currency
      ? new Intl.NumberFormat(`en-US`, { currency, style: `currency`, currencyDisplay: `symbol` }).format(price.amount)
      : new Intl.NumberFormat(`en-US`, { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(price.amount);
  } catch {
    amount = `${currency === `USD` ? `$` : currency ? `${currency} ` : ``}${price.amount.toFixed(2)}`;
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
