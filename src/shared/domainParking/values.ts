import { normalizeDomainName } from '../domainUtils';
import type { DomainParkingMetrics } from './types';

const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const count = (value: unknown): value is number | null => value === null || typeof value === `number` && Number.isSafeInteger(value) && value >= 0;
const date = (value: unknown): value is string => typeof value === `string` && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const readDomainParkingMetrics = (value: unknown, domain: string): DomainParkingMetrics | undefined => {
  const input = object(value);
  let name: string;
  try { name = normalizeDomainName(domain); } catch { return undefined; }
  if (!input || input.domain !== name || !date(input.startDate) || !date(input.endDate) || input.startDate > input.endDate
    || typeof input.checkedAt !== `string` || input.checkedAt.length > 40 || !Number.isFinite(Date.parse(input.checkedAt))) return undefined;
  const { startDate, endDate, checkedAt } = input;
  if (input.report === null) return { domain: name, startDate, endDate, checkedAt, report: null };
  const report = object(input.report);
  if (!report) return undefined;
  const { visits, pageViews, adClicks, currency, revenueMicrounits } = report;
  if (!count(visits) || !count(pageViews) || !count(adClicks) || !count(revenueMicrounits)
    || (currency !== null && (typeof currency !== `string` || !/^[A-Z]{3}$/.test(currency))) || (currency === null && revenueMicrounits !== null)) return undefined;
  return { domain: name, startDate, endDate, checkedAt, report: { visits, pageViews, adClicks, currency, revenueMicrounits } };
};
