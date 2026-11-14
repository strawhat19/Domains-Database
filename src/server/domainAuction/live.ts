import { readLimitedText } from '../registrars/request';
import { getBillingDatabase } from '../billing/firebase';
import { RegistrarRelayError } from '../registrars/errors';
import { parseCredentials } from '../registrars/credentials';
import { getAppCollectionIDNumber } from '../../shared/common/ids';
import { FeatureAccessError, getRequestPlanAccess } from '../featureAccess/auth';
import { checkRequest, readRequestRecord, responseHeaders } from '../registrars/http';
import { normalizeAuctionDomain, parseAuctionTimestamp } from '../../shared/domainAuction/import';
import { isLiveAuctionCode, isLiveAuctionListingId, isLiveAuctionPattern, type LiveAuction } from '../../shared/domainAuction/live';

const url = `https://api.godaddy.com/v1/customers/MY/aftermarket/listings/available?includes=listing,enrichment&currencyId=USD`;
const headers = { ...responseHeaders, Vary: `Authorization` };
const minute = 60_000;
const usage = new Map<string, { count: number; expires: number }>();
const pending = new Set<string>();
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const integer = (value: unknown) => typeof value === `number` && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const usd = (value: unknown) => { const microunits = integer(value); return microunits === undefined ? undefined : microunits / 1_000_000; };
const score = (value: unknown) => { const number = integer(value); return number !== undefined && number <= 100 ? number : undefined; };
const isBoolean = (value: unknown) => typeof value === `boolean` ? value : undefined;
const readTimestamp = (value: unknown) => typeof value === `string` && value.length <= 40 ? parseAuctionTimestamp(value) ?? undefined : undefined;
const invalid = () => new RegistrarRelayError(502, `GoDaddy Returned Invalid Auction Details`);

const readAvailability = (value: unknown, domain: string): LiveAuction => {
  const rows = object(value)?.availabilities;
  if (!Array.isArray(rows) || rows.length !== 1) throw invalid();
  const row = object(rows?.[0]);
  if (!row || normalizeAuctionDomain(row.domainName) !== domain || (row.status !== `AVAILABLE` && row.status !== `UNAVAILABLE`)) throw invalid();
  const checkedAt = new Date().toISOString();
  if (row.status === `UNAVAILABLE`) return { domain, checkedAt, available: false, metrics: {} };
  const listing = object(row.listing);
  const enrichment = object(row.enrichment);
  const godaddy = object(enrichment?.godaddy);
  const estibot = object(enrichment?.estibot);
  const semrush = object(enrichment?.semrush);
  const majestic = object(enrichment?.majestic);
  const currencyOK = !listing || listing.currencyId === `USD`;
  const topDomains = semrush?.topReferringDomains;
  const referers = Array.isArray(topDomains) ? topDomains.slice(0, 5).flatMap(value => {
    const row = object(value);
    const name = normalizeAuctionDomain(row?.domain);
    const links = integer(row?.backlinkCount);
    return name && links !== undefined ? [{ links, domain: name }] : [];
  }) : undefined;
  const member = listing?.memberBiddingStatus;
  const { listingId, listingType, charPattern } = listing ?? {};
  return {
    domain, checkedAt, referers, available: true,
    watching: isBoolean(listing?.watching), extended: isBoolean(listing?.extended),
    endsAt: readTimestamp(listing?.auctionEndAt), beginsAt: readTimestamp(listing?.auctionStartAt),
    expiresAt: readTimestamp(listing?.domainExpiresAt), createdAt: readTimestamp(listing?.domainCreatedAt),
    listingId: isLiveAuctionListingId(listingId) ? listingId : undefined,
    transfersAt: readTimestamp(listing?.estimatedTransferAt),
    listingType: isLiveAuctionCode(listingType) ? listingType : undefined,
    memberStatus: isLiveAuctionCode(member) ? member : undefined,
    characterPattern: isLiveAuctionPattern(charPattern) ? charPattern : undefined,
    metrics: {
      bids: integer(listing?.bidsCount), age: integer(listing?.domainAgeYears),
      buyNow: currencyOK ? usd(listing?.priceBuyItNow) : undefined,
      renewal: currencyOK ? usd(listing?.priceRenewal) : undefined,
      transfer: currencyOK ? usd(listing?.priceTransfer) : undefined,
      currentBid: currencyOK ? usd(listing?.priceCurrent) : undefined,
      nextBid: currencyOK ? usd(listing?.priceNextBid) : undefined,
      proxyBid: currencyOK && listing?.priceProxyBid !== 0 ? usd(listing?.priceProxyBid) : undefined,
      monthlyVisits: integer(godaddy?.monthlyVisits),
      estimatedValue: currencyOK ? usd(godaddy?.estimatedValue) : undefined,
      parkingRevenue: currencyOK ? usd(godaddy?.parkingRevenue) : undefined,
      exactMatches: integer(estibot?.extensionsRegistered),
      developedMatches: integer(estibot?.extensionsDeveloped),
      similarRegistered: integer(estibot?.similarDomainsRegistered),
      similarDeveloped: integer(estibot?.similarDomainsDeveloped),
      authorityScore: score(semrush?.authorityScore),
      semrushBacklinks: integer(semrush?.totalBacklinks),
      semrushReferringDomains: integer(semrush?.referringDomainsCount),
      semrushReferringUrls: integer(semrush?.referringUrlsCount),
      keywordVolume: integer(semrush?.keywordMonthlySearchVolume),
      keywordCost: currencyOK ? usd(semrush?.keywordCostPerClick) : undefined,
      trustFlow: score(majestic?.trustFlow), citationFlow: score(majestic?.citationFlow),
      majesticBacklinks: integer(majestic?.backlinks),
      majesticReferringDomains: integer(majestic?.referringDomains),
    },
  };
};

