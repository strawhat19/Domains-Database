import './styles.scss';
import { Link } from 'expo-router';
import { marketViews } from './marketViews';
import MarketSkeleton from './MarketSkeleton';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import ListingSuggestions from './ListingSuggestions';
import ExternalMarketListings from './ExternalMarketListings.web';
import { marketPrice, useDomainMarket } from './useDomainMarket';
import { useExternalMarketListings } from './useExternalMarketListings';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import type { SuggestedListingFields } from './ListingSuggestions/useListingSuggestions';
import { ArrowRight, BadgeCheck, ChevronRight, Globe2, MessageSquare, Package, Plus, Search, Store, Tag } from 'lucide-react';
import { MarketAvatar, MarketplaceListingPanel, MarketplaceInbox, MarketplaceOrders, MarketplaceSeller } from './Workspace.web';

const views = [
  { id: `browse`, Icon: Search },
  { id: `sell`, Icon: Tag },
  { id: `inbox`, Icon: MessageSquare },
  { id: `orders`, Icon: Package },
] as const;
const artwork = { browse: Globe2, sell: Tag, inbox: MessageSquare, orders: Package };

const DomainMarket = () => {
  const state = useDomainMarket();
  const { account, accountScope, authLoading, checkoutMode, currentSelection, listingId, page, view } = state;
  const listingDetail = view === `browse` && Boolean(listingId);
  const browse = view === `browse` && !listingDetail;
  const external = useExternalMarketListings(browse, state.query, page.listings.map(listing => listing.domain));
  const hero = marketViews[view];
  const ArtworkIcon = artwork[view];
  const signUp = { pathname: `/signup` as const, params: state.authParams };
  const signIn = { ...signUp, pathname: `/signin` as const };
  const suggestListing = (domain: string, fields: SuggestedListingFields) => { state.suggestListing(domain, fields); window.scrollTo({ top: 0, behavior: `instant` }); };

  return (
    <section id={`domain-market`} className={`domain-market`} aria-labelledby={`domain-market-title`}>
      <header id={`domain-market-heading`} className={`market-hero${listingDetail ? ` market-hero--compact` : ``}`} data-scroll-hero={!listingDetail || undefined}>
        {!listingDetail ? <>
          <DiscoveryBackdrop suffix={`market-hero`} />
          <div id={`market-hero-art`} className={`market-hero-art`} aria-hidden><ArtworkIcon size={174} strokeWidth={.7} /></div>
        </> : null}
        <div id={`domain-market-heading-text`} className={`market-hero-copy`}>
          {!listingDetail ? <p id={`market-hero-label`} className={`market-hero-label`}><Store size={17} aria-hidden />Domain Marketplace</p> : null}
          <h1 id={`domain-market-title`}>{listingDetail ? `Domain Marketplace` : hero.title}</h1>
          {!listingDetail ? <p id={`market-hero-description`} className={`market-hero-description`}>{hero.description}</p> : null}
          {browse ? (
            <div id={`market-hero-actions`} className={`market-hero-actions`}>
              <form id={`market-search-form`} className={`market-search`} onSubmit={event => { event.preventDefault(); state.submitSearch(); }}>
                <label id={`market-search-label`} className={`market-search-field`} htmlFor={`market-search-input`}><Search size={18} aria-hidden /><input id={`market-search-input`} className={`market-input`} type={`search`} placeholder={`Search by domain or prefix`} aria-label={`Search Domains`} maxLength={253} value={state.search} onChange={event => state.setSearch(event.currentTarget.value)} /></label>
                <button id={`market-search-submit`} className={`market-button market-primary`} type={`submit`}>Search</button>
              </form>
              <button id={`domain-market-list-action`} className={`market-button market-hero-sell`} type={`button`} onClick={() => state.setView(`sell`)}><Plus size={17} aria-hidden />List A Domain</button>
            </div>
          ) : null}
        </div>
      </header>
      <nav id={`domain-market-tools`} className={`market-tools`} aria-label={`Marketplace Tools`}>
        {views.map(({ id, Icon }) => <button key={id} id={`domain-market-view-${id}`} className={`market-tool`} type={`button`} aria-current={id === view ? `page` : undefined} onClick={() => state.setView(id)}><Icon size={15} aria-hidden />{marketViews[id].label}</button>)}
      </nav>
      {view !== `browse` && authLoading && !account ? <MarketSkeleton kind={view} label={`Checking Account`} /> : null}
      {view !== `browse` && !authLoading && !account ? <div id={`domain-market-signin`} className={`market-state market-auth`}>
        <p>{view === `sell` ? `Sign in to check your seller eligibility.` : `Sign in to see your offers, conversations, and orders.`}</p>
        <div className={`market-actions`}><Link id={`market-signup-link`} className={`market-button market-primary`} href={signUp}>Sign Up Free <ArrowRight size={14} aria-hidden /></Link><Link id={`market-signin-link`} className={`market-button`} href={signIn}>Sign In</Link></div>
      </div> : null}
      {view === `sell` && account ? <MarketplaceSeller
        refresh={state.refresh}
        onDismiss={state.dismissSuggestion}
        initialDomain={state.sellDomain}
        initialFields={state.sellFields}
        key={`${accountScope}:${state.sellDomain ?? ``}`}
        dismissedIds={state.dismissedSuggestionIds}
      /> : null}
      {view === `inbox` && account ? <MarketplaceInbox key={`${accountScope}:${state.thread?.id ?? ``}`} accountId={account.id} initialThread={state.thread} onOrder={state.showOrder} checkoutMode={checkoutMode} /> : null}
      {view === `orders` && account ? <MarketplaceOrders key={accountScope} accountId={account.id} orderId={state.orderId} onChat={state.showThread} checkoutMode={checkoutMode} /> : null}
      {view === `browse` && listingId ? <MarketplaceListingPanel
        key={`${accountScope}:${listingId}`}
        signIn={signIn}
        signUp={signUp}
        account={!!account}
        onChat={state.showThread}
        onOrder={state.showOrder}
        onClose={() => state.selectListing()}
        error={currentSelection?.error}
        listing={currentSelection?.listing}
        authLoading={authLoading}
        checkoutMode={checkoutMode}
      /> : null}
      {browse ? <div id={`market-browse-layout`} className={`market-browse-layout`}>
      <div id={`market-browse-results`} className={`market-browse-results`}>
      <section id={`market-public-listings`} className={`market-public`} aria-labelledby={`market-public-title`}>
        <div id={`market-public-heading`} className={`market-public-heading`}>
          <h2 id={`market-public-title`}>{state.query ? `Results for “${state.query}”` : `Domains for sale`}</h2>
        </div>
        {state.error ? <div className={`market-state`} role={`alert`}><p>{state.error}</p><button className={`market-button`} type={`button`} onClick={state.refresh}>Retry</button></div> : null}
        {state.loading && !state.error && !page.listings.length ? <MarketSkeleton kind={`browse`} label={`Loading Domains`} /> : null}
        {!state.loading && !state.error && !page.listings.length ? (
          <div id={`market-public-empty`} className={`market-state market-public-empty${state.query ? `` : ` market-public-empty--centered`}`}>
            {state.query ? <>
              <Globe2 size={27} aria-hidden />
              <h3>{`No Domains Database listings match your search`}</h3>
              <p>{`Try a different domain name or prefix.`}</p>
            </> : <>
              <h3 id={`market-public-empty-heading`} className={`market-public-empty-heading`}><Globe2 size={20} aria-hidden />{`No domains published on this marketplace yet`}</h3>
              <button
                type={`button`}
                id={`market-public-empty-list-action`}
                className={`market-button market-primary`}
                onClick={() => state.setView(`sell`)}
              ><Plus size={15} aria-hidden />{`List a Domain`}</button>
            </>}
          </div>
        ) : null}
        {page.listings.length ? <ul id={`market-listings`} className={`market-listings`}>
          {page.listings.map(listing => {
            const id = `market-listing-${listing.id}`;
            return <li key={listing.id} id={id} className={`market-listing`}>
              <span id={`${id}-icon`} className={`market-domain-icon`} aria-hidden><Globe2 size={19} /></span>
              <div id={`${id}-identity`} className={`market-listing-identity`}>
                <button id={`${id}-open`} className={`market-domain-name`} type={`button`} onClick={() => state.selectListing(listing.id)}>{listing.domain}<BadgeCheck size={15} aria-label={`DNS Verified`} /></button>
                <Link id={`${id}-seller`} className={`market-seller-link`} href={sellerProfilePath(listing.sellerUsername)}><MarketAvatar id={`${id}-seller`} name={listing.sellerName ?? listing.sellerUsername} photo={listing.sellerPhotoURL} />{listing.sellerName ?? `@${listing.sellerUsername}`}</Link>
              </div>
              <div id={`${id}-price`} className={`market-listing-price`}><strong>{listing.priceCents !== null ? marketPrice(listing.priceCents) : listing.acceptOffers ? `Make An Offer` : `Sale Pending`}</strong>{listing.priceCents !== null && listing.acceptOffers ? <small>Also Accepts Offers</small> : null}</div>
              <button id={`${id}-details`} className={`market-button market-icon-button`} type={`button`} aria-label={`View ${listing.domain}`} title={`View Listing`} onClick={() => state.selectListing(listing.id)}><ChevronRight size={19} aria-hidden /></button>
            </li>;
          })}
        </ul> : null}
        {page.nextCursor ? <button id={`market-load-more`} className={`market-button market-load-more`} type={`button`} disabled={state.loadingMore} onClick={() => void state.loadMore()}>{state.loadingMore ? `Loading…` : `Load More Domains`}</button> : null}
      </section>
      {!state.loading || external.status !== `loading` ? <ExternalMarketListings query={state.query} discovery={external} /> : null}
      </div>
      {account ? <ListingSuggestions onSelect={suggestListing} onDismiss={state.dismissSuggestion} dismissedIds={state.dismissedSuggestionIds} /> : null}
      </div> : null}
    </section>
  );
};

export default DomainMarket;
