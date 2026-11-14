import type { DomainAppraisal } from './types';

const isAmount = (value: unknown): value is number => typeof value === `number` && Number.isFinite(value) && value >= 0;
const isProbability = (value: unknown) => isAmount(value) && value <= 1;

export const hasRecentUnavailableAppraisal = (value: unknown, now = Date.now()) => {
  if (!value || typeof value !== `object` || !(`status` in value) || !(`checkedAt` in value) || typeof value.checkedAt !== `string`) return false;
  const checked = Date.parse(value.checkedAt);
  return checked <= now && checked > now - 30 * 86_400_000 && (value.status === `not-found` || value.status === `unsupported-tld`);
};

export const readDomainAppraisal = (value: unknown): DomainAppraisal | undefined => {
  if (!value || typeof value !== `object` || Array.isArray(value)) return undefined;
  const input = value as Partial<DomainAppraisal>;
  const { source, currency, checkedAt, amount, minPrice, maxPrice, listPrice, wholesalePrice, salesProbability, salesProbability500, salesProbabilityWholesale } = input;
  if (source !== `GoDaddy GoValue` || currency !== `USD` || typeof checkedAt !== `string` || !Number.isFinite(Date.parse(checkedAt))
    || !isAmount(amount) || ![minPrice, maxPrice, listPrice, wholesalePrice].every(price => price === undefined || isAmount(price))
    || ![salesProbability, salesProbability500, salesProbabilityWholesale].every(probability => probability === undefined || isProbability(probability))
    || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) return undefined;
  return { source, currency, checkedAt, amount, minPrice, maxPrice, listPrice, wholesalePrice, salesProbability, salesProbability500, salesProbabilityWholesale };
};
