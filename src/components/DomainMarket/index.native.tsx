import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { useRef, useMemo, useState, useEffect, useContext, type ReactNode } from 'react';
import MarketSkeleton from './MarketSkeleton';
import ListingSuggestions from './ListingSuggestions';
import MarketHero from './MarketHero/index.native';
import MarketplaceAfternic from '../MarketplaceAfternic';
import { routes } from '../../shared/routes';
import { marketViews } from './marketViews';
import { useMarketInbox } from './useMarketInbox';
import { createStyles } from './styles.native';
import { useExternalMarketListings } from './useExternalMarketListings';
import { marketplaceAPI } from '../../api/marketplace';
import { elementProps } from '../../shared/elementProps';
import { publicHttpsUrl } from '../../shared/social/content';
import { useTheme } from '../../shared/themeContext/useTheme';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import { registrarPurchaseUrl } from '../../shared/domainSearch/types';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import type { ThemePalette } from '../../shared/themeContext/theme';
import type { MarketAuthParams, MarketView } from '../../shared/marketRoutes';
import { externalMarketPrice } from '../../shared/marketplace/externalListings';
import type { SuggestedListingFields } from './ListingSuggestions/useListingSuggestions';
import type { MarketplaceOrder, MarketplacePaymentMode } from '../../shared/marketplace/paymentTypes';
import { useMarketSeller, publicSellerProfileHint, publicSellerProfileTitle, sellerUrlHint } from './useMarketSeller';
import { marketCents, marketError, marketPrice, useDomainMarket } from './useDomainMarket';
import type { MarketplaceListing, MarketplaceThread, SellerListing } from '../../shared/marketplace/types';
import { marketCheckoutSandbox, marketCheckoutUnavailable, useMarketCheckout, useMarketOrders } from './useMarketPayments';
import { AppState, Pressable, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, Check, ChevronRight, CreditCard, ExternalLink, Globe2, Link2, LogIn, MessageCircle, Pencil, Plus, RefreshCw, Search, Send, ShieldCheck, Store, Tag, UserPlus, UserRound, Wallet, X, type LucideIcon } from 'lucide-react-native';

type MarketUI = { palette: ThemePalette; styles: ReturnType<typeof createStyles> };
type MarketCheckoutUI = MarketUI & { checkoutMode?: MarketplacePaymentMode | null };
type MarketButtonProps = MarketUI & {
  id: string;
  label: string;
  href?: Href;
  icon?: LucideIcon;
  primary?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};
