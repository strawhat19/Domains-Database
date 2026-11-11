import { BillingError } from '../billing/types';
import { DomainDataError, readDomainDataText } from '../domainData/request';
import { MarketplaceError, getMarketplaceSellerPolicy, requireMarketplaceActor, updateMarketplaceSellerPolicy } from './access';
import { invalid, marketId } from './records';
import { getPublicProfileCardMetadata } from './profileCards';
import { getPublicProfilePortfolio } from '../portfolio/publicProfile';
import { PUBLIC_PROFILE_LIMIT } from '../../shared/publicDirectory/profiles';
import { getMarketplaceCheckoutReadiness } from '../marketplacePayments/config';
import { getMarketplaceThread, listMarketplaceThreads, markMarketplaceThreadRead, openMarketplaceThread, sendMarketplaceMessage, updateMarketplaceOffer } from './conversations';
import { getMarketplaceListing, getPublicProfileHandle, getSellerProfile, getSellerTools, listMarketplace, saveMarketplaceListing, saveSellerUsername, setMarketplacePublication } from './listings';

const headers = { Vary: `Authorization`, 'Cache-Control': `private, no-store`, 'X-Content-Type-Options': `nosniff` };
const result = (data: unknown) => Response.json(data, { headers });
const error = (failure: unknown) => {
  const known = failure instanceof MarketplaceError || failure instanceof DomainDataError;
  if (failure instanceof Error && (failure as { code?: unknown }).code === 9 && /index/i.test(failure.message)) {
    return Response.json({ error: `Marketplace Firestore Indexes Are Missing Or Still Building` }, { headers, status: 503 });
  }
  const unavailable = failure instanceof BillingError && failure.status === 503 ? `Marketplace Server Is Not Configured` : `Marketplace Is Temporarily Unavailable — Try Again`;
  return Response.json({ error: known ? failure.message : unavailable }, { headers, status: known ? failure.status : 503 });
};
const readInput = async (request: Request) => {
  if (request.headers.get(`origin`) && request.headers.get(`origin`) !== new URL(request.url).origin) throw new MarketplaceError(403, `Cross-Origin Marketplace Requests Are Not Allowed`);
  if (request.headers.get(`content-type`)?.split(`;`)?.[0]?.trim() !== `application/json`) throw new MarketplaceError(415, `Send Marketplace Requests As JSON`);
  const length = request.headers.get(`content-length`);
  if (length && (!/^\d+$/.test(length) || Number(length) > 16_384)) throw new MarketplaceError(413, `Marketplace Request Is Too Large`);
  const raw = await readDomainDataText(new Response(request.body), request.signal);
  if (Buffer.byteLength(raw) > 16_384) throw new MarketplaceError(413, `Marketplace Request Is Too Large`);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw invalid(); }
  if (!body || typeof body !== `object` || Array.isArray(body)) throw invalid();
  return body as Record<string, unknown>;
};

export const handleMarketplaceGet = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get(`view`);
    const cursor = searchParams.get(`cursor`);
    if (view === `browse`) return result(await listMarketplace(searchParams.get(`q`) ?? ``, cursor));
    if (view === `listing`) return result(await getMarketplaceListing(searchParams.get(`id`)));
    if (view === `profile-handle`) return result(await getPublicProfileHandle(searchParams.get(`id`)));
    if (view === `profile-portfolio`) return result({ portfolio: await getPublicProfilePortfolio(marketId(searchParams.get(`id`), `User`)) });
    if (view === `profile-card-metadata`) {
      const ids = searchParams.getAll(`id`);
      if (!ids.length || ids.length > PUBLIC_PROFILE_LIMIT) throw invalid(`Choose Up To ${PUBLIC_PROFILE_LIMIT} Public Profiles`);
      const profileIds = [...new Set(ids.map(id => marketId(id, `User`)))];
      return result({ profiles: await getPublicProfileCardMetadata(profileIds) });
    }
    if (view === `checkout-readiness`) return result(getMarketplaceCheckoutReadiness(request));
    if (view === `profile`) {
      const actor = request.headers.has(`authorization`) ? await requireMarketplaceActor(request) : null;
      return result(await getSellerProfile(searchParams.get(`username`), cursor, actor));
    }
    const actor = await requireMarketplaceActor(request);
    if (view === `seller-policy`) return result(await getMarketplaceSellerPolicy(actor));
    if (view === `seller`) return result(await getSellerTools(actor, cursor));
    if (view === `thread`) return result(await getMarketplaceThread(actor, searchParams.get(`id`)));
    if (view === `conversations`) return result(await listMarketplaceThreads(actor, cursor));
    throw invalid();
  } catch (failure) { return error(failure); }
};

export const handleMarketplacePost = async (request: Request) => {
  try {
    const actor = await requireMarketplaceActor(request);
    const body = await readInput(request);
    switch (body.action) {
      case `update-seller-policy`: return result(await updateMarketplaceSellerPolicy(actor, body));
      case `save-profile`: return result(await saveSellerUsername(actor, body.previous, body.username));
      case `save-listing`: return result(await saveMarketplaceListing(actor, body));
      case `publish-listing`: return result(await setMarketplacePublication(actor, body.id, true));
      case `pause-listing`: return result(await setMarketplacePublication(actor, body.id, false));
      case `open-thread`: return result(await openMarketplaceThread(actor, body.id, body.amountCents));
      case `update-offer`: return result(await updateMarketplaceOffer(actor, body.id, body.status));
      case `send-message`: return result(await sendMarketplaceMessage(actor, body));
      case `mark-read`: return result(await markMarketplaceThreadRead(actor, body));
      default: throw invalid();
    }
  } catch (failure) { return error(failure); }
};
