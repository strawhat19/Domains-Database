import { marketCents } from './useDomainMarket';
import type { DomainRecord } from '../../shared/types';
import { getPortfolioColumnValue } from '../../shared/portfolioColumns';

export type SuggestedListingFields = { price: string; description: string };

export const getListingFields = (domain: DomainRecord) => {
  const value = getPortfolioColumnValue(domain, `estimatedValue`);
  const estimate = typeof value === `number` && Number.isFinite(value) && value >= 0 ? value : null;
  const savedCurrency = domain.currency?.trim().toUpperCase() || `USD`;
  const currency = /^[A-Z]{3}$/.test(savedCurrency) ? savedCurrency : `USD`;
  let price = ``;
  if (estimate !== null && savedCurrency === `USD`) {
    const amount = estimate.toFixed(2);
    try { marketCents(amount); price = amount; } catch { /* Leave amounts outside the listing range blank. */ }
  }
  const fields: SuggestedListingFields = { price, description: domain.description?.trim().slice(0, 2000) ?? `` };
  return { fields, currency, estimate };
};
