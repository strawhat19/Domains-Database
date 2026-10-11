import type { AnalyticsFilters, AnalyticsBreakdown } from '../../shared/analytics/types';

export type TrafficOutcomes = { domains: string[]; accounts: string[] };
export type TrafficSegment = `path` | `device` | `country` | `referrer`;
export type TrafficMetric = `visitors` | `pageviews`;

export const formatTrafficCount = (value: number) => new Intl.NumberFormat(`en-US`).format(value);
export const formatTrafficDate = (value: string, short = false) => new Intl.DateTimeFormat(`en-US`, { timeZone: `UTC`, day: `numeric`, month: short ? `short` : `long`, ...(short ? {} : { year: `numeric` }) }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
export const formatTrafficCountry = (value: string) => {
  if (value === `__unknown__` || value === `ZZ` || !value) return `Unknown Location`;
  if (isOtherTrafficSegment(value)) return `Other Countries`;
  try { return /^[A-Z]{2}$/.test(value) && typeof Intl.DisplayNames === `function` ? new Intl.DisplayNames([`en`], { type: `region` }).of(value) ?? value : value; }
  catch { return value; }
};
export const formatTrafficReferrer = (value: string) => value === `__direct__` || !value ? `Direct / Unknown` : isOtherTrafficSegment(value) ? `Other Sources` : value;
export const formatTrafficDevice = (value: string) => value && value !== `__unknown__` ? `${value[0].toUpperCase()}${value.slice(1)}` : `Unknown`;
export const formatTrafficSegment = (key: TrafficSegment, value: string) => key === `country` ? formatTrafficCountry(value) : key === `referrer` ? formatTrafficReferrer(value) : key === `device` ? formatTrafficDevice(value) : value || `/`;
export const isOtherTrafficSegment = (value: string) => [`__other__`, `__others__`, `others`, `other`].includes(value.toLowerCase());
export const getTrafficOptions = (rows: AnalyticsBreakdown[], selected: string) => [...new Set([...(selected ? [selected] : []), ...rows.map(({ value }) => value)])].filter((value) => value && !isOtherTrafficSegment(value));
export const countTrafficOutcomes = (dates: string[], filters: AnalyticsFilters) => dates.filter((value) => value?.slice(0, 10) >= filters.from && value.slice(0, 10) <= filters.to).length;
export const getTrafficChange = (current: number, previous: number) => previous ? { label: `${current > previous ? `+` : ``}${((current - previous) / previous * 100).toFixed(1)}%`, direction: current > previous ? `up` : current < previous ? `down` : `flat` } : { label: current ? `New Activity` : `No Change`, direction: current ? `up` : `flat` };
export const getTrafficDateError = (from: string, to: string) => {
  const first = Date.parse(`${from}T00:00:00Z`);
  const last = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || from > to) return `Choose A Valid Date Range`;
  if (to > new Date().toISOString().slice(0, 10)) return `Choose Today Or An Earlier Date`;
  if ((last - first) / 86400000 + 1 > 90) return `Choose Up To 90 Days`;
  if (first - (last - first + 86400000) < Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`) - 365 * 86400000) return `The Date Range And Its Previous Period Must Fit Within The Last Year`;
  return ``;
};
