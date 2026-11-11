import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { marketplaceAPI } from '../../api/marketplace';
import { useAuth } from '../../shared/authContext/useAuth';
import { getMarketAuthParams, type MarketView } from '../../shared/marketRoutes';
import type { MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';
import { useMarketRouteParams } from '../../shared/marketplace/useMarketRouteParams';
import type { SuggestedListingFields } from './ListingSuggestions/useListingSuggestions';
import type { MarketplaceListing, MarketplacePage, MarketplaceThread } from '../../shared/marketplace/types';

export const marketError = (failure: unknown) => failure instanceof Error ? failure.message : `Marketplace Request Could Not Be Completed`;
export const marketPrice = (price: number) => new Intl.NumberFormat(`en-US`, { style: `currency`, currency: `USD`, maximumFractionDigits: price % 100 ? 2 : 0, minimumFractionDigits: price % 100 ? 2 : 0 }).format(price / 100);
export const marketCents = (text: string) => {
  const value = text.trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) throw new Error(`Enter A Valid USD Amount`);
  const cents = Math.round(Number(value) * 100);
  if (cents < 100 || cents > 99_999_999) throw new Error(`Enter An Amount From $1 To $999,999.99`);
  return cents;
};

const blankPage: MarketplacePage = { listings: [], nextCursor: null };
const noDismissedSuggestions: readonly string[] = [];
type BrowseResult = { scope: string; page: MarketplacePage; error: string };

export const useDomainMarket = () => {
  const router = useRouter();
  const params = useMarketRouteParams();
  const listingId = params.listing;
  const view = params.marketplaceView ?? (params.marketplaceOrder ? `orders` : params.marketplacePayout || params.sellDomain ? `sell` : `browse`);
  const { user, loginRevision, loading: authLoading } = useAuth();
  const account = user?.active === true && !user.anonymous && user.role !== `Guest` ? user : null;
  const accountScope = account ? `${account.id}:${loginRevision}` : ``;
  const [dismissals, setDismissals] = useState<{ scope: string; ids: readonly string[] } | null>(null);
  const [suggestion, setSuggestion] = useState<{ scope: string; domain: string; fields: SuggestedListingFields } | null>(null);
  const [conversation, setConversation] = useState<{ scope: string; thread: MarketplaceThread } | null>(null);
  const thread = conversation?.scope === accountScope ? conversation.thread : null;
  const [search, setSearch] = useState(``);
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState({ query: ``, sequence: 0 });
  const [checkoutMode, setCheckoutMode] = useState<MarketplacePaymentMode | null>();
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null);
  const [paginationScope, setPaginationScope] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ scope: string; listing: MarketplaceListing | null; error: string } | null>(null);
  const { query } = filter;
  const browseScope = `${revision}:${filter.sequence}`;
  const listingScope = listingId ? `${revision}:${listingId}` : ``;
  const currentBrowse = browseResult?.scope === browseScope ? browseResult : null;
  const page = currentBrowse?.page ?? blankPage;
  const error = currentBrowse?.error ?? ``;
  const loading = !currentBrowse;
  const loadingMore = paginationScope === browseScope;

  useEffect(() => {
    const controller = new AbortController();
    setCheckoutMode(undefined);
    void marketplaceAPI.getCheckoutMode(controller.signal).then(mode => {
      if (!controller.signal.aborted) setCheckoutMode(mode);
    }, () => {
      if (!controller.signal.aborted) setCheckoutMode(null);
    });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const controller = new AbortController();
    void marketplaceAPI.list(query, null, controller.signal).then(next => {
      if (!controller.signal.aborted) setBrowseResult({ scope: browseScope, page: next, error: `` });
    }, failure => {
      if (!controller.signal.aborted) setBrowseResult({ scope: browseScope, page: blankPage, error: marketError(failure) });
    });
    return () => controller.abort();
  }, [query, browseScope]);

  useEffect(() => {
    if (!listingId) return;
    const controller = new AbortController();
    void marketplaceAPI.getListing(listingId, controller.signal).then(listing => {
      if (!controller.signal.aborted) setSelection({ scope: listingScope, listing, error: `` });
    }, failure => {
      if (!controller.signal.aborted) setSelection({ scope: listingScope, listing: null, error: marketError(failure) });
    });
    return () => controller.abort();
  }, [listingId, listingScope]);

  const refresh = () => setRevision(current => current + 1);
  const loadMore = async () => {
    if (!page.nextCursor || loadingMore || loading) return;
    const cursor = page.nextCursor;
    setPaginationScope(browseScope);
    setBrowseResult(current => current?.scope === browseScope && current.error ? { ...current, error: `` } : current);
    try {
      const next = await marketplaceAPI.list(query, cursor);
      setBrowseResult(current => current?.scope === browseScope && current.page.nextCursor === cursor ? {
        ...current,
        page: { ...next, listings: [...new Map([...current.page.listings, ...next.listings].map(listing => [listing.id, listing])).values()] },
      } : current);
    } catch (failure) {
      setBrowseResult(current => current?.scope === browseScope ? { ...current, error: marketError(failure) } : current);
    } finally { setPaginationScope(current => current === browseScope ? null : current); }
  };
  const setView = (marketplaceView: MarketView) => router.setParams({ marketplaceView });
  const suggestListing = (domain: string, fields: SuggestedListingFields) => {
    if (!accountScope) return;
    setSuggestion({ scope: accountScope, domain, fields });
    setView(`sell`);
  };
  const dismissSuggestion = (id: string) => {
    if (!accountScope) return;
    setDismissals(current => {
      const ids = current?.scope === accountScope ? current.ids : noDismissedSuggestions;
      return ids.includes(id) ? current : { scope: accountScope, ids: [...ids, id] };
    });
  };
  const selectListing = (id?: string) => {
    if (id !== listingId) setSelection(null);
    router.setParams({ listing: id ?? ``, marketplaceView: `browse` });
  };
  const submitSearch = () => {
    const value = search.trim();
    if (value === query) refresh();
    else setFilter(current => ({ query: value, sequence: current.sequence + 1 }));
  };
  const showThread = (thread: MarketplaceThread) => { if (accountScope) { setConversation({ scope: accountScope, thread }); setView(`inbox`); } };
  const showOrder = (id: string) => router.setParams({ marketplaceOrder: id, marketplaceView: `orders` });
  const currentSelection = selection?.scope === listingScope ? selection : null;
  const currentSuggestion = suggestion?.scope === accountScope ? suggestion : null;

  return {
    page, view, error, query, search, thread, account, loading, listingId, authLoading, accountScope, checkoutMode, loadingMore, currentSelection,
    setView, refresh, loadMore, setSearch, showOrder, showThread, selectListing, submitSearch, suggestListing,
    dismissSuggestion,
    dismissedSuggestionIds: dismissals?.scope === accountScope ? dismissals.ids : noDismissedSuggestions,
    orderId: params.marketplaceOrder,
    sellFields: currentSuggestion?.fields,
    sellDomain: currentSuggestion?.domain ?? params.sellDomain,
    authParams: getMarketAuthParams(params, view),
  };
};
