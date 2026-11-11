import { api } from '../../api';
import { authAPI } from '../../api/auth';
import { marketplaceAPI } from '../../api/marketplace';
import type { DomainRecord } from '../../shared/types';
import { useAuth } from '../../shared/authContext/useAuth';
import { useRef, useMemo, useState, useEffect } from 'react';
import { marketCents, marketError } from './useDomainMarket';
import { normalizeDomainName } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getListingFields, type SuggestedListingFields } from './listingFields';
import type { MarketplaceSellerTools, SellerListing } from '../../shared/marketplace/types';
import { normalizeSellerUsername, sellerProfilePath, sellerUsernamePattern } from '../../shared/marketplace/paths';

export const publicSellerProfileTitle = `Make Your Profile Public`;
export const publicSellerProfileHint = `Anyone can see your name, photo, bio, domain count, and the domain names you choose to show on your profile.`;
export const sellerUrlHint = `Use 3–30 letters or numbers for the public link buyers will use to find your profile.`;

const emptyDraft = (domain = ``, fields?: SuggestedListingFields) => ({
  domain, price: fields?.price ?? ``, description: fields?.description ?? ``, acceptOffers: true, id: undefined as string | undefined,
});
type SellerToolsResult = { privacy: MarketplaceSellerTools[`profilePrivacy`] | undefined; tools: MarketplaceSellerTools };

export const useMarketSeller = (initialDomain?: string, onChange?: () => void, initialFields?: SuggestedListingFields) => {
  const { user, refreshUser } = useAuth();
  const portfolio = useDomains();
  const running = useRef(false);
  const [toolsResult, setToolsResult] = useState<SellerToolsResult | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(initialDomain, initialFields));
  const untouchedDraft = useRef(draft);
  const didPrefill = useRef(Boolean(initialFields));
  const [username, setUsername] = useState(``);
  const [pending, setPending] = useState(``);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [revision, setRevision] = useState(0);
  const profilePrivacy = user?.profilePrivacy;
  const tools = toolsResult?.privacy === profilePrivacy ? toolsResult?.tools ?? null : null;
  const listings = tools?.listings;
  const listedDomainNames = useMemo(() => listings?.map(listing => listing.domain), [listings]);
  const requiresPublicProfile = profilePrivacy !== `public` || tools?.profilePrivacy === `private`;
  const eligible = !requiresPublicProfile && tools?.profilePrivacy === `public` && tools.eligible;
  const normalizedUsername = normalizeSellerUsername(username);
  const validUsername = sellerUsernamePattern.test(normalizedUsername);
  const usernamePreview = sellerProfilePath(validUsername ? normalizedUsername : `username`);
  const reload = () => { setError(``); setRevision(current => current + 1); };

  useEffect(() => {
    if (!initialDomain || !user?.id || didPrefill.current) return;
    const accountId = user.id;
    let name: string;
    try { name = normalizeDomainName(initialDomain); } catch { return; }
    let active = true;
    const prefill = (records: DomainRecord[]) => {
      if (!active || didPrefill.current) return;
      const matches = records.filter(record => record.uid === accountId && !record.isSample && record.name === name);
      const match = matches[0];
      if (matches.length !== 1 || !match) return;
      didPrefill.current = true;
      const { fields } = getListingFields(match);
      setDraft(current => current === untouchedDraft.current ? emptyDraft(name, fields) : current);
    };
    if (portfolio.loaded && !portfolio.error) prefill(portfolio.domains);
    else void api.getDomains().then(prefill, () => undefined);
    return () => { active = false; };
  }, [initialDomain, portfolio.domains, portfolio.error, portfolio.loaded, user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    void marketplaceAPI.getSellerTools(null, controller.signal).then(next => {
      if (!controller.signal.aborted) setToolsResult({ privacy: profilePrivacy, tools: next });
    }, failure => {
      if (!controller.signal.aborted) setError(marketError(failure));
    });
    return () => controller.abort();
  }, [revision, profilePrivacy]);

  const run = async (action: string, operation: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setPending(action);
    setError(``);
    setNotice(``);
    try { await operation(); } catch (failure) { setError(marketError(failure)); }
    finally { running.current = false; setPending(``); }
  };
  const makeProfilePublic = () => user && requiresPublicProfile && run(`visibility`, async () => {
    const updated = await authAPI.updateProfile({ profilePrivacy: `public` }, user.id);
    if (updated.id !== user.id || updated.profilePrivacy !== `public`) throw new Error(`Profile Visibility Could Not Be Confirmed`);
    await refreshUser();
    setToolsResult(null);
    reload();
  });
  const saveUsername = () => eligible && !tools?.username && run(`profile`, async () => {
    if (!validUsername) throw new Error(`Use 3 To 30 Letters Or Numbers For Your Seller URL`);
    await marketplaceAPI.createSellerProfile(normalizedUsername);
    setToolsResult(null);
    reload();
    setNotice(`Seller URL Saved`);
  });
  const save = () => eligible && run(`save`, async () => {
    await marketplaceAPI.saveListing({ domain: draft.domain, description: draft.description, acceptOffers: draft.acceptOffers, priceCents: draft.price.trim() ? marketCents(draft.price) : null }, draft.id);
    setDraft(emptyDraft());
    reload();
    onChange?.();
    setNotice(draft.id ? `Listing Updated` : `Draft Saved — Verify DNS To Publish`);
  });
  const edit = (record: SellerListing) => {
    if (eligible) setDraft({ id: record.id, domain: record.domain, description: record.description, acceptOffers: record.acceptOffers, price: record.priceCents === null ? `` : (record.priceCents / 100).toFixed(2) });
  };
  const selectSuggestedDomain = (domain: string, fields: SuggestedListingFields) => {
    if (!eligible || !tools?.username || running.current) return;
    setDraft(current => !current.id && current.domain === domain ? {
      ...current, price: current.price || fields.price, description: current.description || fields.description,
    } : emptyDraft(domain, fields));
  };
  const publish = (record: SellerListing) => run(record.id, async () => {
    const active = record.status !== `active`;
    if (active && !eligible) return;
    await marketplaceAPI.setPublication(record.id, active);
    reload();
    onChange?.();
    setNotice(active ? `Domain Published` : `Listing Paused`);
  });
  const loadMore = () => run(`more`, async () => {
    const cursor = tools?.nextCursor;
    if (!cursor) return;
    const next = await marketplaceAPI.getSellerTools(cursor);
    setToolsResult(current => current?.privacy === profilePrivacy && current?.tools.nextCursor === cursor ? {
      privacy: profilePrivacy,
      tools: { ...next, listings: [...new Map([...current.tools.listings, ...next.listings].map(record => [record.id, record])).values()] },
    } : current);
  });
  return { tools, draft, username, pending, error, notice, reload, setDraft, setUsername, saveUsername, save, edit, publish, loadMore, eligible, listedDomainNames, requiresPublicProfile, validUsername, usernamePreview, makeProfilePublic, selectSuggestedDomain, clearDraft: () => setDraft(emptyDraft()) };
};
