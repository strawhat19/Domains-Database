import { randomUUID } from 'node:crypto';
import { domainValue } from '../marketplace/records';
import { MarketplaceError } from '../marketplace/access';
import { readLimitedText } from '../registrars/request';
import { RegistrarRelayError } from '../registrars/errors';
import type { AfternicListing, AfternicPortfolioPage, AfternicSearchCounts } from '../../shared/marketplaceAfternic/types';

const portfolioUrl = `https://api.afternic.com/v3/aftermarket/customers/my/domains`;
const importableStatuses = new Set([`ACTIVE`, `HIDDEN`, `INACTIVE`, `PENDING`, `OWNERSHIP_REVIEW`, `OWNERSHIP_UNVERIFIED`]);
const pageSize = 25;
const maxOffset = 1_000_000;
const maxResponseBytes = 256_000;
const microunitsPerCent = 10_000;
const missingDomain = Symbol(`missingAfternicDomain`);
const baseIncludes = `estimatedValue,fastTransferStatus,featured,registrar`;
const rejectedIncludes = Symbol(`afternicRejectedOptionalIncludes`);
export const afternicMinimumOfferCents = 2_000;

export type AfternicContext = { authorization: string; signal: AbortSignal };
type AfternicCreateInput = { domain: string; acceptOffers: boolean; priceCents: number | null };
const unavailable = () => new MarketplaceError(502, `Afternic Returned An Unexpected Response`);
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const statusValue = (value: unknown) => typeof value === `string` && /^[A-Z_]{1,64}$/.test(value) ? value : null;
const booleanValue = (value: unknown) => typeof value === `boolean` ? value : null;
const count = (value: unknown) => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 ? value : null;
const dateValue = (value: unknown) => typeof value === `string` && value.length <= 40 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const searchCounts = (value: unknown): AfternicSearchCounts | null => {
  const windows = object(value);
  if (!windows) return null;
  const counts = { '30d': count(windows[`30d`]), '90d': count(windows[`90d`]), '365d': count(windows[`365d`]) };
  return Object.values(counts).some(value => value !== null) ? counts : null;
};
const toCents = (value: unknown) => {
  if (value === undefined || value === null || value === 0) return null;
  if (typeof value !== `number` || !Number.isSafeInteger(value) || value < 0 || value % 1_000_000 !== 0) throw unavailable();
  return value / microunitsPerCent;
};
const optionalCents = (value: unknown, wholeDollars = false) => {
  if (typeof value !== `number` || !Number.isSafeInteger(value) || value <= 0 || (wholeDollars && value % 1_000_000 !== 0)) return null;
  return Math.round(value / microunitsPerCent) || null;
};

const readListing = (value: unknown): AfternicListing => {
  const row = object(value);
  const status = statusValue(row?.listStatus);
  if (!row || !status || typeof row.name !== `string`) throw unavailable();
  let domain: string;
  try { domain = domainValue(row.name); } catch { throw unavailable(); }
  const priceCents = toCents(row.buynowPrice);
  const acceptOffers = row.showLanderMakeOfferOption === true || priceCents === null;
  const searches = object(row.searches);
  return {
    domain, status, priceCents, acceptOffers,
    floorPriceCents: optionalCents(row.floorPrice, true),
    fastTransferStatus: statusValue(row.fastTransferStatus),
    minimumOfferCents: optionalCents(row.minbidPrice, true),
    estimatedValueCents: optionalCents(object(row.estimatedValue)?.price),
    canImport: importableStatuses.has(status) && (priceCents === null || priceCents <= 99_999_999),
    insights: {
      listedAt: dateValue(row.listedAt),
      updatedAt: dateValue(row.updatedAt),
      intakeLeads: count(row.intakeLeads),
      intakeViews: count(row.intakeViews),
      registrar: statusValue(row.registrar),
      featured: booleanValue(row.featured),
      maxLeaseMonths: count(row.maxLeasePeriod),
      landingPage: statusValue(row.landingPage),
      searchTotals: searchCounts(searches?.total),
      leasingEnabled: booleanValue(row.leasingEnabled),
      uniqueSearchers: searchCounts(searches?.unique),
      leaseDownPaymentCents: optionalCents(row.leaseDownPaymentAmount),
    },
  };
};

const providerError = (status: number) => {
  if ([401, 403].includes(status)) return new MarketplaceError(502, `Afternic Denied Access — Check The API Key And Secret`);
  if (status === 429) return new MarketplaceError(429, `Afternic Rate Limit Reached — Try Again Shortly`);
  if (status === 409) return new MarketplaceError(409, `The Domain Already Exists At Afternic`);
  if ([400, 422].includes(status)) return new MarketplaceError(422, `Afternic Rejected This Listing — Review The Domain And Pricing At Afternic`);
  return new MarketplaceError(502, `Afternic Is Temporarily Unavailable — Try Again`);
};

