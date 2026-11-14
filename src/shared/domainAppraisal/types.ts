export interface DomainAppraisal {
  amount: number;
  currency: `USD`;
  minPrice?: number;
  maxPrice?: number;
  listPrice?: number;
  checkedAt: string;
  dailyUsage?: number;
  maxDailyUsage?: number;
  wholesalePrice?: number;
  source: `GoDaddy GoValue`;
  salesProbability?: number;
  salesProbability500?: number;
  salesProbabilityWholesale?: number;
}

export const appraisalFailureStatuses = [`connection-required`, `access-required`, `unsupported-tld`, `not-found`, `rate-limited`, `unavailable`] as const;

export type DomainAppraisalResult = { status: `available`; appraisal: DomainAppraisal } | {
  message: string;
  retryAt?: string;
  status: typeof appraisalFailureStatuses[number];
};
