export type TrafficPeriod = 7 | 30 | 90;
export type ObservabilityPeriod = 24 | 168 | 720;
export type AnalyticsFailure = { code: string; message: string };
export type AnalyticsFilters = { to: string; from: string; path: string; device: string; country: string; referrer: string };
export type AnalyticsTotals = { visitors: number; pageviews: number };
export type AnalyticsTrendPoint = AnalyticsTotals & { date: string };
export type AnalyticsBreakdown = AnalyticsTotals & { value: string };
export interface TrafficReport {
  fetchedAt: string;
  period: number;
  cacheExpiresAt: string;
  filters: AnalyticsFilters;
  current: AnalyticsTotals;
  previous: AnalyticsTotals;
  trend: AnalyticsTrendPoint[];
  pages: AnalyticsBreakdown[];
  devices: AnalyticsBreakdown[];
  countries: AnalyticsBreakdown[];
  referrers: AnalyticsBreakdown[];
}
export type AnalyticsReport = Omit<TrafficReport, `period`>;
export const observabilityMetrics = [
  `cpuMs`, `errors`, `requests`, `ttfbP75Ms`, `invocations`, `transferBytes`,
  `peakMemoryMb`, `durationP95Ms`, `throttlePercent`, `provisionedMemoryMb`,
] as const;
export type ObservabilityMetric = typeof observabilityMetrics[number];
export type ObservabilityValues = Record<ObservabilityMetric, number | null>;
export type ObservabilityRow = { value: string; values: ObservabilityValues };
export type ObservabilityPoint = { timestamp: string; values: ObservabilityValues };
export interface ObservabilityReport {
  start: string;
  end: string;
  fetchedAt: string;
  warnings: string[];
  bucketSeconds: number;
  cacheExpiresAt: string;
  period: ObservabilityPeriod;
  totals: ObservabilityValues;
  routes: ObservabilityRow[];
  cache: ObservabilityRow[];
  statuses: ObservabilityRow[];
  trend: ObservabilityPoint[];
}
