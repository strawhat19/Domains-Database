export interface DomainAppraisal {
  amount: number;
  currency: `USD`;
  minPrice?: number;
  maxPrice?: number;
  listPrice?: number;
  checkedAt: string;
  wholesalePrice?: number;
  source: `GoDaddy GoValue`;
}

export const appraisalFailureStatuses = [`connection-required`, `access-required`, `unsupported-tld`, `not-found`, `rate-limited`, `unavailable`] as const;

export type DomainAppraisalResult = { status: `available`; appraisal: DomainAppraisal } | {
  message: string;
  retryAt?: string;
  status: typeof appraisalFailureStatuses[number];
};
