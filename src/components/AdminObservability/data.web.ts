import type { ObservabilityMetric, ObservabilityPeriod } from '../../shared/analytics/types';
import { Cpu, Gauge, Zap, Clock3, Timer, Activity, MemoryStick, ArrowDownToLine, CircleAlert, Network, Route, Database, type LucideIcon } from 'lucide-react';

export type ObservabilityView = `compute` | `memory` | `requests` | `latency` | `routes` | `statuses` | `cache`;
export type ObservabilityRankingKind = `routes` | `statuses` | `cache`;
type MetricDefinition = { label: string; icon: LucideIcon; description: string };
type ViewDefinition = { key: ObservabilityView; label: string; icon: LucideIcon; metrics: ObservabilityMetric[]; ranking?: ObservabilityRankingKind };

export const observabilityMetrics: Record<ObservabilityMetric, MetricDefinition> = {
  cpuMs: { icon: Cpu, label: `Active CPU Time`, description: `Active compute time used by Vercel Functions` },
  requests: { icon: Network, label: `Requests`, description: `Requests served by Vercel, including cached responses` },
  errors: { icon: CircleAlert, label: `5xx Errors`, description: `Requests that returned an HTTP status of 500 or higher` },
  invocations: { icon: Zap, label: `Invocations`, description: `Recorded executions of Vercel Functions` },
  throttlePercent: { icon: Gauge, label: `Mean Throttling`, description: `Average function throttling percentage reported by Vercel` },
  peakMemoryMb: { icon: MemoryStick, label: `Peak Memory`, description: `Highest observed function memory usage in the reporting period` },
  provisionedMemoryMb: { icon: MemoryStick, label: `Provisioned Memory`, description: `Highest function memory allocation reported in this period` },
  durationP95Ms: { icon: Timer, label: `Duration P95`, description: `95th percentile function execution duration` },
  ttfbP75Ms: { icon: Clock3, label: `TTFB P75`, description: `75th percentile time to first byte reported by Vercel` },
  transferBytes: { icon: ArrowDownToLine, label: `Data Transfer`, description: `Recorded data transferred to and from Vercel` },
};

export const observabilityViews: ViewDefinition[] = [
  { key: `compute`, icon: Cpu, label: `Compute`, metrics: [`cpuMs`, `throttlePercent`] },
  { key: `memory`, icon: MemoryStick, label: `Memory`, metrics: [`peakMemoryMb`, `provisionedMemoryMb`] },
  { key: `requests`, icon: Network, label: `Requests`, metrics: [`requests`, `invocations`, `errors`, `transferBytes`] },
  { key: `latency`, icon: Timer, label: `Latency`, metrics: [`durationP95Ms`, `ttfbP75Ms`] },
  { key: `routes`, icon: Route, label: `Routes`, ranking: `routes`, metrics: [`cpuMs`, `invocations`, `throttlePercent`, `peakMemoryMb`, `provisionedMemoryMb`, `durationP95Ms`, `ttfbP75Ms`] },
  { key: `statuses`, icon: Activity, label: `Statuses`, ranking: `statuses`, metrics: [`requests`] },
  { key: `cache`, icon: Database, label: `Cache`, ranking: `cache`, metrics: [`requests`] },
];

export const hasObservabilityValue = (value: number | null | undefined): value is number => value != null && Number.isFinite(value);
const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat(`en-US`, { maximumFractionDigits: digits }).format(value);
export const formatObservabilityValue = (metric: ObservabilityMetric, value: number | null | undefined): string => {
  if (!hasObservabilityValue(value)) return `—`;
  if (metric === `throttlePercent`) return `${formatNumber(value)}%`;
  if (metric === `peakMemoryMb` || metric === `provisionedMemoryMb`) return `${formatNumber(value)} MB`;
  if ([`requests`, `invocations`, `errors`].includes(metric)) return formatNumber(value, 0);
  if (metric === `transferBytes`) {
    const units = [`B`, `KiB`, `MiB`, `GiB`, `TiB`];
    const index = value > 0 ? Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024))) : 0;
    return `${formatNumber(value / 1024 ** Math.max(0, index))} ${units[Math.max(0, index)]}`;
  }
  if (value >= 3600000) return `${formatNumber(value / 3600000)} h`;
  if (value >= 60000) return `${formatNumber(value / 60000)} min`;
  if (value >= 1000) return `${formatNumber(value / 1000)} s`;
  return `${formatNumber(value)} ms`;
};

export const formatObservabilityTimestamp = (timestamp: string, period: ObservabilityPeriod, short = false) => {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat(`en-US`, {
    timeZone: `UTC`,
    ...(short && period === 24 ? {} : { day: `numeric`, month: `short` as const }),
    ...(!short || period === 24 ? { hour: `numeric` as const, minute: `2-digit` as const } : {}),
    ...(!short ? { timeZoneName: `short` as const } : {}),
  }).format(date);
};

export const formatObservabilityBucket = (seconds: number) => seconds >= 3600 ? `${formatNumber(seconds / 3600)}h Buckets` : seconds >= 60 ? `${formatNumber(seconds / 60)}m Buckets` : `${formatNumber(seconds)}s Buckets`;