const requestLiveAuction = async (domain: string, authorization: string, signal: AbortSignal) => {
  const response = await fetch(url, {
    signal,
    method: `POST`,
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    body: JSON.stringify({ domains: [domain] }),
    headers: { Authorization: authorization, Accept: `application/json`, 'Content-Type': `application/json` },
  });
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    if ([401, 403].includes(response.status)) throw new RegistrarRelayError(403, `GoDaddy Denied Auction Access For This Classic Key`);
    if (response.status === 429) throw new RegistrarRelayError(429, `GoDaddy Auction Rate Limit Reached — Try Again Shortly`);
    throw new RegistrarRelayError(502, `GoDaddy Live Auction Details Are Temporarily Unavailable`);
  }
  const raw = await readLimitedText(response.body, 65_536, signal, invalid());
  return readAvailability(JSON.parse(raw), domain);
};

export const handleLiveAuction = async (request: Request): Promise<Response> => {
  const reply = (error: string, status: number) => Response.json({ error }, { headers, status });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
  try {
    checkRequest(request);
    const { actor, owner } = await getRequestPlanAccess(request);
    if (!actor || !owner) throw new FeatureAccessError(403, `auction_preview_only`, `Domain Auctions Are Planned — Owner Preview Only`);
    const input = await readRequestRecord(request);
    const domain = normalizeAuctionDomain(input.domain);
    const id = input.connectionId;
    const number = typeof id === `string` && id.length <= 240 && !id.includes(`/`) ? getAppCollectionIDNumber(id, `Connection`) : 0;
    if (Object.keys(input).length !== 2 || !domain || domain !== input.domain || typeof id !== `string` || number < 1) {
      return reply(`Choose A Saved GoDaddy Connection And Auction Domain`, 400);
    }
    if (signal.aborted) return reply(`Auction Lookup Timed Out`, 504);
    const now = Date.now();
    for (const [key, entry] of usage) if (entry.expires <= now) usage.delete(key);
    const current = usage.get(actor.id);
    if (pending.size >= 8 || pending.has(actor.id) || (current?.count ?? 0) >= 8 || (!current && usage.size >= 256)) return reply(`Too Many Auction Lookups — Try Again Shortly`, 429);
    pending.add(actor.id);
    usage.set(actor.id, { count: (current?.count ?? 0) + 1, expires: current?.expires ?? now + minute });
    try {
      const reference = getBillingDatabase().doc(`users/${actor.id}/connections/${id}`);
      const saved = await reference.get();
      const connection = saved.data();
      if (connection?.provider !== `godaddy` || connection.id !== id || connection.number !== number || typeof connection.values !== `string`) {
        return reply(`This Saved GoDaddy Connection Is Unavailable`, 404);
      }
      let credentials: ReturnType<typeof parseCredentials>;
      try { credentials = parseCredentials(`godaddy`, connection.values); }
      catch { return reply(`Check The Saved GoDaddy Classic Key And Secret`, 400); }
      if (credentials.provider !== `godaddy` || !credentials.lookupAuthorization) return reply(`Save A GoDaddy Classic API Key And Secret To Check Live Auctions`, 403);
      const result = await requestLiveAuction(domain, credentials.lookupAuthorization, signal);
      const latest = await reference.get();
      if (!latest.exists || !saved.updateTime || !latest.updateTime?.isEqual(saved.updateTime)) return reply(`GoDaddy Connection Changed — Try Again`, 409);
      if (signal.aborted) return reply(`Auction Lookup Timed Out`, 504);
      return Response.json(result, { headers });
    } finally { pending.delete(actor.id); }
  } catch (failure) {
    if (signal.aborted) return reply(`Auction Lookup Timed Out`, 504);
    if (failure instanceof RegistrarRelayError) return reply(failure.message, failure.status);
    return reply(`GoDaddy Live Auction Details Are Temporarily Unavailable`, 502);
  }
};
