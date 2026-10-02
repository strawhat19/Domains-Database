import { normalizeDomainName } from '../domainUtils';
import { WEBSITE_INSIGHTS_SOURCE, type WebsiteInsights } from './types';

const recordFrom = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const timestamp = (value: unknown) => typeof value === `string` && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const messagesFrom = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length > 10 || value.some(message => typeof message !== `string` || message.length > 300)) throw new Error(`Website Insights Returned An Invalid Result`);
  return value as string[];
};

export const normalizeWebsiteInsights = (value: unknown, expectedDomain?: string): WebsiteInsights => {
  const record = recordFrom(value);
  if (!record || typeof record.domain !== `string` || !timestamp(record.checkedAt) || record.source !== WEBSITE_INSIGHTS_SOURCE) throw new Error(`Website Insights Returned An Invalid Result`);
  const domain = normalizeDomainName(record.domain);
  if (expectedDomain && domain !== normalizeDomainName(expectedDomain)) throw new Error(`Website Insights Returned A Different Domain`);
  const result: WebsiteInsights = {
    domain,
    source: WEBSITE_INSIGHTS_SOURCE,
    checkedAt: record.checkedAt as string,
    errors: messagesFrom(record.errors),
    warnings: messagesFrom(record.warnings),
  };
  if (record.performance !== undefined) {
    const performance = recordFrom(record.performance);
    const score = performance?.score;
    if (!performance || typeof score !== `number` || !Number.isInteger(score) || score < 0 || score > 100
      || performance.strategy !== `mobile` || performance.source !== `Google PageSpeed Insights` || !timestamp(performance.checkedAt)) throw new Error(`Website Insights Returned An Invalid Performance Score`);
    result.performance = { score, strategy: `mobile`, source: `Google PageSpeed Insights`, checkedAt: performance.checkedAt as string };
  }
  if (record.trancoListed !== undefined) {
    if (typeof record.trancoListed !== `boolean` || !timestamp(record.trancoCheckedAt)) throw new Error(`Website Insights Returned An Invalid Rank`);
    result.trancoListed = record.trancoListed;
    result.trancoCheckedAt = record.trancoCheckedAt as string;
    if (record.trancoListed) {
      const rank = record.trancoRank;
      const date = record.trancoDate;
      if (typeof rank !== `number` || !Number.isSafeInteger(rank) || rank < 1 || rank > 1_000_000 || typeof date !== `string`
        || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error(`Website Insights Returned An Invalid Rank`);
      result.trancoRank = rank;
      result.trancoDate = date;
    }
  }
  return result;
};
