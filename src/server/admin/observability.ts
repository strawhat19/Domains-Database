import { createHash } from 'node:crypto';
import { readProviderJson } from './provider';
import { observabilityMetrics } from '../../shared/analytics/types';
import type { ObservabilityRow, ObservabilityPoint, ObservabilityValues, ObservabilityMetric, ObservabilityPeriod, ObservabilityReport } from '../../shared/analytics/types';

const cacheDuration = 300_000;
const requestTimeout = 15_000;
const maximumGroups = 20;
const maximumCacheEntries = 100;
const maximumPendingReports = 12;
const observabilityEndpoint = `https://api.vercel.com/metrics/v1`;
type ObservabilityConfiguration = { token: string; teamId: string; projectId: string };
type MetricSelection = { metric: string; filter?: string; aggregation: `sum` | `avg` | `max` | `p95` | `p75` | `count` };
type MetricSelections = Partial<Record<ObservabilityMetric, MetricSelection>>;
type TimeRange = { start: string; end: string; bucketSeconds: number };
type CachedReport = { expiresAt: number; report: ObservabilityReport };
type MetricCapability = { id: string; aggregations: string[]; dimensions: string[] };
const reports = new Map<string, CachedReport>();
const pendingReports = new Map<string, Promise<ObservabilityReport>>();

const functionMetrics = {
  cpuMs: { aggregation: `sum`, metric: `vercel.function_invocation.function_cpu_time_ms` },
  invocations: { aggregation: `count`, metric: `vercel.function_invocation.count` },
  ttfbP75Ms: { aggregation: `p75`, metric: `vercel.function_invocation.ttfb_ms` },
  peakMemoryMb: { aggregation: `max`, metric: `vercel.function_invocation.peak_memory_mb` },
  durationP95Ms: { aggregation: `p95`, metric: `vercel.function_invocation.function_duration_ms` },
  throttlePercent: { aggregation: `avg`, metric: `vercel.function_invocation.cpu_throttle_percent` },
  provisionedMemoryMb: { aggregation: `max`, metric: `vercel.function_invocation.provisioned_memory_mb` },
} satisfies MetricSelections;
const requestMetrics = {
  requests: { aggregation: `count`, metric: `vercel.request.count` },
  transferBytes: { aggregation: `sum`, metric: `vercel.request.fdt_total_bytes` },
  errors: { aggregation: `count`, metric: `vercel.request.count`, filter: `httpStatus >= 500` },
} satisfies MetricSelections;
const allMetrics = { ...functionMetrics, ...requestMetrics };

export class ObservabilityServiceError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = `ObservabilityServiceError`;
  }
}

