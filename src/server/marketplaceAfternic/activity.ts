import { MarketplaceError } from '../marketplace/access';
import { domainValue, safeHash } from '../marketplace/records';
import { getAfternicListing, requestAfternic, type AfternicContext } from './provider';
import { afternicActivityRanges, type AfternicSale, type AfternicSalesPage, type AfternicDomainStats, type AfternicAccountStats } from '../../shared/marketplaceAfternic/activity';

const api = `https://api.afternic.com/v3/aftermarket/customers/my`;
const day = 86_400_000;
const limit = 25;
const maxOffset = 1_000_000;
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const count = (value: unknown) => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 ? value : null;
const code = (value: unknown) => typeof value === `string` && /^[A-Z_]{1,64}$/.test(value) ? value : null;
const iso = (value: unknown) => typeof value === `string` && value.length <= 40 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const plainDate = (value: unknown) => typeof value === `string` && /^\d{4}-\d{2}-\d{2}$/.test(value) && iso(value)?.slice(0, 10) === value ? value : null;
const cents = (value: unknown) => { const amount = count(value); return amount === null ? null : Math.round(amount / 10_000); };
const range = (value: unknown) => {
  const days = afternicActivityRanges.find(days => days === value);
  if (!days) throw new MarketplaceError(400, `Choose A Supported Afternic Activity Range`);
  return days;
};
const unavailable = () => new MarketplaceError(502, `Afternic Returned An Unexpected Activity Response`);

const getAfternicStats = async (context: AfternicContext, days: number, domain?: string): Promise<AfternicAccountStats> => {
  const today = new Date().setUTCHours(0, 0, 0, 0);
  const through = new Date(today - day).toISOString();
  const startDate = new Date(today - days * day).toISOString();
  const url = new URL(`${api}/stats${domain ? `/${encodeURIComponent(domain)}` : ``}`);
  url.search = new URLSearchParams({ startDate: through, days: String(days) }).toString();
  const body = object(await requestAfternic(context, url));
  if (!body) throw unavailable();
  const records = body.stats ?? [];
  if (!Array.isArray(records) || records.length > days) throw unavailable();
  const dates = new Set<string>();
  const firstDay = startDate.slice(0, 10);
  const lastDay = through.slice(0, 10);
  const rows = records.map(item => {
    const row = object(item);
    const date = iso(row?.date)?.slice(0, 10);
    const leads = count(row?.leads);
    const views = count(row?.views);
    if (!date || date < firstDay || date > lastDay || dates.has(date) || leads === null && views === null) throw unavailable();
    dates.add(date);
    return { date, leads, views };
  });
  return { through, startDate, days: rows.sort((a, b) => b.date.localeCompare(a.date)), checkedAt: new Date().toISOString() };
};

export const getAfternicAccountStats = (context: AfternicContext, requestedDays: unknown) => getAfternicStats(context, range(requestedDays));

export const getAfternicDomainStats = async (context: AfternicContext, input: Record<string, unknown>): Promise<AfternicDomainStats> => {
  const days = range(input.days);
  const domain = domainValue(input.domain);
  if (!await getAfternicListing(context, domain)) throw new MarketplaceError(404, `This Domain Is No Longer Listed In Your Afternic Account`);
  return { ...await getAfternicStats(context, days, domain), domain };
};

const readSale = (value: unknown, sellerId: string): AfternicSale | null => {
  const row = object(value);
  if (!row || typeof row.transactionId !== `string` || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(row.transactionId)) return null;
  let domain: string;
  try { domain = domainValue(row.name); } catch { return null; }
  return {
    domain,
    id: safeHash(sellerId, row.transactionId),
    soldAt: iso(row.soldAt),
    status: code(row.status),
    saleType: code(row.saleType),
    disbursedAt: iso(row.disbursedAt),
    cancelReason: code(row.cancelReason),
    salePriceCents: cents(row.salePrice),
    saleTotalCents: cents(row.saleTotal),
    commissionCents: cents(row.commission),
    totalInstallments: count(row.totalInstallments),
    installmentsPaid: count(row.totalInstallmentsPaid),
    installmentAmountCents: cents(row.installmentAmount),
    prevInstallmentDate: plainDate(row.prevInstallmentDate),
    nextInstallmentDate: plainDate(row.nextInstallmentDate),
  };
};

export const getAfternicSales = async (context: AfternicContext, sellerId: string, input: Record<string, unknown>): Promise<AfternicSalesPage> => {
  const days = range(input.days);
  const { offset, through: requestedThrough } = input;
  const domain = input.domain === undefined ? null : domainValue(input.domain);
  const now = Date.now();
  const through = offset === 0 && requestedThrough === null ? new Date(now).toISOString() : iso(requestedThrough);
  const end = through ? Date.parse(through) : 0;
  if (typeof offset !== `number` || !Number.isSafeInteger(offset) || offset < 0 || offset > maxOffset || !through || end < now - day || end > now) {
    throw new MarketplaceError(400, `Refresh Afternic Sales To Continue`);
  }
  const url = new URL(`${api}/sales`);
  url.search = new URLSearchParams({
    limit: String(limit), offset: String(offset), order: `SOLD_AT_DESC`,
    soldAtEndDate: through, soldAtStartDate: new Date(end - days * day).toISOString(),
  }).toString();
  if (domain) url.searchParams.set(`keyword`, domain);
  const body = object(await requestAfternic(context, url));
  const records = body?.sales;
  const pagination = object(body?.pagination);
  if (!Array.isArray(records) || records.length > limit || !pagination) throw unavailable();
  const total = count(pagination.total);
  if (total !== null && records.length && offset + records.length > total) throw unavailable();
  const ids = new Set<string>();
  let skipped = 0;
  const sales = records.flatMap(item => {
    const row = readSale(item, sellerId);
    if (!row || ids.has(row.id)) { skipped += 1; return []; }
    ids.add(row.id);
    return !domain || row.domain === domain ? [row] : [];
  });
  const next = offset + records.length;
  const hasMore = total === null ? typeof pagination.next === `string` && !!pagination.next : next < total;
  if (hasMore && (!records.length || next > maxOffset)) throw unavailable();
  return { sales, domain, skipped, through, total, nextOffset: hasMore ? next : null, checkedAt: new Date().toISOString() };
};