const MarketButton = ({ id, href, label, palette, styles, disabled, onPress, primary, icon: Icon }: MarketButtonProps) => {
  const button = (
    <Pressable
      {...elementProps(id)}
      accessibilityLabel={label}
      accessibilityRole={href ? `link` : `button`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}
    >
      {Icon ? <Icon size={15} color={primary ? palette.contrast : palette.accent} accessible={false} /> : null}
      <Text style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
  return href ? <Link href={href} asChild>{button}</Link> : button;
};

const Feedback = ({ id, styles, error, notice }: { id: string; styles: MarketUI[`styles`]; error?: string; notice?: string }) => error || notice ? (
  <Text {...elementProps(id)} accessibilityLiveRegion={error ? `assertive` : `polite`} style={[styles.feedback, error ? styles.error : styles.notice]}>{error || notice}</Text>
) : null;

const useForegroundRefresh = (refresh: () => void) => {
  const current = useRef(refresh);
  current.current = refresh;
  useEffect(() => {
    const listener = AppState.addEventListener(`change`, value => { if (value === `active`) current.current(); });
    return () => listener.remove();
  }, []);
};

const MarketAuthPrompt = ({ params, palette, styles, children }: MarketUI & { params: MarketAuthParams; children: ReactNode }) => {
  return <View {...elementProps(`market-auth-prompt`)} style={styles.panel}>
    <Text {...elementProps(`market-auth-description`)} style={styles.copy}>{children}</Text>
    <View style={styles.actions}>
      <MarketButton id={`market-sign-up`} label={`Create Free Account`} href={{ pathname: routes.signup.href, params }} icon={UserPlus} primary palette={palette} styles={styles} />
      <MarketButton id={`market-sign-in`} label={`Sign In`} href={{ pathname: routes.signin.href, params }} icon={LogIn} palette={palette} styles={styles} />
    </View>
  </View>;
};

const MarketIdentity = ({ id, name, photoURL, username, palette, styles }: MarketUI & { id: string; name?: string; photoURL?: string; username?: string }) => {
  const [failed, setFailed] = useState(``);
  const photo = photoURL?.length && photoURL.length <= 2048 ? publicHttpsUrl(photoURL) : null;
  const photoKey = `${id}:${photo ?? ``}`;
  const identity = (
    <View {...elementProps(`market-identity`, id)} style={styles.identity}>
      <View {...elementProps(`market-identity-avatar`, id)} style={styles.avatar} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
        {name ? <Text style={styles.initial}>{name.trim()?.[0]?.toUpperCase()}</Text> : <UserRound size={14} color={palette.accent} accessible={false} />}
        {photo && failed !== photoKey ? <Image key={photoKey} {...elementProps(`market-identity-photo`, id)} source={{ uri: photo }} style={styles.avatarPhoto} contentFit={`cover`} accessible={false} onError={() => setFailed(photoKey)} /> : null}
      </View>
      <View style={styles.identityCopy}>
        <Text {...elementProps(`market-identity-name`, id)} style={styles.buttonText}>{name || (username ? `Private Seller` : `Marketplace Member`)}</Text>
        {username ? <Text {...elementProps(`market-identity-username`, id)} style={styles.muted}>{`@${username}`}</Text> : null}
      </View>
    </View>
  );
  return username ? <Link href={sellerProfilePath(username)} asChild>
    <Pressable {...elementProps(`market-seller-link`, id)} style={styles.sellerLink} accessibilityRole={`link`} accessibilityLabel={`Seller Profile for ${name || username}`}>{identity}<ChevronRight size={14} color={palette.accent} accessible={false} /></Pressable>
  </Link> : identity;
};

const MarketListingDetail = ({ listing, signedIn, authLoading, authParams, back, showThread, showOrder, palette, styles, checkoutMode }: MarketCheckoutUI & {
  listing: MarketplaceListing; signedIn: boolean; authLoading: boolean; back: () => void;
  authParams: MarketAuthParams;
  showOrder: (order: MarketplaceOrder) => void; showThread: (thread: MarketplaceThread) => void;
}) => {
  const [offer, setOffer] = useState(``);
  const [pending, setPending] = useState(``);
  const [error, setError] = useState(``);
  const payments = useMarketCheckout();
  const busy = Boolean(pending || payments.pending);
  const openThread = async (makeOffer: boolean) => {
    if (busy) return;
    setPending(makeOffer ? `offer` : `chat`);
    setError(``);
    try { showThread(await marketplaceAPI.openThread(listing.id, makeOffer ? marketCents(offer) : undefined)); }
    catch (failure) { setError(marketError(failure)); }
    finally { setPending(``); }
  };

  return <View {...elementProps(`market-listing-detail`, listing.id)} style={styles.section}>
    <MarketButton id={`market-listing-back`} label={`Back To Listings`} icon={ArrowLeft} onPress={back} palette={palette} styles={styles} />
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <View style={styles.domainMark}><Globe2 size={23} color={palette.accent} accessible={false} /></View>
        <View style={styles.grow}>
          <Text {...elementProps(`market-listing-title`, listing.id)} accessibilityRole={`header`} style={styles.listingTitle}>{listing.domain}</Text>
          <Text {...elementProps(`market-listing-price`, listing.id)} style={styles.price}>{listing.priceCents === null ? listing.acceptOffers ? `Make An Offer` : `Sale Pending` : marketPrice(listing.priceCents)}</Text>
        </View>
      </View>
      {listing.description ? <Text {...elementProps(`market-listing-description`, listing.id)} style={styles.copy}>{listing.description}</Text> : null}
      {listing.priceCents !== null && (checkoutMode === null || checkoutMode === `sandbox`) ? <Text {...elementProps(`market-listing-checkout-status`, listing.id)} style={styles.muted}>{checkoutMode === null ? marketCheckoutUnavailable : marketCheckoutSandbox}</Text> : null}
      <MarketIdentity id={listing.id} name={listing.sellerName} username={listing.sellerUsername} photoURL={listing.sellerPhotoURL} palette={palette} styles={styles} />
    </View>
    {authLoading ? <MarketSkeleton kind={`actions`} label={`Checking Account`} /> : signedIn ? (
      <View {...elementProps(`market-listing-actions`, listing.id)} style={styles.panel}>
        <View style={styles.actions}>
          {listing.priceCents !== null && checkoutMode ? <MarketButton id={`market-buy-now`} label={payments.pending ? `Opening Checkout` : `Buy Now`} icon={CreditCard} disabled={busy} primary onPress={() => { void payments.checkout(listing.id).then(order => { if (order) showOrder(order); }); }} palette={palette} styles={styles} /> : null}
          <MarketButton id={`market-chat-seller`} label={pending === `chat` ? `Opening Conversation` : `Message Seller`} icon={MessageCircle} disabled={busy} onPress={() => void openThread(false)} palette={palette} styles={styles} />
        </View>
        {listing.acceptOffers ? <View {...elementProps(`market-offer-form`, listing.id)} style={styles.field}>
          <Text style={styles.label}>{`Your Offer (USD)`}</Text>
          <View style={styles.actions}>
            <TextInput {...elementProps(`market-offer-input`, listing.id)} value={offer} onChangeText={setOffer} keyboardType={`decimal-pad`} editable={!busy} maxLength={9} placeholder={`500.00`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Your Offer In US Dollars`} style={[styles.input, styles.grow]} />
            <MarketButton id={`market-send-offer`} label={pending === `offer` ? `Sending Offer` : `Send Offer`} icon={Send} disabled={busy || !offer.trim()} onPress={() => void openThread(true)} palette={palette} styles={styles} />
          </View>
        </View> : null}
        <Feedback id={`market-listing-action-feedback`} styles={styles} error={error || payments.error} />
      </View>
    ) : <MarketAuthPrompt params={authParams} palette={palette} styles={styles}>{listing.acceptOffers ? `Create a free account to make an offer or message the seller.` : `Create a free account to message the seller.`}</MarketAuthPrompt>}
  </View>;
};

const SellerListingCard = ({ record, pending, edit, publish, eligible = true, palette, styles }: MarketUI & {
  record: SellerListing; pending: string; edit: () => void; publish: () => void; eligible?: boolean;
}) => {
  const active = record.status === `active`;
  const sold = record.status === `sold`;
  const status = active ? `Published` : sold ? `Sold` : record.status === `paused` ? `Paused` : `Draft`;
  return (
    <View {...elementProps(`market-seller-listing`, record.id)} style={styles.panel}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, styles.grow]}>{record.domain}</Text>
        <Text style={[styles.pill, (active || sold) && styles.pillActive]}>{status}</Text>
      </View>
      <Text style={styles.muted}>{record.priceCents === null ? `Offers Only` : marketPrice(record.priceCents)}</Text>
      {eligible && record.verification && !record.afternicHold && !sold ? <View {...elementProps(`market-dns-instructions`, record.id)} style={styles.dns}>
        <View style={styles.headingRow}><ShieldCheck size={17} color={palette.accent} accessible={false} /><Text style={styles.label}>{`Verify Domain Ownership`}</Text></View>
        <Text style={styles.muted}>{active ? `Keep this TXT record in DNS while the listing is active.` : `Add this TXT record at your DNS provider, then choose Verify & Publish.`}</Text>
        <Text style={styles.label}>{`Host`}</Text><Text selectable {...elementProps(`market-dns-host`, record.id)} style={styles.mono}>{record.verification.host}</Text>
        <Text style={styles.label}>{`Value`}</Text><Text selectable {...elementProps(`market-dns-value`, record.id)} style={styles.mono}>{record.verification.value}</Text>
      </View> : null}
      {record.afternicHold ? <Text style={styles.muted}>{`Managed Through Afternic`}</Text> : null}
      {!sold && !record.afternicHold && (eligible || active) ? <View style={styles.actions}>
        {eligible ? <MarketButton id={`market-edit-${record.id}`} label={`Edit Listing`} icon={Pencil} disabled={Boolean(pending)} onPress={edit} palette={palette} styles={styles} /> : null}
        <MarketButton id={`market-publish-${record.id}`} label={pending === record.id ? `Saving` : active ? `Pause Listing` : `Verify & Publish`} icon={active ? X : ShieldCheck} disabled={Boolean(pending)} primary={!active} onPress={publish} palette={palette} styles={styles} />
      </View> : null}
    </View>
  );
};

const MarketSellerPanel = ({ domain, fields, onChange, palette, styles, dismissedSuggestionIds, dismissSuggestion }: MarketUI & {
  domain?: string;
  onChange: () => void;
  fields?: SuggestedListingFields;
  dismissSuggestion: (id: string) => void;
  dismissedSuggestionIds: readonly string[];
}) => {
  const seller = useMarketSeller(domain, onChange, fields);
  const scroll = useContext(ScrollContext)?.pageScroll;
  const { tools, draft, pending, error, notice, eligible, requiresPublicProfile } = seller;
  const disabled = Boolean(pending);
  const edit = (record: SellerListing) => {
    seller.edit(record);
    if (scroll) scroll.scrollBy(-scroll.getPosition());
  };
  const workspace = requiresPublicProfile || (tools && !eligible) ? <View {...elementProps(`market-seller-unavailable`)} style={styles.section}>
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        {requiresPublicProfile ? <View style={styles.domainMark}><Globe2 size={20} color={palette.accent} accessible={false} /></View> : null}
        <Text style={styles.heading} accessibilityRole={`header`}>{requiresPublicProfile ? publicSellerProfileTitle : `Publishing Is Unavailable For This Account`}</Text>
      </View>
      <Text style={styles.copy}>{requiresPublicProfile ? publicSellerProfileHint : tools?.reason}</Text>
      <View style={styles.actions}>
        {requiresPublicProfile ? <>
          <MarketButton id={`market-seller-make-public`} label={pending === `visibility` ? `Making Profile Public…` : `Make Profile Public`} icon={Globe2} disabled={disabled} primary onPress={() => void seller.makeProfilePublic()} palette={palette} styles={styles} />
          <MarketButton id={`market-seller-profile-settings`} label={`Profile Settings`} href={routes.profile.href} icon={ExternalLink} palette={palette} styles={styles} />
        </> : <>
          {tools?.username ? <MarketButton id={`market-seller-profile`} label={`Seller Profile`} href={sellerProfilePath(tools.username)} icon={UserRound} palette={palette} styles={styles} /> : null}
          <MarketButton id={`market-seller-plans`} label={`View Plans`} icon={Tag} href={routes.pricing.href} palette={palette} styles={styles} />
        </>}
      </View>
    </View>
    <Feedback id={`market-seller-feedback`} styles={styles} error={error} notice={notice} />
    {!tools && error ? <MarketButton id={`market-seller-retry`} label={`Retry`} icon={RefreshCw} onPress={seller.reload} palette={palette} styles={styles} /> : null}
    {tools?.listings.map(record => <SellerListingCard key={record.id} eligible={false} record={record} pending={pending} edit={() => edit(record)} publish={() => void seller.publish(record)} palette={palette} styles={styles} />)}
    {tools?.nextCursor ? <MarketButton id={`market-seller-more`} label={pending === `more` ? `Loading Listings` : `Load More Listings`} icon={Plus} disabled={disabled} onPress={() => void seller.loadMore()} palette={palette} styles={styles} /> : null}
  </View> : !tools ? (
    error ? <View style={styles.panel}><Feedback id={`market-seller-tools-error`} styles={styles} error={error} /><MarketButton id={`market-seller-retry`} label={`Retry`} icon={RefreshCw} onPress={seller.reload} palette={palette} styles={styles} /></View>
      : <MarketSkeleton kind={`sell`} label={`Loading Seller Tools`} />
  ) : (
    <View {...elementProps(`market-seller-tools`)} style={styles.section}>
      <Feedback id={`market-seller-feedback`} styles={styles} error={error} notice={notice} />
      {!tools.username ? <View {...elementProps(`market-create-seller`)} style={styles.panel}>
        <View style={styles.headingRow}>
          <View style={styles.domainMark}><Link2 size={20} color={palette.accent} accessible={false} /></View>
          <Text style={styles.heading} accessibilityRole={`header`}>{`Choose Your Seller URL`}</Text>
        </View>
        <Text style={styles.copy}>{sellerUrlHint}</Text>
        <TextInput {...elementProps(`market-seller-username`)} value={seller.username} onChangeText={seller.setUsername} editable={!disabled} maxLength={30} placeholder={`username`} placeholderTextColor={palette.placeholder} autoCapitalize={`none`} autoCorrect={false} accessibilityLabel={`Seller Username`} style={styles.input} />
        <Text {...elementProps(`market-seller-url-preview`)} style={styles.mono}>{seller.usernamePreview}</Text>
        <MarketButton id={`market-seller-username-save`} label={pending === `profile` ? `Saving Seller URL…` : `Save Seller URL`} icon={Check} disabled={disabled || !seller.validUsername} primary onPress={() => void seller.saveUsername()} palette={palette} styles={styles} />
      </View> : (
        <>
          <MarketButton id={`market-seller-profile`} label={`Seller Profile · @${tools.username}`} icon={UserRound} href={sellerProfilePath(tools.username)} palette={palette} styles={styles} />
          <View {...elementProps(`market-seller-workspace`)} style={styles.sellerWorkspace}>
            <View {...elementProps(`market-listing-editor`)} style={[styles.panel, styles.sellerEditor]}>
              <View style={styles.headingRow}><Store size={20} color={palette.accent} accessible={false} /><Text style={styles.heading} accessibilityRole={`header`}>{draft.id ? `Edit Domain Listing` : `List A Domain`}</Text></View>
              <View style={styles.field}>
                <Text style={styles.label}>{`Domain Name`}</Text>
                <TextInput {...elementProps(`market-listing-domain`)} value={draft.domain} editable={!disabled && !draft.id} maxLength={253} autoCapitalize={`none`} autoCorrect={false} keyboardType={`url`} onChangeText={domain => seller.setDraft({ ...draft, domain })} placeholder={`yourdomain.com`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Domain Name`} style={[styles.input, !!draft.id && styles.disabled]} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{`Buy Now Price (USD)`}</Text>
                <TextInput {...elementProps(`market-listing-price`)} value={draft.price} onChangeText={price => seller.setDraft({ ...draft, price })} editable={!disabled} keyboardType={`decimal-pad`} maxLength={9} placeholder={`Optional if accepting offers`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Buy Now Price In US Dollars`} style={styles.input} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{`Description`}</Text>
                <TextInput {...elementProps(`market-listing-description`)} value={draft.description} onChangeText={description => seller.setDraft({ ...draft, description })} editable={!disabled} maxLength={2000} multiline placeholder={`Describe this domain`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Listing Description`} style={[styles.input, styles.textArea]} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>{`Accept Offers`}</Text>
                <Switch {...elementProps(`market-listing-offers`)} value={draft.acceptOffers} disabled={disabled} onValueChange={acceptOffers => seller.setDraft({ ...draft, acceptOffers })} accessibilityLabel={`Accept Offers`} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={palette.paper} />
              </View>
              <View style={styles.actions}>
                <MarketButton id={`market-save-listing`} label={pending === `save` ? `Saving Listing` : draft.id ? `Save Listing` : `Save Draft`} icon={draft.id ? Check : Plus} disabled={disabled || !draft.domain.trim() || (!draft.acceptOffers && !draft.price.trim())} primary onPress={() => void seller.save()} palette={palette} styles={styles} />
                {draft.id ? <MarketButton id={`market-cancel-edit`} label={`Cancel Edit`} icon={X} disabled={disabled} onPress={seller.clearDraft} palette={palette} styles={styles} /> : null}
              </View>
            </View>
            <ListingSuggestions
              variant={`sell`}
              disabled={disabled}
              onDismiss={dismissSuggestion}
              style={styles.sellerSuggestions}
              onSelect={seller.selectSuggestedDomain}
              dismissedIds={dismissedSuggestionIds}
              excludedDomains={seller.listedDomainNames}
            />
          </View>
          <View {...elementProps(`market-seller-listings`)} style={styles.section}>
            <Text style={styles.heading} accessibilityRole={`header`}>{`Your Listings`}</Text>
            {tools.listings.length ? tools.listings.map(record => (
              <SellerListingCard key={record.id} record={record} pending={pending} edit={() => edit(record)} publish={() => void seller.publish(record)} palette={palette} styles={styles} />
            )) : <Text style={styles.muted}>{`No Domain Listings Yet`}</Text>}
            {tools.nextCursor ? <MarketButton id={`market-seller-more`} label={pending === `more` ? `Loading Listings` : `Load More Listings`} icon={Plus} disabled={disabled} onPress={() => void seller.loadMore()} palette={palette} styles={styles} /> : null}
          </View>
        </>
      )}
    </View>
  );
  const afternic = <MarketplaceAfternic seller={tools} onImport={() => { seller.reload(); onChange(); }} />;
  return <View {...elementProps(`market-sell-workspace`)} style={styles.section}>
    {domain ? workspace : afternic}
    {domain ? afternic : workspace}
  </View>;
};

const MarketInbox = ({ accountId, initialThread, showOrder, palette, styles, checkoutMode }: MarketCheckoutUI & { accountId: string; initialThread: MarketplaceThread | null; showOrder: (order: MarketplaceOrder) => void }) => {
  const inbox = useMarketInbox(accountId, initialThread);
  const payments = useMarketCheckout();
  const { selected, messages, pending } = inbox;
  const offer = selected?.offer;
  const disabled = Boolean(pending || payments.pending);
  return (
    <View {...elementProps(`market-inbox`)} style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, styles.grow]} accessibilityRole={`header`}>{`Marketplace Conversations`}</Text>
        <MarketButton id={`market-inbox-refresh`} label={`Refresh`} icon={RefreshCw} disabled={disabled} onPress={inbox.reload} palette={palette} styles={styles} />
      </View>
      <Feedback id={`market-inbox-error`} styles={styles} error={inbox.error} />
      {inbox.loading && !inbox.threads.length && !inbox.error ? <MarketSkeleton kind={`inbox`} label={`Loading Conversations`} /> : null}
      {inbox.threads.length ? <View {...elementProps(`market-thread-list`)} style={styles.section}>
        {inbox.threads.map(thread => (
          <Pressable key={thread.id} {...elementProps(`market-thread`, thread.id)} style={[styles.thread, inbox.active === thread.id && styles.threadSelected]} accessibilityRole={`button`} accessibilityLabel={`Conversation About ${thread.domain}`} accessibilityState={{ selected: inbox.active === thread.id }} onPress={() => inbox.setActive(thread.id)}>
            <View style={styles.grow}><Text style={styles.label}>{thread.domain}{thread.hasUnread ? ` · Unread` : ``}</Text><MarketIdentity id={thread.id} name={thread.otherName} photoURL={thread.otherPhotoURL} palette={palette} styles={styles} /></View>
            <ChevronRight size={16} color={palette.accent} accessible={false} />
          </Pressable>
        ))}
        {inbox.threadCursor ? <MarketButton id={`market-more-threads`} label={`Load More Conversations`} icon={Plus} disabled={disabled} onPress={() => void inbox.loadThreads()} palette={palette} styles={styles} /> : null}
      </View> : !inbox.loading && !inbox.error ? <View style={styles.empty}><MessageCircle size={24} color={palette.accent} accessible={false} /><Text style={styles.muted}>{`No Marketplace Conversations`}</Text></View> : null}
      {selected ? <View {...elementProps(`market-conversation`, selected.id)} style={styles.panel}>
        <Text style={styles.heading} accessibilityRole={`header`}>{selected.domain}</Text>
        {offer ? <View {...elementProps(`market-inbox-offer`, offer.id)} style={styles.dns}>
          <Text style={styles.label}>{`${marketPrice(offer.amountCents)} Offer · ${offer.status[0]?.toUpperCase()}${offer.status.slice(1)}`}</Text>
          {offer.status === `pending` ? (
            <View style={styles.actions}>
              {offer.sellerId === accountId ? <>
                <MarketButton id={`market-offer-accept`} label={`Accept`} icon={Check} disabled={disabled} primary onPress={() => void inbox.updateOffer(`accepted`)} palette={palette} styles={styles} />
                <MarketButton id={`market-offer-decline`} label={`Decline`} icon={X} disabled={disabled} onPress={() => void inbox.updateOffer(`declined`)} palette={palette} styles={styles} />
              </> : <MarketButton id={`market-offer-withdraw`} label={`Withdraw Offer`} icon={X} disabled={disabled} onPress={() => void inbox.updateOffer(`withdrawn`)} palette={palette} styles={styles} />}
            </View>
          ) : null}
          {offer.status === `accepted` && (checkoutMode === null || checkoutMode === `sandbox`) ? <Text style={styles.muted}>{checkoutMode === null ? marketCheckoutUnavailable : marketCheckoutSandbox}</Text> : null}
          {offer.status === `accepted` && offer.buyerId === accountId && checkoutMode ? <MarketButton id={`market-pay-offer`} label={payments.pending ? `Opening Checkout` : `Pay Accepted Offer`} icon={CreditCard} disabled={disabled} primary onPress={() => { void payments.checkout(selected.listingId, offer.id).then(order => { if (order) showOrder(order); }); }} palette={palette} styles={styles} /> : null}
        </View> : null}
        {inbox.messageLoading && !messages.length && !inbox.chatError ? <MarketSkeleton kind={`messages`} label={`Loading Messages`} /> : null}
        {!inbox.messageLoading && !messages.length && !inbox.chatError ? <Text style={styles.muted}>{`No Messages Yet`}</Text> : null}
        {messages[0] && messages[0].number > 1 ? <MarketButton id={`market-older-messages`} label={`Load Earlier Messages`} icon={Plus} disabled={disabled} onPress={() => void inbox.loadOlder()} palette={palette} styles={styles} /> : null}
        <View {...elementProps(`market-conversation-messages`, selected.id)} style={styles.section}>
          {messages.map(message => {
            const mine = message.senderId === accountId;
            return <View key={message.id} {...elementProps(`market-message`, message.id)} style={[styles.message, mine && styles.messageMine]}>
              <Text style={styles.label}>{mine ? `You` : selected.otherName}</Text>
              <Text selectable style={styles.copy}>{message.text}</Text>
              <Text style={styles.muted}>{new Date(message.createdAt).toLocaleString()}</Text>
            </View>;
          })}
        </View>
        <TextInput {...elementProps(`market-message-composer`, selected.id)} value={inbox.message} onChangeText={inbox.changeMessage} multiline editable={!disabled} maxLength={2000} placeholder={`Write a message`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Write A Marketplace Message`} style={[styles.input, styles.textArea]} />
        <MarketButton id={`market-message-send`} label={pending === `send` ? `Sending Message` : `Send Message`} icon={Send} disabled={disabled || !inbox.message.trim()} primary onPress={() => void inbox.send()} palette={palette} styles={styles} />
        <Feedback id={`market-conversation-error`} styles={styles} error={inbox.chatError || payments.error} />
      </View> : null}
    </View>
  );
};

const orderStatuses = { pending: `Payment Pending`, paid: `Paid`, expired: `Checkout Expired`, failed: `Payment Failed` } as const;
const MarketOrders = ({ accountId, orderId, showThread, palette, styles, checkoutMode }: MarketCheckoutUI & { accountId: string; orderId?: string; showThread: (thread: MarketplaceThread) => void }) => {
  const state = useMarketOrders(accountId, orderId);
  useForegroundRefresh(state.reload);
  const [opening, setOpening] = useState(``);
  const [threadError, setThreadError] = useState(``);
  const transferRequest = useRef<AbortController | null>(null);
  const orders = state.orders;
  const loading = state.loading || state.orderLoading;
  useEffect(() => () => transferRequest.current?.abort(), []);
  const openTransfer = async (order: MarketplaceOrder) => {
    if (transferRequest.current) return;
    const controller = new AbortController();
    transferRequest.current = controller;
    setOpening(order.id);
    setThreadError(``);
    try {
      const thread = await marketplaceAPI.getThread(order.threadId, controller.signal);
      if (!controller.signal.aborted) showThread(thread);
    } catch (failure) {
      if (!controller.signal.aborted) setThreadError(marketError(failure));
    } finally {
      transferRequest.current = null;
      if (!controller.signal.aborted) setOpening(``);
    }
  };
  return (
    <View {...elementProps(`market-orders`)} style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, styles.grow]} accessibilityRole={`header`}>{`Marketplace Orders`}</Text>
        <MarketButton id={`market-orders-refresh`} label={`Refresh`} icon={RefreshCw} disabled={state.loading || state.pending} onPress={state.reload} palette={palette} styles={styles} />
      </View>
      <View style={styles.tabs} accessibilityRole={`tablist`} accessibilityLabel={`Order Type`}>
        {([`buying`, `selling`] as const).map(side => (
          <Pressable key={side} {...elementProps(`market-order-side`, side)} onPress={() => state.setSide(side)} style={[styles.tab, state.side === side && styles.tabSelected]} accessibilityRole={`tab`} accessibilityState={{ selected: state.side === side }}>
            <Text style={[styles.tabLabel, state.side === side && styles.tabLabelSelected]}>{side === `buying` ? `Purchases` : `Sales`}</Text>
          </Pressable>
        ))}
      </View>
      <Feedback id={`market-orders-error`} styles={styles} error={state.error || threadError} />
      <Feedback id={`market-order-link-error`} styles={styles} error={state.orderError} />
      {loading && !state.error && !orders.length ? <MarketSkeleton kind={`orders`} label={state.orderLoading ? `Loading Order` : `Loading Orders`} /> : null}
      {!loading && !state.error && !orders.length ? <View style={styles.empty}><Wallet size={24} color={palette.accent} accessible={false} /><Text style={styles.muted}>{state.side === `buying` ? `No Purchases Yet` : `No Sales Yet`}</Text></View> : null}
      {orders.map(order => {
        const buying = order.buyerId === accountId;
        const pending = order.status === `pending`;
        return <View key={order.id} {...elementProps(`market-order`, order.id)} style={styles.panel}>
          <View style={styles.headingRow}>
            <Text style={[styles.heading, styles.grow]}>{order.domain}</Text>
            <Text style={[styles.pill, order.status === `paid` && styles.pillActive]}>{orderStatuses[order.status]}</Text>
          </View>
          <Text style={styles.label}>{marketPrice(order.amountCents)}</Text>
          <Text style={styles.muted}>{`Order #${order.number} · ${new Date(order.createdAt).toLocaleDateString()}${order.mode === `sandbox` ? ` · Sandbox` : ``}`}</Text>
          {!buying ? <Text style={styles.muted}>{`Marketplace Commission · ${marketPrice(order.commissionCents)}`}</Text> : null}
          {!buying && order.sellerFundsStatus ? <Text style={styles.muted}>{order.sellerFundsStatus === `review_required` ? `Stripe Transfer Needs Review` : `Transferred To Stripe Balance`}</Text> : null}
          {order.transferStatus === `awaiting_transfer` ? <>
            <Text style={styles.notice}>{`Payment Confirmed · Registrar Transfer Pending`}</Text>
            <MarketButton id={`market-transfer-${order.id}`} label={opening === order.id ? `Opening Conversation` : `Open Transfer Conversation`} icon={MessageCircle} disabled={Boolean(opening) || state.pending} onPress={() => void openTransfer(order)} palette={palette} styles={styles} />
          </> : null}
          {pending && buying && checkoutMode !== undefined ? (checkoutMode === order.mode ? <View style={styles.actions}>
            <MarketButton id={`market-resume-${order.id}`} label={`Resume Checkout`} icon={CreditCard} disabled={state.pending || state.loading} primary onPress={() => void state.resume(order)} palette={palette} styles={styles} />
            <MarketButton id={`market-cancel-${order.id}`} label={`Cancel Checkout`} icon={X} disabled={state.pending || state.loading} onPress={() => void state.cancel(order.id)} palette={palette} styles={styles} />
          </View> : <Text style={styles.muted}>{marketCheckoutUnavailable}</Text>) : null}
        </View>;
      })}
    </View>
  );
};

