import type { LucideIcon } from 'lucide-react-native';
import type { ObservabilityMetric, ObservabilityPeriod } from '../../shared/analytics/types';
import { Cpu, Gauge, Timer, Route, Clock3, Network, Activity, Database, MemoryStick, ArrowDownToLine } from 'lucide-react-native';

export type RuntimeView = `compute` | `memory` | `requests` | `latency` | `routes` | `statuses` | `cache`;
export type RuntimeRanking = `routes` | `statuses` | `cache`;
interface MetricDefinition { label: string; unit: string; hint: string; Icon: LucideIcon }
interface ViewDefinition { key: RuntimeView; label: string; Icon: LucideIcon; metrics: ObservabilityMetric[]; ranking?: RuntimeRanking }

export const runtimeMetrics: Record<ObservabilityMetric, MetricDefinition> = {
  errors: { Icon: Activity, unit: `Requests`, label: `5xx Errors`, hint: `Responses With HTTP Status 500 Or Higher` },
  requests: { Icon: Network, unit: `Requests`, label: `Requests`, hint: `Includes Responses Served From Cache` },
  cpuMs: { Icon: Cpu, unit: `ms`, label: `Active CPU Time`, hint: `Total Active Function Compute Time` },
  invocations: { Icon: Activity, unit: `Invocations`, label: `Invocations`, hint: `Recorded Function Executions` },
  ttfbP75Ms: { Icon: Clock3, unit: `ms`, label: `TTFB P75`, hint: `75th Percentile Time To First Byte` },
  durationP95Ms: { Icon: Timer, unit: `ms`, label: `Duration P95`, hint: `95th Percentile Function Duration` },
  peakMemoryMb: { Icon: MemoryStick, unit: `MB`, label: `Peak Memory`, hint: `Highest Observed Function Memory Use` },
  throttlePercent: { Icon: Gauge, unit: `%`, label: `Mean Throttling`, hint: `Provider-Reported Mean Throttling` },
  transferBytes: { Icon: ArrowDownToLine, unit: `Bytes`, label: `Data Transfer`, hint: `Fast Data Transfer Reported By Vercel` },
  provisionedMemoryMb: { Icon: MemoryStick, unit: `MB`, label: `Provisioned Memory`, hint: `Highest Reported Function Allocation` },
};

export const runtimeViews: ViewDefinition[] = [
  { key: `requests`, Icon: Network, label: `Requests`, metrics: [`requests`, `errors`, `invocations`, `transferBytes`] },
  { key: `compute`, Icon: Cpu, label: `Compute`, metrics: [`cpuMs`, `throttlePercent`] },
  { key: `memory`, Icon: MemoryStick, label: `Memory`, metrics: [`peakMemoryMb`, `provisionedMemoryMb`] },
  { key: `latency`, Icon: Timer, label: `Latency`, metrics: [`durationP95Ms`, `ttfbP75Ms`] },
  { key: `statuses`, Icon: Activity, label: `Status Codes`, ranking: `statuses`, metrics: [`requests`] },
  { key: `cache`, Icon: Database, label: `Cache`, ranking: `cache`, metrics: [`requests`] },
  { key: `routes`, Icon: Route, label: `Routes`, ranking: `routes`, metrics: [`invocations`, `cpuMs`, `durationP95Ms`, `ttfbP75Ms`, `peakMemoryMb`, `provisionedMemoryMb`, `throttlePercent`] },
];

export const reportingPeriods: { value: ObservabilityPeriod; label: string }[] = [
  { value: 24, label: `24 Hours` },
  { value: 168, label: `7 Days` },
  { value: 720, label: `30 Days` },
];
export const compactMetrics: ObservabilityMetric[] = [`requests`, `errors`, `cpuMs`, `invocations`];
export const compactTrends: ObservabilityMetric[] = [`requests`, `errors`, `cpuMs`, `durationP95Ms`];
export const hasMeasurement = (value: number | null | undefined): value is number => value != null && Number.isFinite(value);
const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);

export const formatRuntimeValue = (metric: ObservabilityMetric, value: number | null | undefined) => {
  if (!hasMeasurement(value)) return `—`;
  if (metric === `throttlePercent`) return `${formatNumber(value)}%`;
  if (metric === `peakMemoryMb` || metric === `provisionedMemoryMb`) return `${formatNumber(value)} MB`;
  if ([`requests`, `errors`, `invocations`].includes(metric)) return formatNumber(value, 0);
  if (metric === `transferBytes`) {
    const units = [`B`, `KiB`, `MiB`, `GiB`, `TiB`];
    const index = Math.max(0, Math.min(units.length - 1, value > 0 ? Math.floor(Math.log(value) / Math.log(1024)) : 0));
    return `${formatNumber(value / 1024 ** index)} ${units[index]}`;
  }
  if (value >= 3_600_000) return `${formatNumber(value / 3_600_000)} h`;
  if (value >= 60_000) return `${formatNumber(value / 60_000)} min`;
  if (value >= 1000) return `${formatNumber(value / 1000)} s`;
  return `${formatNumber(value)} ms`;
};

export const formatRuntimeTime = (timestamp: string, period: ObservabilityPeriod, short = false) => {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: `UTC`,
    ...(!short || period !== 24 ? { day: `numeric`, month: `short` } as const : {}),
    ...(!short || period === 24 ? { hour: `numeric`, minute: `2-digit` } as const : {}),
    ...(!short ? { timeZoneName: `short` } as const : {}),
  }).format(date);
};

export const formatRuntimeBucket = (seconds: number) => seconds >= 3600 ? `${formatNumber(seconds / 3600)}h Buckets` : seconds >= 60 ? `${formatNumber(seconds / 60)}m Buckets` : `${formatNumber(seconds)}s Buckets`;
