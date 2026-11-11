import { useMemo } from 'react';
import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import { createStyles } from './styles.native';
import { useLocalStorage } from '../../shared/config';
import MarketSkeleton from '../DomainMarket/MarketSkeleton';
import { elementProps } from '../../shared/elementProps';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { afternicPortalUrl } from '../../shared/marketplaceAfternic/client';
import { ChevronDown, Download, ExternalLink, RefreshCw, Store, Upload, type LucideIcon } from 'lucide-react-native';
import { afternicMoney, afternicStatusLabel, isAfternicCandidate, useMarketplaceAfternic, type MarketplaceAfternicProps } from './useMarketplaceAfternic';

const AfternicPanel = ({ seller, onImport }: MarketplaceAfternicProps) => {
  const { palette } = useTheme();
  const state = useMarketplaceAfternic(onImport);
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const styles = useMemo(() => createStyles(palette, wide), [palette, wide]);
  const disabled = !!state.busy;
  const canManage = Boolean(seller?.eligible && seller.username);
  const candidates = seller?.listings.filter(isAfternicCandidate) ?? [];
  const loading = !state.portfolio && !state.error && (!state.status || state.busy === `portfolio`);
  if (state.status?.configured === false) return null;
  const note = (id: string, label: string) => <Text {...elementProps(`marketplace-afternic-note`, id)} style={styles.note}>{label}</Text>;
  const action = (id: string, label: string, onPress: () => void, Icon?: LucideIcon, blocked = false, primary = false) => (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole={`button`}
      accessibilityState={{ disabled: blocked }}
      {...elementProps(`marketplace-afternic-action`, id)}
      style={({ pressed }) => [styles.button, primary && styles.primary, (blocked || pressed) && styles.dimmed]}
    >
      {Icon && <Icon {...elementProps(`marketplace-afternic-action-icon`, id)} size={15} accessible={false} color={primary ? palette.contrast : palette.accent} />}
      <Text {...elementProps(`marketplace-afternic-action-label`, id)} style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );

  return (
    <View {...elementProps(`marketplace-afternic`)} style={styles.card}>
      <Pressable onPress={state.toggle} style={styles.toggle} accessibilityRole={`button`} accessibilityState={{ expanded: state.open }} {...elementProps(`marketplace-afternic-toggle`)}>
        <Store {...elementProps(`marketplace-afternic-icon`)} size={18} color={palette.accent} accessible={false} />
        <Text {...elementProps(`marketplace-afternic-toggle-label`)} style={styles.heading}>{`Your Afternic Listings`}</Text>
        <ChevronDown {...elementProps(`marketplace-afternic-chevron`)} size={15} color={palette.accent} accessible={false} style={state.open ? styles.expanded : undefined} />
      </Pressable>
      {state.open && (
        <View {...elementProps(`marketplace-afternic-panel`)} style={styles.panel} accessibilityState={{ busy: disabled }}>
          {!!state.error && <Text {...elementProps(`marketplace-afternic-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
          {!!state.notice && <Text {...elementProps(`marketplace-afternic-notice`)} style={styles.note} accessibilityLiveRegion={`polite`}>{state.notice}</Text>}
          {loading ? <MarketSkeleton kind={`browse`} label={state.status ? `Loading Afternic Listings` : `Checking Afternic Connection`} /> : null}
          {state.status?.configured ? (
            <>
              {!loading && action(`load`, state.portfolio ? `Refresh Afternic Listings` : `Retry Afternic Listings`, () => void state.refresh(), RefreshCw, disabled)}
              {state.portfolio && (
                <View {...elementProps(`marketplace-afternic-portfolio`)} style={styles.list}>
                  {state.portfolio.listings.length > 0 && <View {...elementProps(`marketplace-afternic-grid`)} style={styles.grid}>
                    {state.portfolio.listings.map(listing => (
                      <View key={listing.domain} {...elementProps(`marketplace-afternic-remote`, listing.domain)} style={styles.listingCard}>
                        <View {...elementProps(`marketplace-afternic-remote-copy`, listing.domain)} style={styles.copy}>
                          <Text {...elementProps(`marketplace-afternic-remote-domain`, listing.domain)} style={styles.title}>{listing.domain}</Text>
                          <View {...elementProps(`marketplace-afternic-remote-meta`, listing.domain)} style={styles.meta}>
                            <Text {...elementProps(`marketplace-afternic-remote-price`, listing.domain)} style={styles.price}>{afternicMoney(listing.priceCents)}</Text>
                            <Text {...elementProps(`marketplace-afternic-remote-status`, listing.domain)} style={[styles.status, listing.status === `ACTIVE` && styles.activeStatus]}>{afternicStatusLabel(listing.status)}</Text>
                          </View>
                        </View>
                        {canManage && listing.canImport && action(`import-${listing.domain}`, state.imported[listing.domain] ? `Imported` : `Import Draft`, () => void state.importDraft(listing.domain), Download, disabled || !!state.imported[listing.domain])}
                      </View>
                    ))}
                  </View>}
                  {!state.portfolio.listings.length && !state.portfolio.skipped && state.portfolio.nextOffset === null && note(`empty`, `No Afternic Listings Found`)}
                  {!!state.portfolio.skipped && note(`skipped`, `${state.portfolio.skipped} Afternic Listing(s) Could Not Be Read`)}
                  {seller?.eligible && !seller.username && note(`seller`, `Choose your seller profile URL to import drafts.`)}
                  {state.portfolio.nextOffset !== null && action(`next`, `Load More Afternic Listings`, () => { const next = state.portfolio?.nextOffset; if (next != null) void state.load(next); }, undefined, disabled)}
                </View>
              )}
              {canManage && <View {...elementProps(`marketplace-afternic-exports`)} style={styles.list}>
                <Text {...elementProps(`marketplace-afternic-exports-title`)} style={styles.title} accessibilityRole={`header`}>{`Send To Afternic`}</Text>
                {!candidates.length && note(`no-candidates`, `Create a draft or pause a listing to send it to Afternic.`)}
                {candidates.map(listing => {
                  const provider = state.results[listing.id]?.providerListing;
                  const review = state.review?.listingId === listing.id ? state.review : null;
                  return (
                    <View key={listing.id} {...elementProps(`marketplace-afternic-export`, listing.id)} style={styles.list}>
                      <View {...elementProps(`marketplace-afternic-export-row`, listing.id)} style={styles.row}>
                        <View {...elementProps(`marketplace-afternic-export-copy`, listing.id)} style={styles.copy}>
                          <Text {...elementProps(`marketplace-afternic-export-domain`, listing.id)} style={styles.title}>{listing.domain}</Text>
                          {provider ? note(listing.id, `Afternic ${afternicStatusLabel(provider.status)}${provider.fastTransferStatus ? ` · Fast Transfer ${afternicStatusLabel(provider.fastTransferStatus)}` : ``}`)
                            : listing.afternicHold && note(listing.id, `In-App Publication Held · Check Afternic Status`)}
                        </View>
                        {action(`review-${listing.id}`, listing.afternicHold ? `Check Status` : `Review Listing`, () => void (listing.afternicHold ? state.check(listing.id) : state.reviewListing(listing.id)), listing.afternicHold ? RefreshCw : Upload, disabled)}
                      </View>
                      {review && (
                        <View {...elementProps(`marketplace-afternic-review`, listing.id)} style={styles.review} accessibilityLiveRegion={`polite`}>
                          {review.providerListing ? note(`review-existing`, `This domain is already at Afternic (${afternicStatusLabel(review.providerListing.status)}). Manage it there or import the existing listing above.`) : (
                            <>
                              {note(`review-price`, `${afternicMoney(review.priceCents)}${review.minimumOfferCents === null ? `` : ` · Offers From ${afternicMoney(review.minimumOfferCents)}`}`)}
                              {note(`review-verification`, `Add the verification TXT record shown for this draft. Afternic may need its own verification before it activates your listing.`)}
                            </>
                          )}
                          <View {...elementProps(`marketplace-afternic-review-actions`, listing.id)} style={styles.actions}>
                            {!review.providerListing && action(`publish`, `List On Afternic`, () => void state.publish(review), Upload, disabled, true)}
                            {action(`cancel`, `Close Review`, state.clearReview)}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>}
            </>
          ) : !!state.error && action(`retry`, `Retry Afternic Connection`, () => void state.refresh(), RefreshCw, disabled)}
          {!loading && <Link href={afternicPortalUrl} asChild>
            <Pressable {...elementProps(`marketplace-afternic-link`)} style={styles.button} accessibilityRole={`link`}>
              <ExternalLink {...elementProps(`marketplace-afternic-link-icon`)} size={15} color={palette.accent} accessible={false} />
              <Text {...elementProps(`marketplace-afternic-link-label`)} style={styles.buttonText}>{`Open Afternic`}</Text>
            </Pressable>
          </Link>}
        </View>
      )}
    </View>
  );
};

const MarketplaceAfternic = (props: MarketplaceAfternicProps) => {
  const { user, loading, loginRevision } = useAuth();
  return !useLocalStorage && !loading && user?.active && !user.anonymous && user.role !== Roles.Guest
    ? <AfternicPanel key={`${user.id}:${loginRevision}`} {...props} /> : null;
};

export default MarketplaceAfternic;