const marketTabIds = [`browse`, `sell`, `inbox`, `orders`] as const;
const marketTabIcons = { sell: Tag, browse: Search, orders: Wallet, inbox: MessageCircle } satisfies Record<MarketView, LucideIcon>;

const ExternalMarketListings = ({ result, query, palette, styles }: MarketUI & { result: ReturnType<typeof useExternalMarketListings>; query: string }) => {
  const { status, listings, message, retry } = result;
  const failed = status === `unavailable` || status === `rate-limited`;
  return <View {...elementProps(`market-external-listings`)} style={styles.section}>
    <Text {...elementProps(`market-external-title`)} style={styles.heading} accessibilityRole={`header`}>{`Afternic Premium`}</Text>
    {status === `loading` ? <MarketSkeleton kind={`browse`} label={`Loading Afternic Premium Domains`} /> : null}
    {failed ? <View {...elementProps(`market-external-error`)} style={styles.section}>
      <Feedback id={`market-external-error-message`} styles={styles} error={message || (status === `rate-limited` ? `Premium Search Is Busy. Try Again Shortly.` : `Afternic Premium Listings Are Unavailable`)} />
      <MarketButton id={`market-external-retry`} label={`Retry Premium Search`} icon={RefreshCw} onPress={retry} palette={palette} styles={styles} />
    </View> : null}
    {status === `unconfigured` || (status === `ready` && !listings.length) ? <Text {...elementProps(`market-external-empty`)} style={styles.muted}>
      {message || (status === `unconfigured` ? `Afternic Premium is currently unavailable.`
        : query ? `No additional Afternic Premium domains found for this search.` : `No additional Afternic Premium domains to show right now.`)}
    </Text> : null}
    {listings.length > 0 ? <>
      <Text {...elementProps(`market-external-checkout-note`)} style={styles.muted}>{`GoDaddy confirms prices and handles checkout.`}</Text>
      <View {...elementProps(`market-external-listings-grid`)} style={styles.listGrid}>
        {listings.map(listing => {
          const id = `market-external-listing-${listing.domain}`;
          const estimatedTotal = externalMarketPrice(listing);
          const price = estimatedTotal ? `Estimated Total ${estimatedTotal}` : `Check Price On GoDaddy`;
          return <Link asChild key={listing.domain} href={registrarPurchaseUrl(`godaddy`, listing.domain) as Href}>
            <Pressable
              {...elementProps(id)}
              accessibilityRole={`link`}
              accessibilityLabel={`${listing.domain}, ${price}, View On GoDaddy`}
              style={StyleSheet.flatten([styles.panel, styles.listCard])}
            >
              <View {...elementProps(`${id}-summary`)} style={styles.listingHeadline}>
                <View style={styles.domainMark}><Globe2 size={20} color={palette.accent} accessible={false} /></View>
                <View style={styles.grow}>
                  <Text {...elementProps(`${id}-domain`)} style={styles.heading}>{listing.domain}</Text>
                  <Text {...elementProps(`${id}-price`)} style={styles.price}>{price}</Text>
                </View>
                <ExternalLink size={17} color={palette.accent} accessible={false} />
              </View>
            </Pressable>
          </Link>;
        })}
      </View>
    </> : null}
  </View>;
};

