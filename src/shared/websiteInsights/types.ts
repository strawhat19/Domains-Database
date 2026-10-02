export const WEBSITE_INSIGHTS_SOURCE = `Google PageSpeed Insights / Tranco`;
export const MAX_INSIGHT_DOMAINS = 10;

export interface WebsiteInsights {
  domain: string;
  checkedAt: string;
  errors: string[];
  warnings: string[];
  source: typeof WEBSITE_INSIGHTS_SOURCE;
  trancoRank?: number;
  trancoDate?: string;
  trancoListed?: boolean;
  trancoCheckedAt?: string;
  performance?: {
    score: number;
    checkedAt: string;
    strategy: `mobile`;
    source: `Google PageSpeed Insights`;
  };
}
