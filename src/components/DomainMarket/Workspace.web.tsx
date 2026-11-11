import { routes } from '../../shared/routes';
import { Link, type Href } from 'expo-router';
import MarketSkeleton from './MarketSkeleton';
import ListingSuggestions from './ListingSuggestions';
import { useEffect, useRef, useState } from 'react';
import { useMarketInbox } from './useMarketInbox';
import MarketplaceAfternic from '../MarketplaceAfternic';
import { marketplaceAPI } from '../../api/marketplace';
import { marketCents, marketError, marketPrice } from './useDomainMarket';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import type { MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';
import type { ListingSuggestionsProps, SuggestedListingFields } from './ListingSuggestions/useListingSuggestions';
import type { MarketplaceListing, MarketplaceThread } from '../../shared/marketplace/types';
import { useMarketSeller, publicSellerProfileHint, publicSellerProfileTitle, sellerUrlHint } from './useMarketSeller';
import { marketCheckoutSandbox, marketCheckoutUnavailable, useMarketCheckout, useMarketOrders } from './useMarketPayments';
import { ArrowLeft, ArrowUpRight, BadgeCheck, Check, CircleDollarSign, Globe2, Link2, MessageSquare, Pencil, Send } from 'lucide-react';

export const MarketAvatar = ({ id, name, photo }: { id: string; name: string; photo?: string }) => {
  const [failed, setFailed] = useState(``);
  return <span id={`${id}-avatar`} className={`market-avatar`} aria-hidden>{name[0]?.toUpperCase() || `S`}{photo && failed !== photo ? <img id={`${id}-photo`} className={`market-avatar-photo`} src={photo} alt={``} referrerPolicy={`no-referrer`} onError={() => setFailed(photo)} /> : null}</span>;
};

type CheckoutProps = { checkoutMode?: MarketplacePaymentMode | null };
type ListingPanelProps = CheckoutProps & { listing?: MarketplaceListing | null; error?: string; account: boolean; authLoading: boolean; signIn: Href; signUp: Href; onClose: () => void; onOrder: (id: string) => void; onChat: (thread: MarketplaceThread) => void };
export const MarketplaceListingPanel = ({ listing, error, account, authLoading, signIn, signUp, onClose, onOrder, onChat, checkoutMode }: ListingPanelProps) => {
  const [offer, setOffer] = useState(``);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState(``);
  const { checkout, pending: checkoutPending, error: checkoutError } = useMarketCheckout();
  const open = async (makeOffer = false) => {
    if (!listing || pending) return;
    setPending(true);
    setActionError(``);
    try { onChat(await marketplaceAPI.openThread(listing.id, makeOffer ? marketCents(offer) : undefined)); }
    catch (failure) { setActionError(marketError(failure)); }
    finally { setPending(false); }
  };

  return <section id={`market-listing-detail`} className={`market-workspace`} aria-label={`Listing Details`}>
    <button id={`market-listing-back`} className={`market-button`} type={`button`} onClick={onClose}><ArrowLeft size={15} aria-hidden />Browse Domains</button>
    {error ? <p className={`market-error`} role={`alert`}>{error}</p> : !listing ? <MarketSkeleton kind={`listing`} label={`Loading Listing`} /> : <>
      <div id={`market-detail-title`} className={`market-detail-title`}><Globe2 size={25} aria-hidden /><h2>{listing.domain}</h2><BadgeCheck size={21} aria-label={`DNS Verified`} /></div>
      <Link className={`market-seller-link`} href={sellerProfilePath(listing.sellerUsername)}><MarketAvatar id={`market-detail-seller`} name={listing.sellerName ?? listing.sellerUsername} photo={listing.sellerPhotoURL} />{listing.sellerName ?? `@${listing.sellerUsername}`}<ArrowUpRight size={13} aria-hidden /></Link>
      {listing.description ? <p className={`market-description`}>{listing.description}</p> : null}
      {listing.priceCents !== null ? <strong className={`market-detail-price`}>{marketPrice(listing.priceCents)} USD</strong> : !listing.acceptOffers ? <p>Sale Pending</p> : null}
      {listing.priceCents !== null && (checkoutMode === null || checkoutMode === `sandbox`) ? <p id={`market-listing-checkout-status`} className={`market-muted`}>{checkoutMode === null ? marketCheckoutUnavailable : marketCheckoutSandbox}</p> : null}
      {authLoading && !account ? <MarketSkeleton kind={`actions`} label={`Checking Account`} /> : null}
      {!authLoading && !account ? <div id={`market-detail-account`} className={`market-actions`}><Link className={`market-button market-primary`} href={signUp}>Sign Up Free</Link><Link className={`market-button`} href={signIn}>Sign In</Link><span className={`market-muted`}>{listing.acceptOffers ? `To Make An Offer Or Message The Seller` : `To Message The Seller`}</span></div> : null}
      {account ? <>
        <div id={`market-detail-actions`} className={`market-actions`}>
          {listing.priceCents !== null && checkoutMode ? <button id={`market-buy-now`} className={`market-button market-primary`} type={`button`} disabled={checkoutPending || pending} onClick={() => void checkout(listing.id).then(order => { if (order) onOrder(order.id); })}><CircleDollarSign size={16} aria-hidden />{checkoutPending ? `Opening Checkout…` : `Buy Now`}</button> : null}
          <button id={`market-message-seller`} className={`market-button`} type={`button`} disabled={pending || checkoutPending} onClick={() => void open()}><MessageSquare size={15} aria-hidden />Message Seller</button>
        </div>
        {listing.acceptOffers ? <form id={`market-make-offer`} className={`market-inline-form`} onSubmit={event => { event.preventDefault(); void open(true); }}>
          <label className={`market-field`} htmlFor={`market-offer-amount`}>Your Offer (USD)<input id={`market-offer-amount`} className={`market-input`} required inputMode={`decimal`} value={offer} onChange={event => setOffer(event.currentTarget.value)} /></label>
          <button className={`market-button`} type={`submit`} disabled={pending || checkoutPending}>Send Offer</button>
        </form> : null}
      </> : null}
      {actionError || checkoutError ? <p className={`market-error`} role={`alert`}>{actionError || checkoutError}</p> : null}
    </>}
  </section>;
};

type MarketplaceSellerProps = Pick<ListingSuggestionsProps, `onDismiss` | `dismissedIds`> & {
  refresh: () => void;
  initialDomain?: string;
  initialFields?: SuggestedListingFields;
};

export const MarketplaceSeller = ({ initialDomain, initialFields, refresh, onDismiss, dismissedIds }: MarketplaceSellerProps) => {
  const seller = useMarketSeller(initialDomain, refresh, initialFields);
  const { tools, draft, pending, eligible, requiresPublicProfile } = seller;
  const afternic = <MarketplaceAfternic seller={tools} onImport={seller.reload} />;
  const form = useRef<HTMLFormElement>(null);
  const change = (field: `domain` | `description` | `price`, value: string) => seller.setDraft(current => ({ ...current, [field]: value }));
  const selectDomain = (domain: string, fields: SuggestedListingFields) => {
    seller.selectSuggestedDomain(domain, fields);
    form.current?.scrollIntoView({ block: `nearest` });
  };

  return <section id={`market-seller-tools`} className={`market-workspace`} aria-labelledby={`market-seller-title`}>
    <div className={`market-section-heading`}><h2 id={`market-seller-title`}>{requiresPublicProfile || (eligible && !tools?.username) ? `Set Up Your Seller Profile` : `Seller Tools`}</h2>{!requiresPublicProfile && tools?.username ? <Link className={`market-button`} href={sellerProfilePath(tools.username)}>View Seller Profile <ArrowUpRight size={14} aria-hidden /></Link> : null}</div>
    {!initialDomain && afternic}
    {requiresPublicProfile ? <div id={`market-seller-public-profile-required`} className={`market-state market-seller-setup`} aria-busy={pending === `visibility`}>
      <div className={`market-detail-title`}><span className={`market-domain-icon`} aria-hidden><Globe2 size={20} /></span><h3>{publicSellerProfileTitle}</h3></div>
      <p id={`market-seller-visibility-description`} className={`market-muted`}>{publicSellerProfileHint}</p>
      <div className={`market-actions`}>
        <button id={`market-seller-make-public`} className={`market-button market-primary`} type={`button`} aria-describedby={`market-seller-visibility-description`} disabled={!!pending} onClick={() => void seller.makeProfilePublic()}><Globe2 size={15} aria-hidden />{pending === `visibility` ? `Making Profile Public…` : `Make Profile Public`}</button>
        <Link id={`market-seller-profile-settings`} className={`market-button`} href={routes.profile.href}>Profile Settings <ArrowUpRight size={14} aria-hidden /></Link>
      </div>
    </div> : null}
    {seller.error ? <p className={`market-error`} role={`alert`}>{seller.error}</p> : null}
    {seller.notice ? <p className={`market-notice`} role={`status`}>{seller.notice}</p> : null}
    {!requiresPublicProfile && !tools && !seller.error ? <MarketSkeleton kind={`sell`} label={`Loading Seller Tools`} /> : null}
    {!tools && seller.error ? <button type={`button`} className={`market-button`} onClick={seller.reload}>Retry</button> : null}
    {!requiresPublicProfile && tools && !eligible ? <p className={`market-muted`}>{tools.reason}</p> : null}
    {eligible && tools && !tools.username ? <section id={`market-seller-url-setup`} className={`market-state market-seller-setup`} aria-labelledby={`market-seller-url-title`}>
      <div className={`market-detail-title`}><span className={`market-domain-icon`} aria-hidden><Link2 size={20} /></span><h3 id={`market-seller-url-title`}>Choose Your Seller URL</h3></div>
      <p id={`market-seller-url-hint`} className={`market-muted`}>{sellerUrlHint}</p>
      <form id={`market-seller-url-form`} className={`market-inline-form`} onSubmit={event => { event.preventDefault(); void seller.saveUsername(); }}>
        <label className={`market-field`} htmlFor={`market-seller-username`}>Seller Username<input id={`market-seller-username`} className={`market-input`} required minLength={3} maxLength={30} pattern={`[a-zA-Z0-9]{3,30}`} autoCapitalize={`none`} autoComplete={`off`} disabled={!!pending} aria-describedby={`market-seller-url-hint market-seller-url-preview`} value={seller.username} placeholder={`username`} onChange={event => seller.setUsername(event.currentTarget.value)} /></label>
        <button id={`market-seller-username-save`} className={`market-button market-primary`} type={`submit`} disabled={!!pending || !seller.validUsername}><Check size={15} aria-hidden />{pending === `profile` ? `Saving Seller URL…` : `Save Seller URL`}</button>
      </form>
      <code id={`market-seller-url-preview`}>{seller.usernamePreview}</code>
    </section> : null}
    {eligible && tools?.username ? <>
      <div id={`market-sell-layout`} className={`market-section market-sell-layout`}>
        <form ref={form} id={`market-listing-form`} className={`market-listing-form`} onSubmit={event => { event.preventDefault(); void seller.save(); }}>
          <h3>{draft.id ? `Edit Listing` : `List A Domain`}</h3>
          <div className={`market-field-grid`}>
            <label className={`market-field`} htmlFor={`market-sell-domain`}>Domain Name<input id={`market-sell-domain`} className={`market-input`} required readOnly={!!draft.id} maxLength={253} value={draft.domain} placeholder={`example.com`} onChange={event => change(`domain`, event.currentTarget.value)} /></label>
            <label className={`market-field`} htmlFor={`market-sell-price`}>Buy Now Price (USD)<input id={`market-sell-price`} className={`market-input`} inputMode={`decimal`} value={draft.price} placeholder={`Optional when accepting offers`} onChange={event => change(`price`, event.currentTarget.value)} /></label>
          </div>
          <label className={`market-field`} htmlFor={`market-sell-description`}>Description<textarea id={`market-sell-description`} className={`market-input`} rows={3} maxLength={2000} value={draft.description} onChange={event => change(`description`, event.currentTarget.value)} /></label>
          <label className={`market-checkbox`} htmlFor={`market-sell-offers`}><input id={`market-sell-offers`} type={`checkbox`} checked={draft.acceptOffers} onChange={event => seller.setDraft(current => ({ ...current, acceptOffers: event.currentTarget.checked }))} />Accept Offers</label>
          <div className={`market-actions`}><button className={`market-button market-primary`} type={`submit`} disabled={!!pending}>{draft.id ? `Save Changes` : `Save Listing Draft`}</button>{draft.id ? <button className={`market-button`} type={`button`} onClick={seller.clearDraft}>Cancel</button> : null}</div>
        </form>
        <ListingSuggestions
          variant={`sell`}
          onDismiss={onDismiss}
          onSelect={selectDomain}
          dismissedIds={dismissedIds}
          disabled={Boolean(pending)}
          excludedDomains={seller.listedDomainNames}
        />
      </div>
    </> : null}
    {initialDomain && afternic}
    {tools?.username && (!requiresPublicProfile || tools.listings.length > 0) ? <section id={`market-seller-listings`} className={`market-section`}>
      <h3>Your Domains Database Listings</h3>
      {!tools.listings.length ? <p className={`market-muted`}>No Domains Database Listings Yet</p> : null}
      <ul className={`market-listings`}>
        {tools.listings.map(listing => <li key={listing.id} id={`market-seller-${listing.id}`} className={`market-owned-listing`}>
          <div className={`market-section-heading`}><strong>{listing.domain}</strong><span className={`market-status`} data-status={listing.status}>{listing.status}</span></div>
          {listing.afternicHold ? <p className={`market-muted`}>Managed Through Afternic</p> : !requiresPublicProfile && listing.status !== `sold` && listing.verification ? <div className={`market-verification`}><p>{listing.status === `active` ? `Keep This TXT Record In DNS While The Listing Is Active` : `Add This TXT Record At Your DNS Provider`}</p><span>Host <code>{listing.verification.host}</code></span><span>Value <code>{listing.verification.value}</code></span></div> : null}
          {listing.status !== `sold` && !listing.afternicHold ? <div className={`market-actions`}>
            {eligible ? <button className={`market-button`} type={`button`} disabled={!!pending} onClick={() => { seller.edit(listing); form.current?.scrollIntoView({ block: `nearest` }); }}><Pencil size={14} aria-hidden />Edit</button> : null}
            {eligible || listing.status === `active` ? <button className={`market-button ${listing.status === `active` ? `` : `market-primary`}`} type={`button`} disabled={!!pending} onClick={() => void seller.publish(listing)}>{listing.status === `active` ? `Pause Listing` : `Verify & Publish`}</button> : null}
          </div> : null}
        </li>)}
      </ul>
      {tools.nextCursor ? <button className={`market-button`} type={`button`} disabled={!!pending} onClick={() => void seller.loadMore()}>Load More Listings</button> : null}
    </section> : null}
  </section>;
};

export const MarketplaceInbox = ({ accountId, initialThread, onOrder, checkoutMode }: CheckoutProps & { accountId: string; initialThread: MarketplaceThread | null; onOrder: (id: string) => void }) => {
  const inbox = useMarketInbox(accountId, initialThread);
  const payment = useMarketCheckout();
  const messageArea = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const selected = inbox.selected;
  const offer = selected?.offer;
  const seller = selected?.sellerId === accountId;
  useEffect(() => {
    const target = messageArea.current;
    if (target && nearBottom.current) target.scrollTop = target.scrollHeight;
  }, [inbox.messages]);
  return <section id={`market-inbox`} className={`market-workspace`} aria-labelledby={`market-inbox-title`}>
    <div className={`market-section-heading`}><h2 id={`market-inbox-title`}>Offers & Messages</h2><button className={`market-button`} type={`button`} onClick={inbox.reload}>Refresh</button></div>
    {inbox.error ? <p className={`market-error`} role={`alert`}>{inbox.error}</p> : null}
    {!inbox.loading && !inbox.error && !inbox.threads.length ? <p className={`market-muted`}>No Conversations Yet</p> : null}
    <div id={`market-inbox-layout`} className={`market-inbox-layout`}>
      {inbox.threads.length ? <div id={`market-inbox-threads`} className={`market-inbox-threads`} aria-label={`Conversations`}>
        {inbox.threads.map(thread => <button key={thread.id} id={`market-conversation-${thread.id}`} className={`market-thread`} type={`button`} aria-pressed={thread.id === inbox.active} onClick={() => { nearBottom.current = true; inbox.setActive(thread.id); }}><MarketAvatar id={`market-thread-${thread.id}`} name={thread.otherName} photo={thread.otherPhotoURL} /><span><strong>{thread.domain}</strong><small>{thread.otherName}{thread.hasUnread ? ` · Unread` : ``}</small></span></button>)}
        {inbox.threadCursor ? <button className={`market-button`} type={`button`} onClick={() => void inbox.loadThreads()}>Load More Conversations</button> : null}
      </div> : inbox.loading && !inbox.error ? <MarketSkeleton kind={`inbox`} label={`Loading Conversations`} /> : null}
      {selected ? <div id={`market-chat-${selected.id}`} className={`market-chat`}>
        <h3>{selected.domain} · {selected.otherName}</h3>
        {offer ? <div id={`market-offer-${offer.id}`} className={`market-offer`}>
          <div className={`market-section-heading`}><strong>{marketPrice(offer.amountCents)} Offer</strong><span className={`market-status`} data-status={offer.status}>{offer.status}</span></div>
          {offer.status === `accepted` && (checkoutMode === null || checkoutMode === `sandbox`) ? <p className={`market-muted`}>{checkoutMode === null ? marketCheckoutUnavailable : marketCheckoutSandbox}</p> : null}
          <div className={`market-actions`}>
            {seller && offer.status === `pending` ? <button className={`market-button market-primary`} type={`button`} disabled={!!inbox.pending} onClick={() => void inbox.updateOffer(`accepted`)}>Accept Offer</button> : null}
            {seller && [`pending`, `accepted`].includes(offer.status) ? <button className={`market-button`} type={`button`} disabled={!!inbox.pending} onClick={() => void inbox.updateOffer(`declined`)}>Decline Offer</button> : null}
            {!seller && offer.status === `accepted` && checkoutMode ? <button className={`market-button market-primary`} type={`button`} disabled={payment.pending} onClick={() => void payment.checkout(selected.listingId, offer.id).then(order => { if (order) onOrder(order.id); })}>Pay Accepted Offer</button> : null}
            {!seller && [`pending`, `accepted`].includes(offer.status) ? <button className={`market-button`} type={`button`} disabled={!!inbox.pending || payment.pending} onClick={() => void inbox.updateOffer(`withdrawn`)}>Withdraw Offer</button> : null}
          </div>
        </div> : null}
        {inbox.chatError || payment.error ? <p className={`market-error`} role={`alert`}>{inbox.chatError || payment.error}</p> : null}
        <div ref={messageArea} id={`market-messages-${selected.id}`} className={`market-messages`} role={`log`} aria-label={`Conversation Messages`} onScroll={event => { const target = event.currentTarget; nearBottom.current = target.scrollHeight - target.scrollTop - target.clientHeight < 60; }}>
          {(inbox.messages[0]?.number ?? 0) > 1 ? <button className={`market-button`} type={`button`} disabled={!!inbox.pending} onClick={() => void inbox.loadOlder()}>Load Older Messages</button> : null}
          {!inbox.messages.length && !inbox.chatError ? inbox.messageLoading ? <MarketSkeleton kind={`messages`} label={`Loading Messages`} /> : <p className={`market-muted`}>No Messages Yet</p> : null}
          {inbox.messages.map(message => <div key={message.id} id={`market-message-${message.id}`} className={`market-message`} data-own={message.senderId === accountId}><strong>{message.senderId === accountId ? `You` : selected.otherName}</strong><p>{message.text}</p></div>)}
        </div>
        <form id={`market-chat-form`} className={`market-inline-form`} onSubmit={event => { event.preventDefault(); nearBottom.current = true; void inbox.send(); }}>
          <label className={`market-field market-message-field`} htmlFor={`market-chat-message`}>Message<textarea id={`market-chat-message`} className={`market-input`} required maxLength={2000} rows={2} value={inbox.message} disabled={inbox.pending === `send`} onChange={event => inbox.changeMessage(event.currentTarget.value)} /></label>
          <button className={`market-button market-primary`} type={`submit`} disabled={!!inbox.pending || !inbox.message.trim()}><Send size={15} aria-hidden />Send</button>
        </form>
      </div> : null}
    </div>
  </section>;
};

export const MarketplaceOrders = ({ accountId, orderId, onChat, checkoutMode }: CheckoutProps & { accountId: string; orderId?: string; onChat: (thread: MarketplaceThread) => void }) => {
  const state = useMarketOrders(accountId, orderId);
  const [chatPending, setChatPending] = useState(false);
  const [chatError, setChatError] = useState(``);
  const chatRequest = useRef<AbortController | null>(null);
  useEffect(() => () => chatRequest.current?.abort(), []);
  const orders = state.orders;
  const loadingOrders = state.loading || state.orderLoading;
  const openChat = async (id: string) => {
    if (chatPending) return;
    setChatPending(true);
    setChatError(``);
    const controller = new AbortController();
    chatRequest.current = controller;
    try { const thread = await marketplaceAPI.getThread(id, controller.signal); if (!controller.signal.aborted) onChat(thread); }
    catch (failure) { if (!controller.signal.aborted) setChatError(marketError(failure)); }
    finally { if (!controller.signal.aborted) setChatPending(false); }
  };
  return <section id={`market-orders`} className={`market-workspace`} aria-labelledby={`market-orders-title`}>
    <div className={`market-section-heading`}><h2 id={`market-orders-title`}>Orders</h2><button className={`market-button`} type={`button`} onClick={state.reload}>Refresh</button></div>
    <div className={`market-actions`}>
      {([`buying`, `selling`] as const).map(side => <button key={side} id={`market-orders-${side}`} className={`market-button`} type={`button`} aria-pressed={state.side === side} onClick={() => state.setSide(side)}>{side === `buying` ? `Purchases` : `Sales`}</button>)}
    </div>
    {state.error || chatError ? <p className={`market-error`} role={`alert`}>{state.error || chatError}</p> : null}
    {state.orderError ? <p id={`market-order-link-error`} className={`market-error`} role={`alert`}>{state.orderError}</p> : null}
    {loadingOrders && !orders.length && !state.error ? <MarketSkeleton kind={`orders`} label={`Loading Orders`} /> : null}
    {!loadingOrders && !state.error && !orders.length ? <p className={`market-muted`}>No Orders Yet</p> : null}
    {orders.length ? <ul className={`market-listings`}>{orders.map(order => <li key={order.id} id={`market-order-${order.id}`} className={`market-owned-listing`}>
      <div className={`market-section-heading`}><strong>{order.domain} · {marketPrice(order.amountCents)}</strong><span className={`market-status`} data-status={order.status}>{order.status}{order.mode === `sandbox` ? ` · Sandbox` : ``}</span></div>
      {order.transferStatus === `awaiting_transfer` ? <><p className={`market-muted`}>Payment Confirmed · Arrange The Registrar Transfer With The Other Party</p>{order.threadId ? <button className={`market-button`} type={`button`} disabled={chatPending} onClick={() => void openChat(order.threadId)}><MessageSquare size={14} aria-hidden />Open Transfer Conversation</button> : null}</> : null}
      {order.sellerId === accountId ? <p className={`market-muted`}>Commission {marketPrice(order.commissionCents)}</p> : null}
      {order.sellerId === accountId && order.sellerFundsStatus ? <p className={order.sellerFundsStatus === `review_required` ? `market-error` : `market-muted`}>{order.sellerFundsStatus === `review_required` ? `Stripe Transfer Needs Review` : `Transferred To Stripe Balance`}</p> : null}
      {order.status === `pending` && order.buyerId === accountId && checkoutMode !== undefined ? (checkoutMode === order.mode ? <div className={`market-actions`}><button className={`market-button market-primary`} type={`button`} disabled={state.pending} onClick={() => void state.resume(order)}>Resume Checkout</button><button className={`market-button`} type={`button`} disabled={state.pending} onClick={() => void state.cancel(order.id)}>Cancel Checkout</button></div> : <p className={`market-muted`}>{marketCheckoutUnavailable}</p>) : null}
    </li>)}</ul> : null}
  </section>;
};