const invalidResponse = (): never => {
  throw new ObservabilityServiceError(502, `observability_invalid_response`, `Vercel Returned An Unexpected Observability Response`);
};
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === `object` && !Array.isArray(value);
const getConfiguration = (): ObservabilityConfiguration => {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim() || process.env.VERCEL_API_TOKEN?.trim() || ``;
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim() || process.env.VERCEL_TEAM_ID?.trim() || ``;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim() || process.env.VERCEL_PROJECT_ID?.trim() || ``;
  if (!token || !teamId || !projectId) throw new ObservabilityServiceError(503, `observability_not_configured`, `Connect A Vercel Token, Team And Project To View Observability`);
  return { token, teamId, projectId };
};
const getTimeRange = (period: ObservabilityPeriod): TimeRange => {
  const bucketSeconds = period === 24 ? 3600 : period === 168 ? 14400 : 21600;
  const bucketMilliseconds = bucketSeconds * 1000;
  const end = Math.ceil(Date.now() / bucketMilliseconds) * bucketMilliseconds;
  return { bucketSeconds, end: new Date(end).toISOString(), start: new Date(end - period * 3_600_000).toISOString() };
};
const createProviderError = (status: number) => {
  if (status === 402) return new ObservabilityServiceError(402, `observability_plus_required`, `Vercel Observability Plus Is Required For These Metrics`);
  if (status === 401 || status === 403) return new ObservabilityServiceError(503, `observability_access_denied`, `Check The Vercel Token And Team Access`);
  if (status === 429) return new ObservabilityServiceError(429, `observability_rate_limited`, `Observability Is Busy, Try Again Shortly`);
  if (status === 504) return new ObservabilityServiceError(504, `observability_timeout`, `Observability Took Too Long, Try Again`);
  if (status === 400) return new ObservabilityServiceError(502, `observability_query_rejected`, `Vercel Could Not Report On These Metrics`);
  if (status === 404) return new ObservabilityServiceError(503, `observability_project_not_found`, `The Vercel Observability Project Could Not Be Found`);
  return new ObservabilityServiceError(502, `observability_unavailable`, `Vercel Observability Is Temporarily Unavailable`);
};
const requestMetricsReport = async (
  configuration: ObservabilityConfiguration,
  range: TimeRange,
  signal: AbortSignal,
  metrics: MetricSelections,
  dimension?: `route` | `httpStatus` | `cacheResult`,
  rankMetric: ObservabilityMetric = `requests`,
) => {
  const endpoint = new URL(observabilityEndpoint);
  endpoint.searchParams.set(`teamId`, configuration.teamId);
  const query = {
    metrics,
    outputs: Object.keys(metrics),
    filter: `environment:production`,
    bucketSeconds: range.bucketSeconds,
    timeRange: { start: range.start, end: range.end },
    scope: { ownerId: configuration.teamId, projectIds: [configuration.projectId] },
    ...(dimension ? { groupBy: [dimension], seriesSelection: { limit: maximumGroups, mode: `exact`, rankBy: [{ metric: rankMetric, direction: `desc` }] } } : {}),
  };
  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal,
      method: `POST`,
      cache: `no-store`,
      redirect: `error`,
      body: JSON.stringify(query),
      headers: { Accept: `application/json`, Authorization: `Bearer ${configuration.token}`, [`Content-Type`]: `application/json` },
    });
  } catch {
    if (signal.aborted) throw createProviderError(504);
    throw createProviderError(502);
  }
  if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw createProviderError(response.status); }
  let result: unknown;
  try {
    result = await readProviderJson(response, signal);
  } catch {
    if (signal.aborted) throw createProviderError(504);
    return invalidResponse();
  }
  if (!isRecord(result) || !Array.isArray(result.summary)) return invalidResponse();
  return result;
};
const readCapabilities = async (configuration: ObservabilityConfiguration, signal: AbortSignal) => {
  const result = new Map<string, MetricCapability>();
  for (const prefix of [`vercel.request`, `vercel.function_invocation`]) {
    let cursor = ``;
    for (let page = 0; page < 3; page++) {
      const endpoint = new URL(observabilityEndpoint);
      endpoint.searchParams.set(`kind`, `system`);
      endpoint.searchParams.set(`limit`, `250`);
      endpoint.searchParams.set(`search`, prefix);
      endpoint.searchParams.set(`teamId`, configuration.teamId);
      if (cursor) endpoint.searchParams.set(`cursor`, cursor);
      let response: Response;
      try {
        response = await fetch(endpoint, { signal, cache: `no-store`, redirect: `error`, headers: { Accept: `application/json`, Authorization: `Bearer ${configuration.token}` } });
      } catch { throw createProviderError(signal.aborted ? 504 : 502); }
      if (!response.ok) { void response.body?.cancel().catch(() => undefined); throw createProviderError(response.status); }
      let catalog: unknown;
      try { catalog = await readProviderJson(response, signal); } catch { return invalidResponse(); }
      if (!isRecord(catalog) || !Array.isArray(catalog.metrics) || catalog.metrics.length > 250 || !isRecord(catalog.pagination)) return invalidResponse();
      for (const metric of catalog.metrics) {
        if (!isRecord(metric) || typeof metric.id !== `string` || !Array.isArray(metric.dimensions) || !Array.isArray(metric.aggregations)
          || metric.dimensions.some(dimension => typeof dimension !== `string`) || metric.aggregations.some(aggregation => typeof aggregation !== `string`)) return invalidResponse();
        result.set(metric.id, { id: metric.id, dimensions: metric.dimensions, aggregations: metric.aggregations });
      }
      if (catalog.pagination.hasMore === false) break;
      if (typeof catalog.pagination.nextCursor !== `string` || !catalog.pagination.nextCursor || catalog.pagination.nextCursor === cursor || page === 2) return invalidResponse();
      cursor = catalog.pagination.nextCursor;
    }
  }
  return result;
};
const parseValues = (value: unknown): ObservabilityValues => {
  if (!isRecord(value)) return invalidResponse();
  return Object.fromEntries(observabilityMetrics.map((metric) => {
    const measurement = value[metric];
    if (measurement === undefined || measurement === null) return [metric, null];
    if (typeof measurement !== `number` || !Number.isFinite(measurement) || measurement < 0) return invalidResponse();
    if ([`errors`, `requests`, `invocations`].includes(metric) && !Number.isSafeInteger(measurement)) return invalidResponse();
    return [metric, measurement];
  })) as ObservabilityValues;
};
const parseRows = (value: unknown, maximum: number): Record<string, unknown>[] => {
  if (!Array.isArray(value) || value.length > maximum || value.some((row) => !isRecord(row))) return invalidResponse();
  return value as Record<string, unknown>[];
};
const parseTotals = (value: unknown): ObservabilityValues => {
  const rows = parseRows(value, 1);
  if (!rows.length) return parseValues({});
  const row = rows[0];
  if (!isRecord(row?.dimensions) || Object.keys(row.dimensions).length) return invalidResponse();
  return parseValues(row.values);
};
const parseTrend = (value: unknown, range: TimeRange, period: ObservabilityPeriod): ObservabilityPoint[] => {
  if (value === undefined) return [];
  const rows = parseRows(value, period * 3600 / range.bucketSeconds + 1);
  const timestamps = new Set<number>();
  const start = Date.parse(range.start);
  const end = Date.parse(range.end);
  return rows.map((row) => {
    if (typeof row.timestamp !== `string` || row.timestamp.length > 64 || !isRecord(row.dimensions) || Object.keys(row.dimensions).length) return invalidResponse();
    const timestamp = Date.parse(row.timestamp);
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp >= end || timestamps.has(timestamp)) return invalidResponse();
    timestamps.add(timestamp);
    return { timestamp: new Date(timestamp).toISOString(), values: parseValues(row.values) };
  }).sort((first, second) => first.timestamp.localeCompare(second.timestamp));
};
const parseBreakdown = (value: unknown, dimension: string, metric: ObservabilityMetric): ObservabilityRow[] => {
  const identities = new Set<string>();
  return parseRows(value, maximumGroups + 1).map((row) => {
    if (!isRecord(row.dimensions)) return invalidResponse();
    const identity = row.dimensions[dimension];
    if (identity !== null && typeof identity !== `string`) return invalidResponse();
    if (typeof identity === `string` && (identity.length > 2048 || /[\u0000-\u001f\u007f]/.test(identity))) return invalidResponse();
    const normalizedIdentity = identity ?? `__unknown__`;
    if (identities.has(normalizedIdentity)) return invalidResponse();
    identities.add(normalizedIdentity);
    return { value: normalizedIdentity, values: parseValues(row.values) };
  }).sort((first, second) => (second.values[metric] ?? 0) - (first.values[metric] ?? 0) || first.value.localeCompare(second.value));
};
const loadReport = async (configuration: ObservabilityConfiguration, period: ObservabilityPeriod): Promise<ObservabilityReport> => {
  const range = getTimeRange(period);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);
  try {
    const capabilities = await readCapabilities(configuration, controller.signal);
    const warnings: string[] = [];
    const selections: MetricSelections = {};
    for (const [name, selection] of Object.entries(allMetrics)) {
      const capability = capabilities.get(selection.metric);
      if (capability?.aggregations.includes(selection.aggregation) && (name !== `errors` || capability.dimensions.includes(`httpStatus`))) selections[name as ObservabilityMetric] = selection;
      else warnings.push(`${name} Is Unavailable For This Project`);
    }
    if (!Object.keys(selections).length) throw new ObservabilityServiceError(503, `observability_metrics_unavailable`, `These Vercel Metrics Are Unavailable For Your Team`);
    const result = await requestMetricsReport(configuration, range, controller.signal, selections);
    const totals = parseTotals(result.summary);
    const trend = parseTrend(result.series, range, period);
    const requestCounts = selections.requests ? { requests: selections.requests } : {};
    const routeMetrics = Object.fromEntries(Object.entries(functionMetrics).filter(([name]) => name in selections)) as MetricSelections;
    const requestBreakdown = (dimension: `httpStatus` | `cacheResult`) => {
      if (!selections.requests || !capabilities.get(requestMetrics.requests.metric)?.dimensions.includes(dimension)) return Promise.reject(new Error(`Metric Dimension Is Unavailable`));
      return requestMetricsReport(configuration, range, controller.signal, requestCounts, dimension).then(report => parseBreakdown(report.summary, dimension, `requests`));
    };
    const routeRank: ObservabilityMetric = routeMetrics.cpuMs ? `cpuMs` : (Object.keys(routeMetrics)?.[0] as ObservabilityMetric);
    const routeReport = routeRank && Object.values(routeMetrics).every(selection => capabilities.get(selection.metric)?.dimensions.includes(`route`))
      ? requestMetricsReport(configuration, range, controller.signal, routeMetrics, `route`, routeRank).then(report => parseBreakdown(report.summary, `route`, routeRank))
      : Promise.reject(new Error(`Route Metrics Are Unavailable`));
    const results = await Promise.allSettled([
      routeReport,
      requestBreakdown(`httpStatus`),
      requestBreakdown(`cacheResult`),
    ]);
    const labels = [`Route Breakdown`, `Status Breakdown`, `Cache Breakdown`];
    const breakdowns = results.map((result, index) => {
      if (result.status === `fulfilled`) return result.value;
      warnings.push(`${labels[index]} Is Unavailable`);
      return [];
    });
    const fetchedAt = Date.now();
    return {
      period,
      totals,
      trend,
      warnings,
      ...range,
      cache: breakdowns?.[2] ?? [],
      routes: breakdowns?.[0] ?? [],
      statuses: breakdowns?.[1] ?? [],
      fetchedAt: new Date(fetchedAt).toISOString(),
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
export const getVercelObservability = async (period: ObservabilityPeriod): Promise<ObservabilityReport> => {
  if (period !== 24 && period !== 168 && period !== 720) throw new ObservabilityServiceError(400, `invalid_observability_period`, `Choose 24 Hours, 7 Days Or 30 Days`);
  const configuration = getConfiguration();
  const credentialKey = createHash(`sha256`).update(configuration.token).digest(`hex`);
  const key = JSON.stringify([configuration.projectId, configuration.teamId, credentialKey, period]);
  cleanReportCache();
  const cached = reports.get(key);
  if (cached) {
    reports.delete(key);
    reports.set(key, cached);
    return cached.report;
  }
  const pending = pendingReports.get(key);
  if (pending) return pending;
  if (pendingReports.size >= maximumPendingReports) throw new ObservabilityServiceError(429, `observability_busy`, `Observability Is Busy, Try Again Shortly`);
  const reportPromise = loadReport(configuration, period).then((report) => {
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
