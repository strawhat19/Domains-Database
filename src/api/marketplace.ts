import { Platform } from 'react-native';
import { absoluteSiteUrl } from '../shared/seo';
import { getFirebaseAuth, getFirebaseDb } from '../shared/firebase/client';
import type { PublicProfilePortfolio, PublicProfileCardMetadata } from '../shared/publicDirectory/profilePortfolio';
import type { MarketplaceSellerPolicy, MarketplaceSellerPolicyChange } from '../shared/marketplace/sellerPolicy';
import { collection, getDocsFromServer, limit, onSnapshot, orderBy, query, startAfter, where } from 'firebase/firestore';
import type { ListingInput, MarketplaceListing, MarketplaceMessage, MarketplaceOffer, MarketplacePage, MarketplaceSellerProfile, MarketplaceSellerTools, MarketplaceThread, SellerListing } from '../shared/marketplace/types';

const endpoint = `/api/marketplace`;
const pageSize = 30;
const messageLimit = 50;
const signedIn = () => {
  try { const user = getFirebaseAuth().currentUser; return user?.isAnonymous ? null : user; } catch { return null; }
};
const request = async <Result>(parameters: Record<string, string> | URLSearchParams, account: `public` | `optional` | `required`, signal?: AbortSignal, body?: Record<string, unknown>): Promise<Result> => {
  const search = (parameters instanceof URLSearchParams ? parameters : new URLSearchParams(parameters)).toString();
  const path = search ? `${endpoint}?${search}` : endpoint;
  const url = Platform.OS === `web` ? path : absoluteSiteUrl(path);
  const user = account === `public` ? null : signedIn();
  if (account === `required` && !user) throw new Error(`Sign In To Use The Marketplace`);
  const token = user ? await user.getIdToken() : null;
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 20_000);
  if (signal?.aborted) abort();
  signal?.addEventListener(`abort`, abort, { once: true });
  try {
    const response = await fetch(url, { method: body ? `POST` : `GET`, body: body ? JSON.stringify(body) : undefined, signal: controller.signal, credentials: `omit`, cache: `no-store`, headers: {
      Accept: `application/json`, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': `application/json` } : {}),
    } });
    const data = await response.json().catch(() => null);
    if (user && signedIn() !== user) throw new Error(`Your Account Changed — Try Again`);
    if (!response.ok || !data) throw new Error(typeof data?.error === `string` ? data.error : `Marketplace Could Not Be Reached`);
    return data as Result;
  } finally { clearTimeout(timeout); signal?.removeEventListener(`abort`, abort); }
};
const get = <Result>(view: string, parameters: Record<string, string>, cursor: string | null | undefined, account: `public` | `optional` | `required`, signal?: AbortSignal) =>
  request<Result>({ view, ...parameters, ...(cursor ? { cursor } : {}) }, account, signal);
const post = <Result>(action: string, parameters: Record<string, unknown>) => request<Result>({}, `required`, undefined, { ...parameters, action });
const messages = (threadId: string) => collection(getFirebaseDb(), `marketplaceThreads`, threadId, `messages`);
const messageError = (failure: Error) => failure.message.includes(`index`) ? new Error(`Marketplace Messages Need The Published Firestore Indexes`) : new Error(`Marketplace Messages Could Not Be Loaded — Check Connection And Access`);

