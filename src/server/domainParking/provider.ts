import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import { providerName } from '../registrars/validation';
import type { DomainParkingMetrics } from '../../shared/domainParking/types';

const endpoint = `https://api.godaddy.com/v1/customers/MY/parking/metricsByDomain`;
const pacificDate = new Intl.DateTimeFormat(`en-CA`, { year: `numeric`, month: `2-digit`, day: `2-digit`, timeZone: `America/Los_Angeles` });
const day = 86_400_000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const count = (value: unknown) => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 ? value : null;
const invalid = () => new RegistrarRelayError(502, `GoDaddy Returned Invalid Parking Metrics`);

const reportDates = (time = new Date()) => {
  const parts = pacificDate.formatToParts(time);
  const date = [`year`, `month`, `day`].map(type => parts.find(part => part.type === type)?.value.padStart(2, `0`)).join(`-`);
  const today = Date.parse(`${date}T00:00:00Z`);
  return {
    endDate: new Date(today - 3 * day).toISOString().slice(0, 10),
    startDate: new Date(today - 32 * day).toISOString().slice(0, 10),
  };
};

const readDate = (value: unknown, fallback: string) => {
  if (value == null) return fallback;
  if (typeof value !== `string` || value.length > 40) throw invalid();
  const date = value.slice(0, 10);
  if (!datePattern.test(date) || !Number.isFinite(Date.parse(value))) throw invalid();
  return date;
};

export const getGoDaddyParkingMetrics = async (domain: string, authorization: string, signal: AbortSignal): Promise<DomainParkingMetrics> => {
  if (!/^sso-key [!-~]+:[!-~]+$/.test(authorization)) throw new RegistrarRelayError(403, `A Saved GoDaddy Classic Key Is Required`);
  const window = reportDates();
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ ...window, limit: `2`, domains: domain }).toString();
  const response = await fetch(url, {
    signal,
    method: `GET`,
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    headers: { Authorization: authorization, Accept: `application/json` },
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    if ([401, 403].includes(response.status)) throw new RegistrarRelayError(403, `GoDaddy Denied Parking Access For This Classic Key`);
    if (response.status === 429) throw new RegistrarRelayError(429, `GoDaddy Parking Rate Limit Reached — Try Again Shortly`);
    throw new RegistrarRelayError(502, `GoDaddy Parking Metrics Are Temporarily Unavailable`);
  }
  const raw = await readLimitedText(response.body, 16_384, signal, invalid());
  const body = object(JSON.parse(raw));
  const rows = body?.metrics;
  const pagination = object(body?.pagination);
  if (!Array.isArray(rows) || rows.length > 1 || pagination?.next || (count(pagination?.total) ?? 0) > rows.length) throw invalid();
  const row = object(rows?.[0]);
  if (rows.length && (!row || providerName(row.domain, `godaddy`) !== domain)) throw invalid();
  const currency = typeof body?.currencyId === `string` && /^[A-Z]{3}$/.test(body.currencyId) ? body.currencyId : null;
  const endDate = readDate(body?.endDate, window.endDate);
  const startDate = readDate(body?.startDate, window.startDate);
  if (endDate < startDate || startDate < window.startDate || endDate > window.endDate) throw invalid();
  return {
    domain, endDate, startDate, checkedAt: new Date().toISOString(),
    report: row ? {
      currency,
      visits: count(row.visitCount),
      adClicks: count(row.adClickCount),
      pageViews: count(row.pageViewCount),
      revenueMicrounits: currency ? count(row.revenue) : null,
    } : null,
  };
};
