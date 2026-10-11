import { createHash } from 'node:crypto';
import { readProviderJson } from './provider';
import type { AnalyticsTotals, AnalyticsReport, AnalyticsFilters, AnalyticsBreakdown, AnalyticsTrendPoint } from '../../shared/analytics/types';

const dayLength = 86_400_000;
const cacheDuration = 300_000;
const requestTimeout = 12_000;
const maximumReportDays = 90;
const maximumBreakdownRows = 50;
const maximumCacheEntries = 100;
const maximumPendingReports = 12;
const filterFields = new Set([`to`, `from`, `path`, `device`, `country`, `referrer`]);
const analyticsEndpoint = `https://api.vercel.com/v1/query/web-analytics/visits`;
type AnalyticsDimension = `country` | `deviceType` | `requestPath` | `referrerHostname`;
type AnalyticsConfiguration = { token: string; teamId: string; projectId: string };
type CachedReport = { expiresAt: number; report: AnalyticsReport };
const reports = new Map<string, CachedReport>();
const pendingReports = new Map<string, Promise<AnalyticsReport>>();

export class AnalyticsServiceError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = `AnalyticsServiceError`;
  }
}

const invalidFilters = (message: string): never => {
  throw new AnalyticsServiceError(400, `invalid_analytics_filters`, message);
};
const invalidResponse = (): never => {
  throw new AnalyticsServiceError(502, `analytics_invalid_response`, `Vercel Returned An Unexpected Analytics Response`);
};
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === `object` && !Array.isArray(value);
const parseDate = (value: unknown) => {
  if (typeof value !== `string` || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalidFilters(`Choose A Valid Date Range`);
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return invalidFilters(`Choose A Valid Date Range`);
  return timestamp;
};
const getFilterValue = (value: unknown) => {
  if (typeof value !== `string`) return invalidFilters(`Choose Valid Analytics Filters`);
  return value.trim();
};
const normalizeReferrerHostname = (value: string) => {
  if (!value || value === `__direct__`) return value;
  if (Buffer.byteLength(value, `utf8`) > 253 || /[\u0000-\u0020\u007f\\/?#@]/.test(value) || (value.includes(`:`) && !/^\[[^\]]+\]$/.test(value))) return invalidFilters(`Choose A Valid Referrer Hostname`);
  try {
    const url = new URL(`https://${value}`);
    if (url.port || url.username || url.password || url.search || url.hash || url.pathname !== `/` || Buffer.byteLength(url.hostname, `utf8`) > 253) return invalidFilters(`Choose A Valid Referrer Hostname`);
    if (!url.hostname.startsWith(`[`) && !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9.])?$/.test(url.hostname)) return invalidFilters(`Choose A Valid Referrer Hostname`);
    return url.hostname;
  } catch {
    return invalidFilters(`Choose A Valid Referrer Hostname`);
  }
};
const normalizeFilters = (filters: AnalyticsFilters): AnalyticsFilters => {
  if (!isRecord(filters) || Object.keys(filters).some((field) => !filterFields.has(field))) return invalidFilters(`Choose Valid Analytics Filters`);
  const from = getFilterValue(filters.from);
  const to = getFilterValue(filters.to);
  const start = parseDate(from);
  const end = parseDate(to);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  if (end < start || (end - start) / dayLength >= maximumReportDays) return invalidFilters(`Choose Up To 90 Days In Chronological Order`);
  if (end > today) return invalidFilters(`Choose Dates Up To Today`);
  if (start - (end - start + dayLength) < today - 365 * dayLength) return invalidFilters(`Choose Dates Within The Last 12 Months, Including The Comparison Period`);
  const path = getFilterValue(filters.path);
  const device = getFilterValue(filters.device).toLowerCase();
  const rawCountry = getFilterValue(filters.country);
  const referrer = normalizeReferrerHostname(getFilterValue(filters.referrer).toLowerCase());
  const country = rawCountry === `__unknown__` ? rawCountry : rawCountry.toUpperCase();
  if (country && country !== `__unknown__` && !/^[A-Z]{2}$/.test(country)) return invalidFilters(`Choose A Valid Country`);
  if (device && device !== `__unknown__` && (!/^[a-z][a-z0-9 _-]{0,63}$/.test(device) || device === `others`)) return invalidFilters(`Choose A Valid Device`);
  if (path && (path.length > 1024 || !/^\/[^\u0000-\u0020\u007f?#]*$/.test(path))) return invalidFilters(`Choose A Valid Page Path`);
  return { to, from, path, device, country, referrer };
};
const getConfiguration = (): AnalyticsConfiguration => {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim() || process.env.VERCEL_API_TOKEN?.trim() || ``;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim() || ``;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || ``;
  if (!token || !projectId) throw new AnalyticsServiceError(503, `analytics_not_configured`, `Connect Vercel Analytics To View Website Traffic`);
  return { token, teamId, projectId };
};
const quoteFilterValue = (value: string) => `'${value.replaceAll(`'`, `''`)}'`;
const createFilter = (filters: AnalyticsFilters) => {
  const conditions = [`environment eq 'production'`];
  if (filters.path) conditions.push(`requestPath eq ${quoteFilterValue(filters.path)}`);
  if (filters.device) conditions.push(filters.device === `__unknown__` || filters.device === `unknown` ? `(deviceType eq '' or deviceType eq null or deviceType eq 'unknown')` : `deviceType eq ${quoteFilterValue(filters.device)}`);
  if (filters.country) conditions.push(filters.country === `__unknown__` ? `(country eq '' or country eq null)` : `country eq ${quoteFilterValue(filters.country)}`);
  if (filters.referrer) conditions.push(filters.referrer === `__direct__` ? `(referrerHostname eq '' or referrerHostname eq null)` : `referrerHostname eq ${quoteFilterValue(filters.referrer)}`);
  return conditions.join(` and `);
};
const createProviderError = (status: number) => {
  if (status === 401 || status === 403) return new AnalyticsServiceError(503, `analytics_access_denied`, `Check The Vercel Analytics Token And Project Access`);
  if (status === 404) return new AnalyticsServiceError(503, `analytics_project_not_found`, `The Vercel Analytics Project Could Not Be Found`);
  if (status === 429) return new AnalyticsServiceError(429, `analytics_rate_limited`, `Analytics Is Busy, Try Again Shortly`);
  if (status === 402) return new AnalyticsServiceError(503, `analytics_plan_limit`, `Analytics Reporting Is Unavailable For This Vercel Plan`);
  if (status === 410) return new AnalyticsServiceError(400, `analytics_reporting_window`, `Choose Dates Within Your Vercel Reporting Window`);
  if (status === 400) return new AnalyticsServiceError(400, `analytics_query_rejected`, `Vercel Could Not Report On These Filters Or Dates`);
  return new AnalyticsServiceError(502, `analytics_unavailable`, `Vercel Analytics Is Temporarily Unavailable`);
};
const requestAnalytics = async (
  configuration: AnalyticsConfiguration,
  filters: AnalyticsFilters,
  signal: AbortSignal,
  by: AnalyticsDimension | `day` | `environment` = `environment`,
) => {
  const endpoint = new URL(`${analyticsEndpoint}/aggregate`);
  endpoint.searchParams.set(`projectId`, configuration.projectId);
  endpoint.searchParams.set(`since`, `${filters.from}T00:00:00.000Z`);
  endpoint.searchParams.set(`until`, `${filters.to}T23:59:59.999Z`);
  endpoint.searchParams.set(`filter`, createFilter(filters));
  if (configuration.teamId) endpoint.searchParams.set(`teamId`, configuration.teamId);
  endpoint.searchParams.set(`by`, by);
  endpoint.searchParams.set(`limit`, `${by === `day` ? maximumReportDays : by === `environment` ? 1 : maximumBreakdownRows}`);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal,
      cache: `no-store`,
      redirect: `error`,
      headers: { Accept: `application/json`, Authorization: `Bearer ${configuration.token}` },
    });
  } catch {
    throw new AnalyticsServiceError(502, `analytics_unavailable`, `Vercel Analytics Is Temporarily Unavailable`);
  }
  if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw createProviderError(response.status); }
  let result: unknown;
  try {
    result = await readProviderJson(response, signal);
  } catch {
    return invalidResponse();
  }
  if (!isRecord(result) || result.version !== 1 || !(`data` in result)) return invalidResponse();
  return result.data;
};
const parseMetric = (value: unknown) => {
  if (typeof value !== `number` || !Number.isSafeInteger(value) || value < 0) return invalidResponse();
  return value;
};
const parseTotals = (value: unknown): AnalyticsTotals => {
  if (!isRecord(value)) return invalidResponse();
  return { visitors: parseMetric(value.visitors), pageviews: parseMetric(value.pageviews) };
};
const parseRows = (value: unknown, maximumRows: number): Record<string, unknown>[] => {
  if (!Array.isArray(value) || value.length > maximumRows || value.some((row) => !isRecord(row))) return invalidResponse();
  return value as Record<string, unknown>[];
};
const parsePeriodTotals = (value: unknown): AnalyticsTotals => {
  const rows = parseRows(value, 1);
  if (!rows.length) return { visitors: 0, pageviews: 0 };
  const row = rows?.[0];
  if (!row || row.environment !== `production`) return invalidResponse();
  return parseTotals(row);
};
const parseBreakdown = (value: unknown, dimension: AnalyticsDimension): AnalyticsBreakdown[] => {
  const rows = parseRows(value, maximumBreakdownRows + 1);
  const values = new Set<string>();
  return rows.map((row) => {
    const dimensionValue = row[dimension];
    if (dimensionValue !== null && typeof dimensionValue !== `string`) return invalidResponse();
    if (typeof dimensionValue === `string` && dimensionValue.length > 2048) return invalidResponse();
    let normalizedValue = dimensionValue ?? ``;
    if (!normalizedValue && dimension === `country`) normalizedValue = `__unknown__`;
    if (!normalizedValue && dimension === `deviceType`) normalizedValue = `unknown`;
    if (!normalizedValue && dimension === `referrerHostname`) normalizedValue = `__direct__`;
    if (normalizedValue.toLowerCase() === `others`) normalizedValue = `Others`;
    if (normalizedValue !== `Others`) {
      if (dimension === `country` && /^[a-z]{2}$/i.test(normalizedValue)) normalizedValue = normalizedValue.toUpperCase();
      if (dimension === `referrerHostname` || dimension === `deviceType`) normalizedValue = normalizedValue.toLowerCase();
      if (dimension === `deviceType` && normalizedValue === `__unknown__`) normalizedValue = `unknown`;
    }
    if (values.has(normalizedValue)) return invalidResponse();
    values.add(normalizedValue);
    return { value: normalizedValue, ...parseTotals(row) };
  }).sort((first, second) => second.pageviews - first.pageviews || second.visitors - first.visitors || first.value.localeCompare(second.value));
};
const parseTrend = (value: unknown, filters: AnalyticsFilters): AnalyticsTrendPoint[] => {
  const rows = parseRows(value, maximumReportDays);
  const start = parseDate(filters.from);
  const end = parseDate(filters.to);
  const totalsByDate = new Map<string, AnalyticsTotals>();
  for (const row of rows) {
    if (typeof row.timestamp !== `string`) return invalidResponse();
    const timestamp = Date.parse(row.timestamp);
    if (!Number.isFinite(timestamp)) return invalidResponse();
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const dateTimestamp = Date.parse(`${date}T00:00:00.000Z`);
    if (dateTimestamp < start || dateTimestamp > end || totalsByDate.has(date)) return invalidResponse();
    totalsByDate.set(date, parseTotals(row));
  }
  const trend: AnalyticsTrendPoint[] = [];
  for (let timestamp = start; timestamp <= end; timestamp += dayLength) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    trend.push({ date, ...(totalsByDate.get(date) ?? { visitors: 0, pageviews: 0 }) });
  }
  return trend;
};
const loadReport = async (configuration: AnalyticsConfiguration, filters: AnalyticsFilters): Promise<AnalyticsReport> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);
  const start = parseDate(filters.from);
  const length = parseDate(filters.to) - start + dayLength;
  const previousFilters = {
    ...filters,
    to: new Date(start - dayLength).toISOString().slice(0, 10),
    from: new Date(start - length).toISOString().slice(0, 10),
  };
  try {
    const [current, previous, trend, countries, referrers, pages, devices] = await Promise.all([
      requestAnalytics(configuration, filters, controller.signal),
      requestAnalytics(configuration, previousFilters, controller.signal),
      requestAnalytics(configuration, filters, controller.signal, `day`),
      requestAnalytics(configuration, filters, controller.signal, `country`),
      requestAnalytics(configuration, filters, controller.signal, `referrerHostname`),
      requestAnalytics(configuration, filters, controller.signal, `requestPath`),
      requestAnalytics(configuration, filters, controller.signal, `deviceType`),
    ]);
    const fetchedAt = Date.now();
    return {
      filters,
      pages: parseBreakdown(pages, `requestPath`),
      current: parsePeriodTotals(current),
      previous: parsePeriodTotals(previous),
      trend: parseTrend(trend, filters),
      devices: parseBreakdown(devices, `deviceType`),
      countries: parseBreakdown(countries, `country`),
      fetchedAt: new Date(fetchedAt).toISOString(),
      referrers: parseBreakdown(referrers, `referrerHostname`),
      cacheExpiresAt: new Date(fetchedAt + cacheDuration).toISOString(),
    };
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
};
const cleanReportCache = () => {
  const timestamp = Date.now();
  for (const [key, cached] of reports) if (cached.expiresAt <= timestamp) reports.delete(key);
};
export const getVercelAnalytics = async (filters: AnalyticsFilters): Promise<AnalyticsReport> => {
  const normalizedFilters = normalizeFilters(filters);
  const configuration = getConfiguration();
  const credentialKey = createHash(`sha256`).update(configuration.token).digest(`hex`);
  const key = JSON.stringify([configuration.projectId, configuration.teamId, credentialKey, normalizedFilters]);
  cleanReportCache();
  const cached = reports.get(key);
  if (cached) {
    reports.delete(key);
    reports.set(key, cached);
    return cached.report;
  }
  const pending = pendingReports.get(key);
  if (pending) return pending;
  if (pendingReports.size >= maximumPendingReports) throw new AnalyticsServiceError(429, `analytics_busy`, `Analytics Is Busy, Try Again Shortly`);
  const reportPromise = loadReport(configuration, normalizedFilters).then((report) => {
    cleanReportCache();
    if (reports.size >= maximumCacheEntries) {
      const oldestKey = reports.keys().next().value;
      if (oldestKey) reports.delete(oldestKey);
    }
    reports.set(key, { report, expiresAt: Date.parse(report.cacheExpiresAt) });
    return report;
  }).finally(() => pendingReports.delete(key));
  pendingReports.set(key, reportPromise);
  return reportPromise;
};