export const marketplaceAPI = {
  list: (search = ``, cursor?: string | null, signal?: AbortSignal) => get<MarketplacePage>(`browse`, { q: search }, cursor, `public`, signal),
  getListing: (id: string, signal?: AbortSignal) => get<MarketplaceListing>(`listing`, { id }, null, `public`, signal),
  getCheckoutMode: async (signal?: AbortSignal) => {
    const readiness = await get<{ mode?: unknown }>(`checkout-readiness`, {}, null, `public`, signal);
    return readiness.mode === `sandbox` || readiness.mode === `live` ? readiness.mode : null;
  },
  getSellerProfile: (username: string, cursor?: string | null, signal?: AbortSignal) => get<MarketplaceSellerProfile>(`profile`, { username }, cursor, `optional`, signal),
  getPublicProfileHandle: (id: string, signal?: AbortSignal) => get<{ username: string | null }>(`profile-handle`, { id }, null, `public`, signal),
  getPublicProfilePortfolio: async (id: string, signal?: AbortSignal) => {
    const result = await get<{ portfolio: PublicProfilePortfolio | null }>(`profile-portfolio`, { id }, null, `public`, signal);
    return result.portfolio;
  },
  getPublicProfileCardMetadata: async (ids: string[], signal?: AbortSignal) => {
    const parameters = new URLSearchParams({ view: `profile-card-metadata` });
    ids.forEach(id => parameters.append(`id`, id));
    const result = await request<{ profiles: PublicProfileCardMetadata[] }>(parameters, `public`, signal);
    if (!Array.isArray(result.profiles)) throw new Error(`Profile Details Could Not Be Loaded`);
    return result.profiles;
  },
  getSellerTools: (cursor?: string | null, signal?: AbortSignal) => get<MarketplaceSellerTools>(`seller`, {}, cursor, `required`, signal),
  getSellerPolicy: (signal?: AbortSignal) => get<MarketplaceSellerPolicy>(`seller-policy`, {}, null, `required`, signal),
  updateSellerPolicy: (change: MarketplaceSellerPolicyChange) => post<MarketplaceSellerPolicy>(`update-seller-policy`, { ...change }),
  createSellerProfile: (username: string) => post<{ username: string }>(`save-profile`, { username, previous: null }),
  updateSellerUsername: (previous: string, username: string) => post<{ username: string }>(`save-profile`, { previous, username }),
  saveListing: (listing: ListingInput, id?: string) => post<SellerListing>(`save-listing`, { ...listing, id }),
  setPublication: (id: string, active: boolean) => post<SellerListing>(active ? `publish-listing` : `pause-listing`, { id }),
  listThreads: (cursor?: string | null, signal?: AbortSignal) => get<{ threads: MarketplaceThread[]; nextCursor: string | null }>(`conversations`, {}, cursor, `required`, signal),
  getThread: (id: string, signal?: AbortSignal) => get<MarketplaceThread>(`thread`, { id }, null, `required`, signal),
  openThread: (id: string, amountCents?: number) => post<MarketplaceThread>(`open-thread`, { id, amountCents }),
  updateOffer: (id: string, status: `accepted` | `declined` | `withdrawn`) => post<MarketplaceOffer>(`update-offer`, { id, status }),
  sendMessage: (threadId: string, text: string, attemptId: string) => post<MarketplaceMessage>(`send-message`, { threadId, text, attemptId }),
  markThreadRead: (threadId: string, messageId: string) => post<{ number: number }>(`mark-read`, { threadId, messageId }),
  watchThreads: (userId: string, onChange: () => void, onError: (error: Error) => void) => onSnapshot(
    query(collection(getFirebaseDb(), `marketplaceThreads`), where(`participantIds`, `array-contains`, userId), orderBy(`updatedAt`, `desc`), limit(pageSize)),
    { includeMetadataChanges: true }, snapshot => { if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) onChange(); }, failure => onError(messageError(failure)),
  ),
  watchMessages: (threadId: string, onMessages: (records: MarketplaceMessage[]) => void, onError: (error: Error) => void) => onSnapshot(
    query(messages(threadId), orderBy(`number`, `desc`), limit(messageLimit)), { includeMetadataChanges: true },
    snapshot => { if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) onMessages(snapshot.docs.map(record => record.data() as MarketplaceMessage)); },
    failure => onError(messageError(failure)),
  ),
  getOlderMessages: async (threadId: string, beforeNumber: number) => {
    const snapshot = await getDocsFromServer(query(messages(threadId), orderBy(`number`, `desc`), startAfter(beforeNumber), limit(messageLimit)));
    return snapshot.docs.map(record => record.data() as MarketplaceMessage);
  },
};
