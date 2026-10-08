export const DOMAIN_PRICE_FIELDS = [
  { field: `estimatedRevenue`, label: `Est. Revenue` },
  { field: `startingBid`, label: `Starting Bid` },
] as const;

export const normalizeDomainPrice = (value: unknown, label: string): number | undefined => {
  if (value == null || (typeof value === `string` && !value.trim())) return undefined;
  if (typeof value !== `number` || !Number.isFinite(value) || value < 0) {
    throw new Error(`Enter ${label} Of Zero Or More`);
  }
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || value !== cents / 100) {
    throw new Error(`Enter ${label} With Up To Two Decimal Places Within The Supported Range`);
  }
  return cents / 100;
};

export const restoreDomainPrice = (value: unknown): number | undefined => {
  try { return normalizeDomainPrice(value, `Price`); }
  catch { return undefined; }
};

export const formatPriceAmount = (value: number): string => new Intl.NumberFormat(`en-US`, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);
