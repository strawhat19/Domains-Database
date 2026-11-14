import { requirePublicDomain } from './validation';
import { setTimeout as wait } from 'node:timers/promises';
import { requestInsightsJson, WebsiteInsightsError } from './request';
import { getWebsiteInsightDomain, isTrancoDate } from '../../shared/websiteInsights/values';
import { MAX_INSIGHT_DOMAINS, MAX_TRANCO_HISTORY, WEBSITE_INSIGHTS_SOURCE, type WebsiteInsights } from '../../shared/websiteInsights/types';

const recordFrom = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const notListedWarning = `Not Listed In The Returned Tranco Rankings — Visitor Counts Are Unknown`;
let nextTrancoRequest = 0;

const getPerformance = async (domain: string, signal: AbortSignal): Promise<NonNullable<WebsiteInsights[`performance`]>> => {
  const url = new URL(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`);
  url.searchParams.set(`url`, `https://${domain}/`);
  url.searchParams.set(`strategy`, `mobile`);
  url.searchParams.set(`category`, `performance`);
  url.searchParams.set(`fields`, `lighthouseResult(categories/performance/score,runtimeError/code,fetchTime)`);
  const result = recordFrom(await requestInsightsJson(url, signal, 75_000, 128_000));
  const lighthouse = recordFrom(result?.lighthouseResult);
  const category = recordFrom(recordFrom(lighthouse?.categories)?.performance);
  const score = category?.score;
  if (lighthouse?.runtimeError || typeof score !== `number` || !Number.isFinite(score) || score < 0 || score > 1) throw new WebsiteInsightsError(502, `PageSpeed Could Not Analyze This Website`);
  return { strategy: `mobile`, score: Math.round(score * 100), source: `Google PageSpeed Insights`, checkedAt: new Date().toISOString() };
};

const getTranco = async (domain: string, signal: AbortSignal, batch = false) => {
  while (Date.now() < nextTrancoRequest) {
    if (!batch) throw new WebsiteInsightsError(429, `Request Limit Reached — Try Later`);
    await wait(Math.max(0, nextTrancoRequest - Date.now()), undefined, { signal });
  }
  if (signal.aborted) throw new WebsiteInsightsError(408, `Website Insights Cancelled`);
  nextTrancoRequest = Date.now() + 1_100;
  const url = new URL(`https://tranco-list.eu/api/ranks/domain/${domain}`);
  const result = recordFrom(await requestInsightsJson(url, signal, batch ? 5_000 : 15_000, 64_000));
  if (!Array.isArray(result?.ranks) || result.ranks.length > 400) throw new WebsiteInsightsError(502, `Tranco Returned An Invalid Rank List`);
  const ranks = result.ranks.map(value => {
    const record = recordFrom(value);
    const date = record?.date;
    const rank = record?.rank;
    if (!isTrancoDate(date)
      || typeof rank !== `number` || !Number.isSafeInteger(rank) || rank < -1 || rank > 1_000_000) throw new WebsiteInsightsError(502, `Tranco Returned An Invalid Rank`);
    return { date, rank: rank > 0 ? rank : null };
  }).sort((first, second) => second.date.localeCompare(first.date));
  const byDate = new Map<string, number | null>();
  for (const entry of ranks) {
    if (byDate.has(entry.date) && byDate.get(entry.date) !== entry.rank) throw new WebsiteInsightsError(502, `Tranco Returned Conflicting Daily Ranks`);
    byDate.set(entry.date, entry.rank);
  }
  const trancoHistory = [...byDate].slice(0, MAX_TRANCO_HISTORY).map(([date, rank]) => ({ date, rank }));
  const latest = ranks[0];
  return {
    trancoHistory,
    trancoCheckedAt: new Date().toISOString(),
    trancoListed: !!latest?.rank,
    ...(latest?.rank ? { trancoRank: latest.rank, trancoDate: latest.date } : {}),
  };
};

export const fetchWebsiteRanks = async (value: unknown, signal: AbortSignal): Promise<WebsiteInsights[]> => {
  if (!Array.isArray(value) || !value.length || value.length > MAX_INSIGHT_DOMAINS) {
    throw new WebsiteInsightsError(400, `Send Up To ${MAX_INSIGHT_DOMAINS} Public Domain Names`);
  }
  const domains = value.map((domain: unknown) => getWebsiteInsightDomain(domain));
  if (!domains.every((domain): domain is string => domain !== undefined)) throw new WebsiteInsightsError(400, `Send Only Public Domain Names`);
  const results: WebsiteInsights[] = [];
  for (const domain of new Set(domains)) {
    try {
      const rank = await getTranco(domain, signal, true);
      results.push({
        ...rank,
        domain,
        errors: [],
        source: WEBSITE_INSIGHTS_SOURCE,
        checkedAt: rank.trancoCheckedAt,
        warnings: rank.trancoListed ? [] : [notListedWarning],
      });
    } catch (failure) {
      if (signal.aborted) throw failure;
      if (failure instanceof WebsiteInsightsError && failure.status === 429) {
        if (!results.length) throw failure;
        break;
      }
    }
  }
  if (!results.length) throw new WebsiteInsightsError(502, `Tranco Rank Checks Could Not Be Completed`);
  return results;
};

export const fetchWebsiteInsights = async (value: unknown, signal: AbortSignal): Promise<WebsiteInsights> => {
  const domain = await requirePublicDomain(value, signal);
  const insights: WebsiteInsights = { domain, errors: [], warnings: [], source: WEBSITE_INSIGHTS_SOURCE, checkedAt: new Date().toISOString() };
  const results = await Promise.allSettled([getPerformance(domain, signal), getTranco(domain, signal)] as const);
  const performance = results[0];
  const tranco = results[1];
  if (performance.status === `fulfilled`) insights.performance = performance.value;
  else insights.errors.push(`PageSpeed: ${performance.reason instanceof WebsiteInsightsError ? performance.reason.message : `Source Is Unavailable`}`);
  if (tranco.status === `fulfilled`) Object.assign(insights, tranco.value);
  else insights.errors.push(`Tranco: ${tranco.reason instanceof WebsiteInsightsError ? tranco.reason.message : `Source Is Unavailable`}`);
  insights.checkedAt = new Date().toISOString();
  if (insights.trancoListed === false) insights.warnings.push(notListedWarning);
  return insights;
};
