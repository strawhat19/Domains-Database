export interface ExternalMarketListing {
  domain: string;
  currency: string | null;
  indicativeTotalCents: number | null;
}

export interface ExternalMarketResult {
  message?: string;
  listings: ExternalMarketListing[];
  status: `ready` | `unconfigured` | `unavailable` | `rate-limited`;
}

export const externalMarketPrice = ({ currency, indicativeTotalCents }: ExternalMarketListing) => {
  if (indicativeTotalCents === null || !currency) return null;
  return new Intl.NumberFormat(undefined, { style: `currency`, currency }).format(indicativeTotalCents / 100);
};
