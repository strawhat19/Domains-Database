import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketplaceSellerTools, SellerListing } from '../../shared/marketplace/types';
import { AfternicRequestError, requestMarketplaceAfternic } from '../../shared/marketplaceAfternic/client';
import type { AfternicActionResult, AfternicPortfolioPage, AfternicPublishReview } from '../../shared/marketplaceAfternic/types';

export interface MarketplaceAfternicProps {
  onImport: () => void;
  seller?: MarketplaceSellerTools | null;
}

const usd = new Intl.NumberFormat(`en-US`, { currency: `USD`, style: `currency`, maximumFractionDigits: 2 });
export const afternicMoney = (cents: number | null) => cents === null ? `Price On Request` : usd.format(cents / 100);
export const isAfternicCandidate = (listing: SellerListing) => listing.status === `draft` || listing.status === `paused`;
const activeFirst = (page: AfternicPortfolioPage): AfternicPortfolioPage => ({
  ...page, listings: [...page.listings].sort((a, b) => Number(b.status === `ACTIVE`) - Number(a.status === `ACTIVE`) || a.domain.localeCompare(b.domain)),
});

export const useMarketplaceAfternic = (onImport: () => void) => {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(`status`);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [imported, setImported] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ configured: boolean } | null>(null);
  const [review, setReview] = useState<AfternicPublishReview | null>(null);
  const [results, setResults] = useState<Record<string, AfternicActionResult>>({});
  const [portfolio, setPortfolio] = useState<AfternicPortfolioPage | null>(null);
  const pending = useRef<AbortController | null>(null);

  const perform = useCallback(async <Value,>(id: string, request: (signal: AbortSignal) => Promise<Value>, apply: (value: Value) => void, onSettled?: () => void) => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(id);
    setError(``);
    setNotice(``);
    try {
      const value = await request(controller.signal);
      if (!controller.signal.aborted) apply(value);
    } catch (failure) {
      if (!controller.signal.aborted) {
        if ((id === `status` || id === `portfolio`) && failure instanceof AfternicRequestError && [401, 403].includes(failure.status)) {
          setStatus({ configured: false });
          setPortfolio(null);
        } else setError(failure instanceof Error ? failure.message : `Afternic Request Could Not Be Completed`);
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        if (!controller.signal.aborted) {
          setBusy(``);
          onSettled?.();
        }
      }
    }
  }, []);

  const refresh = useCallback(() => perform(`status`, async signal => {
    const connection = await requestMarketplaceAfternic(`status`, {}, signal);
    if (signal.aborted) return null;
    if (typeof connection.configured !== `boolean`) throw new Error(`Afternic Connection Status Could Not Be Confirmed`);
    setStatus(connection);
    if (!connection.configured) return null;
    setBusy(`portfolio`);
    return activeFirst(await requestMarketplaceAfternic(`portfolio`, { offset: 0 }, signal));
  }, setPortfolio), [perform]);

  useEffect(() => {
    void refresh();
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [refresh]);

  const toggle = () => setOpen(previous => !previous);
  const load = (offset: number) => perform(`portfolio`, signal => requestMarketplaceAfternic(`portfolio`, { offset }, signal), page => {
    setPortfolio(previous => activeFirst(offset && previous ? {
      ...page,
      skipped: previous.skipped + page.skipped,
      listings: [...new Map([...previous.listings, ...page.listings].map(listing => [listing.domain, listing])).values()],
    } : page));
  });
  const importDraft = (domain: string) => perform(`import`, signal => requestMarketplaceAfternic(`import`, { domain }, signal), listing => {
    setImported(previous => ({ ...previous, [domain]: listing.id }));
    setNotice(listing.status === `draft` ? `Afternic Domain Saved To Drafts` : `Existing Listing Linked To Afternic`);
  }, onImport);
  const reviewListing = (listingId: string) => perform(`review`, signal => requestMarketplaceAfternic(`review`, { listingId }, signal), setReview);
  const saveResult = (listingId: string, result: AfternicActionResult) => {
    setReview(null);
    setResults(previous => ({ ...previous, [listingId]: result }));
    setNotice(result.providerListing ? result.created ? `Listing Sent To Afternic` : `Afternic Listing Status Confirmed` : `Afternic Confirmed The Domain Is Absent`);
  };
  const publish = ({ listingId, priceCents, acceptOffers }: AfternicPublishReview) => {
    setReview(null);
    return perform(`publish`, signal => requestMarketplaceAfternic(`publish`, { listingId, priceCents, acceptOffers }, signal), result => saveResult(listingId, result), onImport);
  };
  const check = (listingId: string) => perform(`check`, signal => requestMarketplaceAfternic(`check`, { listingId }, signal), result => saveResult(listingId, result), onImport);

  return { open, busy, error, notice, status, portfolio, imported, results, review, toggle, refresh, load, importDraft, reviewListing, publish, check, clearReview: () => setReview(null) };
};
