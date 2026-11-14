import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../seo';
import { getFirebaseAuth } from '../firebase/client';
import { liveAuctionMetrics, isLiveAuctionCode, isLiveAuctionListingId, isLiveAuctionPattern, type LiveAuction } from './live';

const object = (value: unknown): Record<string, unknown> | null => value && typeof value === `object` && !Array.isArray(value) ? value as Record<string, unknown> : null;
const date = (value: unknown) => typeof value === `string` && value.length <= 40 && Number.isFinite(Date.parse(value));

export const checkLiveAuction = async (domain: string, connectionId: string, signal: AbortSignal): Promise<LiveAuction> => {
  const auth = getFirebaseAuth();
  const actor = auth.currentUser;
  if (!actor || actor.isAnonymous) throw new Error(`Sign In To Check Live Auctions`);
  const token = await actor.getIdToken();
  if (auth.currentUser !== actor || signal.aborted) throw new Error(`Auction Lookup Cancelled`);
  const path = `/api/auction-availability`;
  const response = await fetch(Platform.OS === `web` ? path : absoluteSiteUrl(path), {
    signal,
    method: `POST`,
    cache: `no-store`,
    redirect: `error`,
    credentials: `omit`,
    body: JSON.stringify({ domain, connectionId }),
    headers: { Accept: `application/json`, 'Content-Type': `application/json`, Authorization: `Bearer ${token}` },
  });
  const input = object(await response.json().catch(() => null));
  if (auth.currentUser !== actor || signal.aborted) throw new Error(`Auction Lookup Cancelled`);
  if (!response.ok) throw new Error(typeof input?.error === `string` && input.error.length <= 240 ? input.error : `Live Auction Details Could Not Be Loaded`);
  const metrics = object(input?.metrics);
  if (!input || input.domain !== domain || typeof input.available !== `boolean` || !date(input.checkedAt) || !metrics
    || Object.entries(metrics).some(([key, value]) => !Object.hasOwn(liveAuctionMetrics, key) || typeof value !== `number` || !Number.isFinite(value) || value < 0)
    || [input.endsAt, input.beginsAt, input.expiresAt, input.createdAt, input.transfersAt].some(value => value !== undefined && !date(value))
    || [input.watching, input.extended].some(value => value !== undefined && typeof value !== `boolean`)
    || [input.memberStatus, input.listingType].some(value => value !== undefined && !isLiveAuctionCode(value))
    || (input.listingId !== undefined && !isLiveAuctionListingId(input.listingId))
    || (input.characterPattern !== undefined && !isLiveAuctionPattern(input.characterPattern))
    || (input.referers !== undefined && (!Array.isArray(input.referers) || input.referers.length > 5 || input.referers.some(value => {
      const referer = object(value);
      return typeof referer?.domain !== `string` || !/^[a-z0-9.-]{1,253}$/.test(referer.domain)
        || typeof referer.links !== `number` || !Number.isSafeInteger(referer.links) || referer.links < 0;
    })))) throw new Error(`Live Auction Details Could Not Be Read`);
  return input as unknown as LiveAuction;
};
