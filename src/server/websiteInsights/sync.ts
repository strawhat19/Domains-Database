import { requirePublicDomain } from './validation';
import { requestInsightsJson, WebsiteInsightsError } from './request';
import { WEBSITE_INSIGHTS_SOURCE, type WebsiteInsights } from '../../shared/websiteInsights/types';

const recordFrom = (value: unknown) => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
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

const getTranco = async (domain: string, signal: AbortSignal) => {
  if (Date.now() < nextTrancoRequest) throw new WebsiteInsightsError(429, `Request Limit Reached — Try Later`);
  nextTrancoRequest = Date.now() + 1_100;
  const url = new URL(`https://tranco-list.eu/api/ranks/domain/${domain}`);
  const result = recordFrom(await requestInsightsJson(url, signal, 15_000, 64_000));
  if (!Array.isArray(result?.ranks) || result.ranks.length > 400) throw new WebsiteInsightsError(502, `Tranco Returned An Invalid Rank List`);
  const ranks = result.ranks.map(value => {
    const record = recordFrom(value);
    const date = record?.date;
    const rank = record?.rank;
    if (typeof date !== `string` || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date
      || typeof rank !== `number` || !Number.isSafeInteger(rank) || rank < -1 || rank > 1_000_000) throw new WebsiteInsightsError(502, `Tranco Returned An Invalid Rank`);
    return { date, rank };
  }).sort((first, second) => second.date.localeCompare(first.date));
  const latest = ranks[0];
  return {
    trancoCheckedAt: new Date().toISOString(),
    trancoListed: !!latest && latest.rank > 0,
    ...(latest?.rank && latest.rank > 0 ? { trancoRank: latest.rank, trancoDate: latest.date } : {}),
  };
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
  if (insights.trancoListed === false) insights.warnings.push(`Not Listed In The Returned Tranco Rankings — Visitor Counts Are Unknown`);
  return insights;
};
