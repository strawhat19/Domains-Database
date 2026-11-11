import { Link } from 'expo-router';
import { Roles } from '../../types/types';
import { createStyles } from './styles.native';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import { ProfileAvatar } from '../Community/ProfileCard';
import { elementProps } from '../../shared/elementProps';
import { useDomainerDirectory } from './useDomainerDirectory';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getPublicProfileHref, routes } from '../../shared/routes';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { directoryDescription, profileFilters, profileOrders } from './options';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ArrowDownAZ, ArrowDownZA, ChevronDown, ChevronRight, CircleAlert, Crown, FileText, Globe2, House, RefreshCw, Search, UserRound, UsersRound, X } from 'lucide-react-native';

const gridGap = 12;
const gridMaxWidth = 1150;
const loadingCards = Array.from({ length: 6 }, (_, index) => String(index));
const filterIcons = { all: UsersRound, 'with-bio': FileText };
const orderIcons = { az: ArrowDownAZ, za: ArrowDownZA };

const DomainerDirectory = () => {
  const state = useDomainerDirectory();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const wide = width >= 800;
  const padding = wide ? 28 : 16;
  const styles = useMemo(() => createStyles(palette, wide, padding, gridGap, gridMaxWidth), [palette, wide, padding]);
  const gridWidth = measuredWidth || Math.max(0, Math.min(width, gridMaxWidth) - padding * 2);
  const columns = gridWidth >= 850 ? 3 : gridWidth >= 540 ? 2 : 1;
  const cardWidth = Math.floor((gridWidth - (columns - 1) * gridGap) / columns);
  const initialLoading = (state.loading || state.searching) && !state.profiles.length;
  const hasQuery = Boolean(state.query.trim());
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <View {...elementProps(`domainer-directory`)} style={styles.page}>
      <View {...elementProps(`domainer-directory-cover`)} style={styles.cover} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
        <DiscoveryBackdrop suffix={`domainer-directory-cover`} />
        <View {...elementProps(`domainer-directory-cover-inner`)} style={styles.coverInner}>
          <View {...elementProps(`domainer-directory-intro`)} style={styles.intro}>
            <View {...elementProps(`domainer-directory-heading`)} style={styles.inline}>
              <UsersRound size={wide ? 25 : 22} color={palette.accent} accessible={false} />
              <Text {...elementProps(`domainer-directory-title`)} style={styles.title} accessibilityRole={`header`}>{`Domainers`}</Text>
            </View>
            <Text {...elementProps(`domainer-directory-description`)} style={styles.muted}>{directoryDescription}</Text>
          </View>
          <View {...elementProps(`domainer-directory-breadcrumbs`)} style={styles.breadcrumbs}>
            <Link asChild href={routes.home.href}>
              <Pressable {...elementProps(`domainer-directory-breadcrumb-home`)} style={styles.breadcrumb} accessibilityRole={`link`}>
                <House size={14} color={palette.accent} accessible={false} />
                <Text style={styles.label}>{routes.home.label}</Text>
              </Pressable>
            </Link>
            <ChevronRight size={13} color={palette.muted} accessible={false} />
            <View {...elementProps(`domainer-directory-breadcrumb-current`)} style={styles.breadcrumb}>
              <UsersRound size={14} color={palette.accent} accessible={false} />
              <Text style={styles.label}>{`Domainers`}</Text>
            </View>
          </View>
        </View>
      </View>
      <View {...elementProps(`domainer-directory-canvas`)} style={styles.canvas}>
        <View {...elementProps(`domainer-directory-toolbar`)} style={styles.toolbar}>
          <View {...elementProps(`domainer-directory-search`)} style={styles.search}>
            <Search size={17} color={palette.accent} accessible={false} />
            <TextInput
              value={state.query}
              autoCorrect={false}
              style={styles.searchInput}
              returnKeyType={`search`}
              autoCapitalize={`none`}
              onChangeText={state.setQuery}
              placeholder={`Search Domainers`}
              placeholderTextColor={palette.muted}
              accessibilityLabel={`Search Domainer Profiles`}
              {...elementProps(`domainer-directory-search-input`)}
            />
            {state.query ? <Pressable {...elementProps(`domainer-directory-clear-search`)} style={styles.clear} onPress={() => state.setQuery(``)} accessibilityRole={`button`} accessibilityLabel={`Clear Search`}><X size={17} color={palette.accent} accessible={false} /></Pressable> : null}
          </View>
          <View {...elementProps(`domainer-directory-controls`)} style={styles.controls}>
            <View {...elementProps(`domainer-directory-filters`)} style={styles.segments} accessibilityRole={`radiogroup`} accessibilityLabel={`Filter Domainer Profiles`}>
              {profileFilters.map(({ value, label }) => {
                const Icon = filterIcons[value];
                const selected = state.filter === value;
                return <Pressable key={value} {...elementProps(`domainer-directory-filter`, value)} style={[styles.segment, selected && styles.segmentSelected]} accessibilityRole={`radio`} accessibilityState={{ checked: selected }} onPress={() => state.setFilter(value)}>
                  <Icon size={15} color={selected ? palette.contrast : palette.accent} accessible={false} />
                  <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
                </Pressable>;
              })}
            </View>
            <View {...elementProps(`domainer-directory-orders`)} style={styles.segments} accessibilityRole={`radiogroup`} accessibilityLabel={`Sort Profiles By Name`}>
              {profileOrders.map(({ value, label }) => {
                const Icon = orderIcons[value];
                const selected = state.order === value;
                return <Pressable key={value} {...elementProps(`domainer-directory-order`, value)} style={[styles.segment, selected && styles.segmentSelected]} accessibilityRole={`radio`} accessibilityState={{ checked: selected }} onPress={() => state.setOrder(value)}>
                  <Icon size={15} color={selected ? palette.contrast : palette.accent} accessible={false} />
                  <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
                </Pressable>;
              })}
            </View>
          </View>
        </View>
        {state.error ? <View {...elementProps(`domainer-directory-error`)} style={styles.state}>
          <CircleAlert size={24} color={palette.danger} accessible={false} />
          <Text style={[styles.stateText, styles.error]} accessibilityRole={`alert`}>{state.error}</Text>
          <Pressable {...elementProps(`domainer-directory-retry`)} style={styles.action} accessibilityRole={`button`} onPress={state.retry}>
            <RefreshCw size={15} color={palette.accent} accessible={false} /><Text style={styles.label}>{`Retry`}</Text>
          </Pressable>
        </View> : null}
        {state.searching && !initialLoading ? <Text {...elementProps(`domainer-directory-search-status`)} style={styles.statusLabel} accessibilityLiveRegion={`polite`}>{`Searching Profiles`}</Text> : null}
        {initialLoading || state.profiles.length ? <View {...elementProps(`domainer-directory-grid`)} style={styles.grid} onLayout={({ nativeEvent }) => setMeasuredWidth(nativeEvent.layout.width)} accessibilityState={{ busy: initialLoading || state.loadingMore }}>
          {initialLoading ? <>
            <Text {...elementProps(`domainer-directory-loading-label`)} style={styles.statusLabel} accessibilityLiveRegion={`polite`}>{`Loading Profiles`}</Text>
            {loadingCards.map(id => <View key={id} {...elementProps(`domainer-directory-skeleton`, id)} style={[styles.card, { width: cardWidth }]} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
              <View style={styles.inline}><View style={[styles.skeleton, styles.skeletonAvatar]} /><View style={[styles.skeleton, styles.skeletonTitle]} /></View>
              <View style={[styles.skeleton, styles.skeletonBio]} />
              <View style={styles.cardMetadata}><View style={[styles.skeleton, styles.skeletonRole]} /><View style={[styles.skeleton, styles.skeletonDomainCount]} /></View>
            </View>)}
          </> : state.profiles.map(profile => {
            const role = profile.cardMetadata?.role;
            const RoleIcon = role === Roles.Owner ? Crown : UserRound;
            const roleLabel = role ?? `Role Unavailable`;
            const domainCount = profile.cardMetadata?.totalDomains?.toLocaleString();
            const bio = profile.description?.trim();
            const cardLabel = [profile.name, bio, roleLabel, `Total Domains ${domainCount ?? `Unavailable`}`].filter(Boolean).join(`. `);
            return <Link key={profile.id} asChild href={getPublicProfileHref(profile.id)}>
              <Pressable {...elementProps(`domainer-directory-card`, profile.id)} style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]} accessibilityRole={`link`} accessibilityLabel={cardLabel}>
                <View {...elementProps(`domainer-directory-identity`, profile.id)} style={styles.identity}>
                  <View accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
                    <ProfileAvatar key={`${profile.id}:${profile.photoURL ?? ``}`} profile={profile} scope={`domainer-directory-${profile.id}`} />
                  </View>
                  <Text {...elementProps(`domainer-directory-name`, profile.id)} style={styles.name} numberOfLines={2}>{profile.name}</Text>
                  <ChevronRight size={17} color={palette.accent} accessible={false} />
                </View>
                {bio ? <Text {...elementProps(`domainer-directory-bio`, profile.id)} style={styles.bio} numberOfLines={3}>{bio}</Text> : null}
                <View {...elementProps(`domainer-directory-metadata`, profile.id)} style={styles.cardMetadata}>
                  <View {...elementProps(`domainer-directory-role`, profile.id)} style={styles.rolePill}>
                    <RoleIcon size={12} color={role ? palette.accent : palette.muted} accessible={false} />
                    <Text style={[styles.metadataLabel, !role && styles.metadataUnavailable]}>{roleLabel}</Text>
                  </View>
                  <View {...elementProps(`domainer-directory-domain-count`, profile.id)} style={styles.domainCount}>
                    <Globe2 size={13} color={palette.accent} accessible={false} />
                    <Text style={styles.metadataLabel}>{`Total Domains`}</Text>
                    <Text {...elementProps(`domainer-directory-domain-count-value`, profile.id)} accessibilityLabel={domainCount === undefined ? `Unavailable` : undefined} style={[styles.countValue, domainCount === undefined && styles.metadataUnavailable]}>{domainCount ?? `—`}</Text>
                  </View>
                </View>
              </Pressable>
            </Link>;
          })}
        </View> : null}
        {!initialLoading && !state.error && !state.profiles.length ? <View {...elementProps(`domainer-directory-empty`)} style={styles.state}>
          <Search size={24} color={palette.accent} accessible={false} />
          <Text style={styles.stateText} accessibilityLiveRegion={`polite`}>{hasQuery ? `No Matching Profiles` : state.filter === `with-bio` ? `No Profiles With A Bio` : `No Public Profiles Yet`}</Text>
        </View> : null}
        {state.hasMore && !state.searching && !state.error ? <Pressable {...elementProps(`domainer-directory-load-more`)} style={[styles.action, styles.loadMore, state.loadingMore && styles.disabled]} disabled={state.loadingMore} onPress={state.loadMore} accessibilityRole={`button`} accessibilityState={{ busy: state.loadingMore, disabled: state.loadingMore }}>
          <ChevronDown size={16} color={palette.accent} accessible={false} />
          <Text style={styles.label}>{state.loadingMore ? `Loading Profiles` : `Load More Profiles`}</Text>
        </Pressable> : null}
      </View>
    </View>
  );
};

export default DomainerDirectory;