const DomainMarket = () => {
  const state = useDomainMarket();
  const scroll = useContext(ScrollContext)?.pageScroll;
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const styles = useMemo(() => createStyles(palette, wide), [palette, wide]);
  const ui = { palette, styles };
  const scrollTop = () => { if (scroll) scroll.scrollBy(-scroll.getPosition()); };
  const selectListing = (id?: string) => { state.selectListing(id); scrollTop(); };
  const showThread = (thread: MarketplaceThread) => { state.showThread(thread); scrollTop(); };
  const showOrder = (order: MarketplaceOrder) => {
    state.showOrder(order.id);
    scrollTop();
  };
  const browse = state.view === `browse`;
  const inAppDomains = useMemo(() => state.page.listings.map(listing => listing.domain), [state.page.listings]);
  const externalListings = useExternalMarketListings(browse && !state.listingId, state.query, inAppDomains);
  const showEmpty = !state.loading && !state.error && !state.page.listings.length;
  const view = marketViews[state.view];
  return (
    <View {...elementProps(`domain-market-page`)} style={styles.page}>
      <MarketHero
        title={view.title}
        description={view.description}
        icon={browse ? Store : marketTabIcons[state.view]}
        compact={browse && Boolean(state.listingId)}
        onSell={browse ? () => state.setView(`sell`) : undefined}
      />
      <View {...elementProps(`market-section-tabs`)} style={styles.tabs} accessibilityRole={`tablist`} accessibilityLabel={`Marketplace Sections`}>
        {marketTabIds.map(id => {
          const Icon = marketTabIcons[id];
          const selected = state.view === id;
          return <Pressable key={id} {...elementProps(`market-section-tab`, id)} onPress={() => state.setView(id)} style={[styles.tab, selected && styles.tabSelected]} accessibilityRole={`tab`} accessibilityState={{ selected }}>
            <Icon size={15} color={selected ? palette.contrast : palette.accent} accessible={false} />
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{marketViews[id].label}</Text>
          </Pressable>;
        })}
      </View>
      {browse ? (
        state.listingId ? state.currentSelection?.listing ? (
          <MarketListingDetail key={`${state.accountScope}:${state.listingId}`} listing={state.currentSelection.listing} signedIn={Boolean(state.account)} authLoading={state.authLoading} authParams={state.authParams} back={() => selectListing()} showThread={showThread} showOrder={showOrder} checkoutMode={state.checkoutMode} {...ui} />
        ) : state.currentSelection?.error ? (
          <View style={styles.panel}>
            <Feedback id={`market-listing-error`} styles={styles} error={state.currentSelection.error} />
            <MarketButton id={`market-listing-back`} label={`Back To Listings`} icon={ArrowLeft} onPress={() => selectListing()} {...ui} />
          </View>
        ) : <View style={styles.section}>
          <MarketButton id={`market-listing-back`} label={`Back To Listings`} icon={ArrowLeft} onPress={() => selectListing()} {...ui} />
          <MarketSkeleton kind={`listing`} label={`Loading Listing`} />
        </View> : (
          <View {...elementProps(`market-browse`)} style={styles.section}>
            <View {...elementProps(`market-search`)} style={styles.actions}>
              <TextInput {...elementProps(`market-search-input`)} value={state.search} onChangeText={state.setSearch} onSubmitEditing={state.submitSearch} returnKeyType={`search`} maxLength={253} autoCorrect={false} autoCapitalize={`none`} placeholder={`Search domain names`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Search Domain Listings`} style={[styles.input, styles.grow]} />
              <MarketButton id={`market-search-submit`} label={`Search`} icon={Search} primary onPress={state.submitSearch} {...ui} />
            </View>
            {state.account ? <ListingSuggestions dismissedIds={state.dismissedSuggestionIds} onDismiss={state.dismissSuggestion} onSelect={(domain, fields) => { state.suggestListing(domain, fields); scrollTop(); }} /> : null}
            <View style={styles.headingRow}>
              <Text style={[styles.heading, styles.grow]} accessibilityRole={`header`}>{`Domains For Sale`}</Text>
              <MarketButton id={`market-refresh`} label={`Refresh`} icon={RefreshCw} disabled={state.loading} onPress={state.refresh} {...ui} />
            </View>
            <Feedback id={`market-browse-error`} styles={styles} error={state.error} />
            {state.loading && !state.error && !state.page.listings.length ? <MarketSkeleton kind={`browse`} label={`Loading Marketplace Listings`} /> : null}
            {showEmpty ? (
              <View {...elementProps(`market-listings-empty`)} style={styles.empty}>
                {state.query ? <>
                  <Globe2 size={26} color={palette.accent} accessible={false} />
                  <Text style={styles.muted}>{`No Domains Database listings match your search`}</Text>
                </> : <>
                  <View {...elementProps(`market-listings-empty-heading`)} style={styles.emptyHeading}>
                    <Globe2 size={26} color={palette.accent} accessible={false} />
                    <Text style={styles.muted}>{`No domains published on this marketplace yet`}</Text>
                  </View>
                  <View style={styles.emptyAction}>
                    <MarketButton id={`market-listings-empty-list-domain`} label={`List a Domain`} icon={Plus} primary onPress={() => state.setView(`sell`)} {...ui} />
                  </View>
                </>}
              </View>
            ) : null}
            <View {...elementProps(`market-listings`)} style={styles.listGrid}>
              {state.page.listings.map(listing => (
                <View key={listing.id} {...elementProps(`market-listing`, listing.id)} style={[styles.panel, styles.listCard]}>
                  <Pressable {...elementProps(`market-listing-open`, listing.id)} style={styles.listingHeadline} accessibilityRole={`button`} accessibilityLabel={`View Listing For ${listing.domain}`} onPress={() => selectListing(listing.id)}>
                    <View style={styles.domainMark}><Globe2 size={20} color={palette.accent} accessible={false} /></View>
                    <View style={styles.grow}>
                      <Text {...elementProps(`market-listing-domain`, listing.id)} style={styles.heading}>{listing.domain}</Text>
                      <Text {...elementProps(`market-listing-amount`, listing.id)} style={styles.price}>{listing.priceCents === null ? listing.acceptOffers ? `Make An Offer` : `Sale Pending` : marketPrice(listing.priceCents)}</Text>
                    </View>
                    <ChevronRight size={17} color={palette.accent} accessible={false} />
                  </Pressable>
                  {listing.description ? <Text {...elementProps(`market-listing-description`, listing.id)} numberOfLines={2} style={styles.copy}>{listing.description}</Text> : null}
                  <MarketIdentity id={listing.id} name={listing.sellerName} username={listing.sellerUsername} photoURL={listing.sellerPhotoURL} {...ui} />
                </View>
              ))}
            </View>
            {state.page.nextCursor ? <MarketButton id={`market-load-more`} label={state.loadingMore ? `Loading Listings` : `Load More Listings`} icon={Plus} disabled={state.loadingMore} onPress={() => void state.loadMore()} {...ui} /> : null}
            {!state.loading || externalListings.status !== `loading` ? <ExternalMarketListings result={externalListings} query={state.query} {...ui} /> : null}
          </View>
        )
      ) : state.authLoading ? <MarketSkeleton kind={state.view} label={`Checking Account`} />
        : !state.account ? <MarketAuthPrompt params={state.authParams} {...ui}>{state.view === `sell` ? `Sign in to check selling eligibility and manage your domain listings.` : `Sign in to access your marketplace conversations and orders.`}</MarketAuthPrompt>
          : state.view === `sell` ? <MarketSellerPanel
            {...ui}
            fields={state.sellFields}
            domain={state.sellDomain}
            onChange={state.refresh}
            dismissSuggestion={state.dismissSuggestion}
            dismissedSuggestionIds={state.dismissedSuggestionIds}
            key={`${state.accountScope}:${state.sellDomain ?? ``}`}
          />
            : state.view === `inbox` ? <MarketInbox key={`${state.accountScope}:${state.thread?.id ?? ``}`} accountId={state.account.id} initialThread={state.thread} showOrder={showOrder} checkoutMode={state.checkoutMode} {...ui} />
              : <MarketOrders key={state.accountScope} accountId={state.account.id} orderId={state.orderId} showThread={showThread} checkoutMode={state.checkoutMode} {...ui} />}
    </View>
  );
};

export default DomainMarket;
