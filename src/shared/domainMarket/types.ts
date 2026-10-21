export type MarketStatus = `ready` | `unconfigured` | `unavailable` | `quota` | `insufficient`;

export interface DomainRatingResult {
  domain: string;
  status: MarketStatus;
  source: `Ahrefs`;
  checkedAt: string;
  rating?: number;
  message?: string;
  expiresAt?: string;
}

export interface SearchInterestInput {
  domain: string;
  keyword: string;
  country: string;
}

export interface SearchInterestPoint {
  date: string;
  value: number;
  timestamp: number;
}

export interface SearchInterestResult extends SearchInterestInput {
  status: MarketStatus;
  range: `today 12-m`;
  checkedAt: string;
  message?: string;
  expiresAt?: string;
  source: `Google Trends via SerpApi`;
  points: SearchInterestPoint[];
}