export const requestAfternic = async (context: AfternicContext, url: URL, options?: { input?: Record<string, unknown>; allowMissing?: boolean; fallbackIncludes?: boolean }) => {
  const { input, allowMissing, fallbackIncludes } = options ?? {};
  const signal = AbortSignal.any([context.signal, AbortSignal.timeout(9_000)]);
  try {
    const response = await fetch(url, {
      signal,
      cache: `no-store`,
      redirect: `error`,
      credentials: `omit`,
      method: input ? `POST` : `GET`,
      body: input ? JSON.stringify(input) : undefined,
      headers: {
        Accept: `application/json`,
        Authorization: context.authorization,
        'X-Request-Id': randomUUID(),
        'User-Agent': `DomainsDatabase/1.0`,
        ...(input ? { 'Content-Type': `application/json` } : {}),
      },
    });
    if (!response.ok && !(allowMissing && response.status === 404)) {
      void response.body?.cancel().catch(() => undefined);
      if (fallbackIncludes && [400, 403, 422].includes(response.status)) return rejectedIncludes;
      throw providerError(response.status);
    }
    if (input && response.status !== 201) {
      void response.body?.cancel().catch(() => undefined);
      throw unavailable();
    }
    const raw = await readLimitedText(response.body, maxResponseBytes, signal, new RegistrarRelayError(502, `Afternic Response Exceeded The Size Limit`));
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw unavailable(); }
    if (response.status === 404) {
      if (object(parsed)?.code === `RESOURCE_NOT_FOUND`) return missingDomain;
      throw unavailable();
    }
    return parsed;
  } catch (failure) {
    if (failure instanceof MarketplaceError) throw failure;
    if (signal.aborted) throw new MarketplaceError(504, `Afternic Request Timed Out — Check Listing Status Before Retrying`);
    if (failure instanceof RegistrarRelayError) throw new MarketplaceError(failure.status, failure.message);
    throw providerError(503);
  }
};

export const getAfternicPortfolio = async (
  context: AfternicContext, offset: unknown, { includeInsights = false, includeSearches = true } = {},
): Promise<AfternicPortfolioPage & { total: number | null; searchesRejected: boolean }> => {
  if (typeof offset !== `number` || !Number.isSafeInteger(offset) || offset < 0 || offset > maxOffset) throw new MarketplaceError(400, `Reload The Afternic Portfolio To Continue`);
  const url = new URL(portfolioUrl);
  url.search = new URLSearchParams({ order: `NAME_ASC`, limit: String(pageSize), offset: String(offset) }).toString();
  const optionalSearches = includeInsights && includeSearches;
  if (includeInsights) url.searchParams.set(`includes`, optionalSearches ? `${baseIncludes},searches` : baseIncludes);
  let response = await requestAfternic(context, url, { fallbackIncludes: optionalSearches });
  const searchesRejected = response === rejectedIncludes;
  if (searchesRejected) {
    url.searchParams.set(`includes`, baseIncludes);
    response = await requestAfternic(context, url);
  }
  const body = object(response);
  const pagination = object(body?.pagination);
  if (!pagination) throw new MarketplaceError(502, `Afternic Portfolio Response Is Missing Pagination`);
  const total = typeof pagination.total === `number` && Number.isSafeInteger(pagination.total) && pagination.total >= 0 ? pagination.total : null;
  const domains = body?.domains ?? (total === offset ? [] : undefined);
  if (!Array.isArray(domains) || domains.length > pageSize) throw new MarketplaceError(502, `Afternic Returned An Invalid Portfolio Page`);
  const listings = domains.flatMap(row => {
    try { return [readListing(row)]; } catch { return []; }
  });
  const next = offset + domains.length;
  const hasMore = total !== null ? total > next
    : (typeof pagination.next === `string` && !!pagination.next) || (includeInsights && domains.length === pageSize);
  if (hasMore && (!domains.length || next > maxOffset)) throw new MarketplaceError(502, `Afternic Portfolio Pagination Could Not Continue`);
  return { listings, nextOffset: hasMore ? next : null, total, searchesRejected, skipped: domains.length - listings.length };
};

export const getAfternicListing = async (context: AfternicContext, domain: string) => {
  const url = new URL(`${portfolioUrl}/${encodeURIComponent(domain)}`);
  url.searchParams.set(`includes`, baseIncludes);
  const body = await requestAfternic(context, url, { allowMissing: true });
  if (body === missingDomain) return null;
  const listing = readListing(body);
  if (listing.domain !== domain) throw unavailable();
  return listing;
};

export const createAfternicListing = async (context: AfternicContext, { domain, priceCents, acceptOffers }: AfternicCreateInput) => {
  const input = {
    name: domain,
    hidden: false,
    floorPrice: 0,
    leasingEnabled: false,
    landingPage: `SALES_TYPE`,
    buynowPrice: (priceCents ?? 0) * microunitsPerCent,
    intakeStyle: acceptOffers ? `CUSTOM_LANDER` : `BUYNOW`,
    showLanderMakeOfferOption: acceptOffers,
    showLanderBuynowOption: priceCents !== null,
    showLanderLeaseToOwnOption: false,
    ...(acceptOffers ? { minbidPrice: afternicMinimumOfferCents * microunitsPerCent } : {}),
  };
  const body = await requestAfternic(context, new URL(portfolioUrl), { input });
  const listing = readListing(body);
  if (listing.domain !== domain) throw unavailable();
  return listing;
};
