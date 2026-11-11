import { Image } from 'expo-image';
import { Link } from 'expo-router';
import PageMeta from '../PageMeta';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import { useSellerProfile } from './useSellerProfile';
import { elementProps } from '../../shared/elementProps';
import { publicHttpsUrl } from '../../shared/social/content';
import { useMemo, useState, useEffect, useContext } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { sellerProfilePath } from '../../shared/marketplace/paths';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { usePublicProfilePortfolio } from '../PublicProfile/usePublicProfilePortfolio';
import { Text, View, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { PortfolioDomainCount, SharedProfileDomains } from '../PublicProfile/PortfolioDetails';
import { sellerStatus, sellerProfileUrl, formatSellerJoinDate, formatSellerListingPrice } from './presentation';
import { Check, X, Lock, Store, House, Globe2, Pencil, Search, UserRound, UsersRound, CalendarDays, CircleAlert, RefreshCw, ChevronRight } from 'lucide-react-native';

const SellerProfile = ({ username }: { username: string }) => {
  const state = useSellerProfile(username);
  const { active, profile, canEdit, editor, privatePage, isOwnProfile } = state;
  const portfolioId = privatePage ? undefined : profile?.id;
  const portfolio = usePublicProfilePortfolio(portfolioId);
  const sharedDomains = portfolio.data?.domains;
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const [failedPhoto, setFailedPhoto] = useState(``);
  const wide = width >= 800;
  const styles = useMemo(() => createStyles(palette, wide), [palette, wide]);
  const photo = profile?.photoURL ? publicHttpsUrl(profile.photoURL) : null;
  const photoKey = `${profile?.username ?? ``}:${photo ?? ``}`;
  const joined = formatSellerJoinDate(profile?.joinedAt);
  const status = sellerStatus(privatePage, active.result?.state === `not-found`, active.error);
  const VisibilityIcon = privatePage ? Lock : Globe2;
  const StatusIcon = privatePage ? Lock : active.error ? CircleAlert : UserRound;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <View {...elementProps(`seller-profile`)} style={styles.page}>
      <PageMeta noIndex title={`Domainer Profile`} description={`Explore domainer profiles and published domain listings on Domains Database.`} canonicalPath={sellerProfilePath(profile?.username ?? state.username)} />
      <View {...elementProps(`seller-profile-cover`)} style={styles.cover} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
        <DiscoveryBackdrop suffix={`seller-profile-cover`} />
        <View {...elementProps(`seller-profile-identity`)} style={[styles.identity, !profile && !active.loading && styles.identityUnavailable]}>
          {active.loading ? (
            <View {...elementProps(`seller-profile-identity-loading`)} style={styles.identityMain} accessibilityLabel={`Loading Domainer Profile`} accessibilityLiveRegion={`polite`} accessible>
              <View style={[styles.avatar, styles.skeleton]} />
              <View style={styles.identityCopy}><View style={[styles.skeleton, styles.skeletonHandle]} /><View style={[styles.skeleton, styles.skeletonTitle]} /></View>
            </View>
          ) : profile ? (
            <View {...elementProps(`seller-profile-identity-main`)} style={styles.identityMain}>
              <View {...elementProps(`seller-profile-avatar`, profile.username)} style={styles.avatar} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
                <Text {...elementProps(`seller-profile-avatar-initial`, profile.username)} style={styles.initial}>{profile.name.trim()?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}</Text>
                {photo && failedPhoto !== photoKey ? <Image key={photoKey} {...elementProps(`seller-profile-avatar-image`, profile.username)} style={styles.photo} contentFit={`cover`} source={{ uri: photo }} accessible={false} onError={() => setFailedPhoto(photoKey)} /> : null}
              </View>
              <View {...elementProps(`seller-profile-identity-copy`)} style={styles.identityCopy}>
                <View {...elementProps(`seller-profile-identity-meta`)} style={styles.identityMeta}>
                  <View {...elementProps(`seller-profile-badge`)} style={styles.badge}><Store size={13} color={palette.contrast} accessible={false} /><Text style={styles.badgeText}>{`Domainer`}</Text></View>
                  {!editor && (canEdit ? (
                    <Pressable {...elementProps(`seller-profile-edit-username`)} accessibilityLabel={`Edit Profile URL for @${profile.username}`} accessibilityRole={`button`} onPress={state.startEdit} style={styles.inlineAction}>
                      <Text style={styles.username}><Text style={styles.at}>@</Text>{profile.username}</Text>
                      <Pencil size={14} color={palette.accent} accessible={false} />
                    </Pressable>
                  ) : <Text {...elementProps(`seller-profile-username`)} style={styles.username}><Text style={styles.at}>@</Text>{profile.username}</Text>)}
                </View>
                {editor ? (
                  <View {...elementProps(`seller-profile-username-editor`)} style={styles.editor} accessibilityState={{ busy: editor.busy }}>
                    <View {...elementProps(`seller-profile-username-editor-row`)} style={styles.editorRow}>
                      <TextInput autoFocus maxLength={30} autoCorrect={false} autoCapitalize={`none`} returnKeyType={`done`} editable={!editor.busy} value={editor.draft} onChangeText={state.changeDraft} accessibilityLabel={`Profile URL`} onSubmitEditing={() => void state.saveUsername()} {...elementProps(`seller-profile-username-input`)} style={styles.input} />
                      <Pressable {...elementProps(`seller-profile-username-save`)} accessibilityRole={`button`} accessibilityLabel={`Save Profile URL`} accessibilityState={{ disabled: editor.busy, busy: editor.busy }} disabled={editor.busy} style={[styles.square, styles.primary, editor.busy && styles.disabled]} onPress={() => void state.saveUsername()}><Check size={17} color={palette.contrast} accessible={false} /></Pressable>
                      <Pressable {...elementProps(`seller-profile-username-cancel`)} accessibilityRole={`button`} accessibilityLabel={`Cancel Editing Profile URL`} accessibilityState={{ disabled: editor.busy }} disabled={editor.busy} style={[styles.square, editor.busy && styles.disabled]} onPress={state.cancelEdit}><X size={17} color={palette.accent} accessible={false} /></Pressable>
                    </View>
                    <Text {...elementProps(`seller-profile-username-hint`)} style={styles.metaText}>{`${sellerProfilePath(editor.draft.trim().toLowerCase() || `username`)} · 3–30 lowercase letters or numbers`}</Text>
                    {editor.error ? <Text {...elementProps(`seller-profile-username-error`)} accessibilityLiveRegion={`assertive`} style={styles.error}>{editor.error}</Text> : null}
                  </View>
                ) : null}
                <Text {...elementProps(`seller-profile-heading`)} style={styles.title} accessibilityRole={`header`}>{profile.name}</Text>
                {joined ? <View {...elementProps(`seller-profile-joined`)} style={styles.joined}><CalendarDays size={14} color={palette.accent} accessible={false} /><Text style={styles.metaText}>{`Joined ${joined}`}</Text></View> : null}
              </View>
            </View>
          ) : null}
          <View {...elementProps(`seller-profile-identity-side`)} style={styles.identitySide}>
            {portfolioId ? <PortfolioDomainCount id={portfolioId} portfolio={portfolio} /> : null}
            <View {...elementProps(`seller-profile-breadcrumbs`)} style={styles.crumbs}>
              <Link href={routes.home.href} asChild><Pressable {...elementProps(`seller-profile-breadcrumb-home`)} style={styles.crumb} accessibilityRole={`link`}><House size={14} color={palette.accent} accessible={false} /><Text style={styles.crumbText}>{routes.home.label}</Text></Pressable></Link>
              <ChevronRight size={13} color={palette.muted} accessible={false} />
              <Link href={routes.domainers.href} asChild><Pressable {...elementProps(`seller-profile-breadcrumb-domainers`)} style={styles.crumb} accessibilityRole={`link`}><UsersRound size={14} color={palette.accent} accessible={false} /><Text style={styles.crumbText}>{routes.domainers.label}</Text></Pressable></Link>
              <ChevronRight size={13} color={palette.muted} accessible={false} />
              <View {...elementProps(`seller-profile-breadcrumb-current`)} style={[styles.crumb, styles.crumbCurrent]}>
                <UserRound size={14} color={palette.accent} accessible={false} />
                <Text numberOfLines={1} style={[styles.crumbText, styles.crumbCurrent]}>{profile?.name ?? `Domainer Profile`}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View {...elementProps(`seller-profile-canvas`)} style={styles.canvas}>
        {active.loading ? (
          <View {...elementProps(`seller-profile-loading`)} style={styles.body} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
            <View style={[styles.details, styles.skeleton, styles.skeletonPanel]} />
            <View style={[styles.listings, styles.skeleton, styles.skeletonPanel]} />
          </View>
        ) : profile ? (
          <>
            {privatePage ? <View {...elementProps(`seller-profile-private-note`)} style={styles.privateNote}><Lock size={15} color={palette.accent} accessible={false} /><Text style={styles.metaText}>{`Visitors cannot see the details or listings on this profile page.`}</Text></View> : null}
            <View {...elementProps(`seller-profile-body`)} style={styles.body}>
              <View {...elementProps(`seller-profile-details`)} style={styles.details}>
                <Text {...elementProps(`seller-profile-details-heading`)} style={styles.heading} accessibilityRole={`header`}>{`Profile Details`}</Text>
                <View {...elementProps(`seller-profile-visibility`)} style={styles.detail}>
                  <Text style={styles.metaText}>{`Visibility`}</Text>
                  <View style={styles.inline}><VisibilityIcon size={15} color={palette.accent} accessible={false} /><Text style={styles.detailValue}>{privatePage ? `Private` : `Public`}</Text></View>
                </View>
                <View {...elementProps(`seller-profile-address`)} style={styles.detail}><Text style={styles.metaText}>{`Profile URL`}</Text><Text style={styles.detailValue} selectable>{sellerProfileUrl(profile.username)}</Text></View>
                {profile.description ? <View {...elementProps(`seller-profile-bio`)} style={styles.detail}><Text style={styles.metaText}>{`Bio`}</Text><Text style={styles.detailValue}>{profile.description}</Text></View> : null}
                {isOwnProfile ? <Link href={routes.profile.href} asChild><Pressable {...elementProps(`seller-profile-settings`)} style={styles.action} accessibilityRole={`link`}><Pencil size={14} color={palette.accent} accessible={false} /><Text style={styles.detailValue}>{`Profile Settings`}</Text></Pressable></Link> : null}
                {portfolioId && sharedDomains?.length ? <View {...elementProps(`seller-profile-portfolio`)} style={styles.portfolio}><SharedProfileDomains id={portfolioId} domains={sharedDomains} /></View> : null}
              </View>
              <View {...elementProps(`seller-profile-listings`)} style={styles.listings}>
                <View {...elementProps(`seller-profile-listings-heading-row`)} style={styles.sectionHeading}>
                  <View style={styles.inline}><Store size={20} color={palette.accent} accessible={false} /><Text {...elementProps(`seller-profile-listings-heading`)} style={styles.heading} accessibilityRole={`header`}>{`Published Listings`}</Text></View>
                  <Pressable {...elementProps(`seller-profile-refresh`)} style={[styles.square, (state.loadingMore || editor?.busy) && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Refresh Domainer Profile`} accessibilityState={{ disabled: Boolean(state.loadingMore || editor?.busy) }} disabled={state.loadingMore || editor?.busy} onPress={state.refresh}><RefreshCw size={16} color={palette.accent} accessible={false} /></Pressable>
                </View>
                {state.listings.length ? (
                  <View {...elementProps(`seller-profile-listing-list`)} style={styles.list}>
                    {state.listings.map((listing, index) => (
                      <Link key={listing.id} href={{ pathname: routes.market.href, params: { listing: listing.id } }} asChild>
                        <Pressable {...elementProps(`seller-profile-listing`, listing.id)} style={({ pressed }) => [styles.listing, index > 0 && styles.listingDivider, pressed && styles.pressed]} accessibilityRole={`link`}>
                          <View {...elementProps(`seller-profile-listing-mark`, listing.id)} style={styles.listingMark}><Globe2 size={21} color={palette.accent} accessible={false} /></View>
                          <View {...elementProps(`seller-profile-listing-copy`, listing.id)} style={styles.listingCopy}>
                            <Text {...elementProps(`seller-profile-listing-name`, listing.id)} style={styles.listingName}>{listing.domain}</Text>
                            {listing.description ? <Text {...elementProps(`seller-profile-listing-description`, listing.id)} numberOfLines={2} style={styles.metaText}>{listing.description}</Text> : null}
                            <Text {...elementProps(`seller-profile-listing-price`, listing.id)} style={styles.price}>{formatSellerListingPrice(listing)}</Text>
                          </View>
                          <ChevronRight size={16} color={palette.muted} accessible={false} />
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : <View {...elementProps(`seller-profile-listings-empty`)} style={styles.empty}><Search size={27} color={palette.accent} accessible={false} /><Text style={styles.metaText}>{`No Published Listings`}</Text></View>}
                {state.hasMore ? <Pressable {...elementProps(`seller-profile-load-more`)} style={[styles.action, state.loadingMore && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.loadingMore, disabled: state.loadingMore }} disabled={state.loadingMore} onPress={state.loadMore}><Text style={styles.detailValue}>{state.loadingMore ? `Loading Listings` : `Load More Listings`}</Text></Pressable> : null}
              </View>
            </View>
          </>
        ) : (
          <View {...elementProps(`seller-profile-status`)} style={styles.status}>
            <View style={styles.statusIcon}><StatusIcon size={29} color={palette.accent} accessible={false} /></View>
            <Text {...elementProps(`seller-profile-heading`)} style={[styles.title, styles.center]} accessibilityRole={`header`}>{status.title}</Text>
            <Text {...elementProps(`seller-profile-status-detail`)} style={styles.statusDetail}>{status.detail}</Text>
            <View {...elementProps(`seller-profile-status-actions`)} style={styles.statusActions}>
              <Link href={routes.market.href} asChild><Pressable {...elementProps(`seller-profile-browse-market`)} style={styles.action} accessibilityRole={`link`}><Store size={15} color={palette.accent} accessible={false} /><Text style={styles.detailValue}>{`Browse Markets`}</Text></Pressable></Link>
              {active.error ? <Pressable {...elementProps(`seller-profile-retry`)} style={styles.action} accessibilityRole={`button`} onPress={state.refresh}><RefreshCw size={15} color={palette.accent} accessible={false} /><Text style={styles.detailValue}>{`Retry`}</Text></Pressable> : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default SellerProfile;
