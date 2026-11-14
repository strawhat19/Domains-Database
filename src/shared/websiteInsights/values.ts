import { normalizeDomainName } from '../domainUtils';
import { MAX_TRANCO_HISTORY, WEBSITE_INSIGHTS_SOURCE, type TrancoRank, type WebsiteInsights } from './types';

const reservedSuffixes = new Set([`local`, `localhost`, `internal`, `home`, `lan`, `test`, `invalid`, `example`, `onion`, `arpa`]);
const reservedExamples = [`example.com`, `example.org`, `example.net`];

export const getWebsiteInsightDomain = (value: unknown) => {
  if (typeof value !== `string` || value.length > 253) return undefined;
  try {
    const domain = normalizeDomainName(value);
    if (value.trim().toLowerCase() !== domain || reservedSuffixes.has(domain.split(`.`).at(-1) ?? ``)
      || reservedExamples.some(name => domain === name || domain.endsWith(`.${name}`))) return undefined;
    return domain;
  } catch { return undefined; }
};

const recordFrom = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const timestamp = (value: unknown) => typeof value === `string` && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
export const isTrancoDate = (value: unknown): value is string => typeof value === `string` && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const isTrancoRank = (value: unknown): value is number => typeof value === `number` && Number.isSafeInteger(value) && value >= 1 && value <= 1_000_000;
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
      if (!isTrancoRank(rank) || !isTrancoDate(date)) throw new Error(`Website Insights Returned An Invalid Rank`);
      result.trancoRank = rank;
      result.trancoDate = date;
    }
    if (record.trancoHistory !== undefined) {
      if (!Array.isArray(record.trancoHistory) || record.trancoHistory.length > MAX_TRANCO_HISTORY) throw new Error(`Website Insights Returned Invalid Rank History`);
      const history = record.trancoHistory.map((value: unknown): TrancoRank => {
        const entry = recordFrom(value);
        if (!isTrancoDate(entry?.date) || (entry.rank !== null && !isTrancoRank(entry.rank))) throw new Error(`Website Insights Returned Invalid Rank History`);
        return { date: entry.date, rank: entry.rank };
      }).sort((first, second) => second.date.localeCompare(first.date));
      if (history.length && (new Set(history.map(entry => entry.date)).size !== history.length
        || history[0]?.rank !== (result.trancoRank ?? null) || (result.trancoDate && history[0]?.date !== result.trancoDate))) {
        throw new Error(`Website Insights Returned Inconsistent Rank History`);
      }
      result.trancoHistory = history;
    }
  }
  return result;
};

export const mergeWebsiteInsights = (incoming: WebsiteInsights, stored: unknown): WebsiteInsights => {
  if (!stored) return incoming;
  let previous: WebsiteInsights;
  try { previous = normalizeWebsiteInsights(stored, incoming.domain); }
  catch { return incoming; }
  const useIncomingRank = Boolean(incoming.trancoCheckedAt && (!previous.trancoCheckedAt || Date.parse(incoming.trancoCheckedAt) >= Date.parse(previous.trancoCheckedAt)));
  const useIncomingPerformance = Boolean(incoming.performance && (!previous.performance || Date.parse(incoming.performance.checkedAt) >= Date.parse(previous.performance.checkedAt)));
  const rank = useIncomingRank ? incoming : previous;
  const latest = Date.parse(incoming.checkedAt) >= Date.parse(previous.checkedAt) ? incoming : previous;
  return {
    ...latest,
    trancoRank: rank.trancoRank,
    trancoDate: rank.trancoDate,
    trancoListed: rank.trancoListed,
    trancoCheckedAt: rank.trancoCheckedAt,
    trancoHistory: rank.trancoHistory,
    performance: (useIncomingPerformance ? incoming : previous).performance,
  };
};
