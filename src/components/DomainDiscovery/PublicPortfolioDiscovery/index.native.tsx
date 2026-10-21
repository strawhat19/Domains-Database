import { useMemo } from 'react';
import { Link } from 'expo-router';
import PortfolioCard from './PortfolioCard';
import { createStyles } from './styles.native';
import { routes } from '../../../shared/routes';
import type { PublicPortfolioDiscoveryProps } from './types';
import { elementProps } from '../../../shared/elementProps';
import { useAuth } from '../../../shared/authContext/useAuth';
import { usePublicPortfolioDiscovery } from './usePublicPortfolioDiscovery';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import { X, Search, Globe2, Compass, Clock3, UserRound, RefreshCw, SlidersHorizontal, ChevronDown, ArrowDownAZ } from 'lucide-react-native';

const sortOptions = [
  { id: `name` as const, label: `A–Z`, Icon: ArrowDownAZ },
  { id: `newest` as const, label: `Newest`, Icon: Clock3 },
  { id: `builder` as const, label: `Builder`, Icon: UserRound },
];

const PublicPortfolioDiscovery = ({ profiles, loading, error, onRefresh, scope = `portfolios` }: PublicPortfolioDiscoveryProps) => {
  const { user } = useAuth();
  const { palette } = useTheme();
  const state = usePublicPortfolioDiscovery(profiles);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const extensions = [`all`, ...state.filters.extensions];
  const statuses = [{ value: `all`, label: `All Stages` }, ...state.filters.statuses];

  return (
    <View {...elementProps(`public-discovery`, scope)} style={styles.root}>
      <View {...elementProps(`public-discovery-header`, scope)} style={styles.header}>
        <View {...elementProps(`public-discovery-title-group`, scope)} style={styles.titleGroup}>
          <View {...elementProps(`public-discovery-title-row`, scope)} style={styles.titleRow}>
            <Compass {...elementProps(`public-discovery-title-icon`, scope)} size={19} color={palette.accent} />
            <Text {...elementProps(`public-discovery-title`, scope)} style={styles.title} accessibilityRole={`header`}>
              {`Explore Shared Domains`}
            </Text>
          </View>
          <Text {...elementProps(`public-discovery-caption`, scope)} style={styles.caption}>
            {`Find a project, meet its builder, and follow what comes next. Shared domains are member submissions.`}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          accessibilityRole={`button`}
          accessibilityState={{ disabled: loading }}
          accessibilityLabel={`Refresh Shared Domains`}
          {...elementProps(`public-discovery-action`, `refresh-${scope}`)}
          style={({ pressed }) => [styles.action, (pressed || loading) && styles.disabled]}
        >
          <RefreshCw {...elementProps(`public-discovery-refresh-icon`, scope)} size={15} color={palette.accent} />
          <Text {...elementProps(`public-discovery-refresh-label`, scope)} style={styles.actionLabel}>
            {`Refresh`}
          </Text>
        </Pressable>
      </View>
      <View {...elementProps(`public-discovery-controls`, scope)} style={styles.controls}>
        <View {...elementProps(`public-discovery-search`, scope)} style={styles.search}>
          <Search {...elementProps(`public-discovery-search-icon`, scope)} size={16} color={palette.muted} />
          <TextInput
            value={state.query}
            autoCorrect={false}
            autoCapitalize={`none`}
            style={styles.input}
            onChangeText={state.changeQuery}
            placeholderTextColor={palette.placeholder}
            {...elementProps(`public-discovery-input`, scope)}
            placeholder={`Search domains, projects, or builders`}
            accessibilityLabel={`Search Shared Domains, Projects, Or Builders`}
          />
          {!!state.query && (
            <Pressable
              accessibilityRole={`button`}
              accessibilityLabel={`Clear Domain Search`}
              onPress={() => state.changeQuery(``)}
              {...elementProps(`public-discovery-action`, `clear-query-${scope}`)}
              style={styles.action}
            >
              <X {...elementProps(`public-discovery-clear-query-icon`, scope)} size={14} color={palette.muted} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          keyboardShouldPersistTaps={`handled`}
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={`Filter Shared Domains By Extension`}
          {...elementProps(`public-discovery-extensions`, scope)}
          contentContainerStyle={styles.filters}
        >
          {extensions.map(extension => {
            const selected = extension === state.extension;
            const label = extension === `all` ? `All TLDs` : `.${extension}`;
            const id = `${scope}-${extension}`;
            return (
              <Pressable
                key={extension}
                accessibilityRole={`button`}
                accessibilityLabel={`Show ${label}`}
                accessibilityState={{ selected }}
                onPress={() => state.changeExtension(extension)}
                {...elementProps(`public-discovery-filter`, `extension-${id}`)}
                style={[styles.filter, selected && styles.active]}
              >
                <Globe2 {...elementProps(`public-discovery-extension-icon`, id)} size={12} color={selected ? palette.accent : palette.muted} />
                <Text {...elementProps(`public-discovery-extension-label`, id)} style={[styles.filterLabel, selected && styles.activeLabel]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          keyboardShouldPersistTaps={`handled`}
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={`Filter Shared Domains By Project Stage`}
          {...elementProps(`public-discovery-stages`, scope)}
          contentContainerStyle={styles.filters}
        >
          {statuses.map(status => {
            const selected = status.value === state.status;
            const id = `${scope}-${status.value}`;
            return (
              <Pressable
                key={status.value}
                accessibilityRole={`button`}
                accessibilityState={{ selected }}
                accessibilityLabel={`Show ${status.label} Projects`}
                onPress={() => state.changeStatus(status.value)}
                {...elementProps(`public-discovery-filter`, `stage-${id}`)}
                style={[styles.filter, selected && styles.active]}
              >
                {status.value === `all` && <SlidersHorizontal {...elementProps(`public-discovery-stage-icon`, id)} size={12} color={selected ? palette.accent : palette.muted} />}
                <Text {...elementProps(`public-discovery-stage-label`, id)} style={[styles.filterLabel, selected && styles.activeLabel]}>
                  {status.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View {...elementProps(`public-discovery-sort-row`, scope)} style={styles.sortRow}>
          <Text {...elementProps(`public-discovery-count`, scope)} style={styles.caption} accessibilityLiveRegion={`polite`}>
            {loading ? `Loading shared domains…` : `${state.total} of ${state.results.length} shared domain(s) · ${state.builderCount} builder(s)`}
          </Text>
          <View {...elementProps(`public-discovery-sort-controls`, scope)} style={styles.sortControls} accessibilityLabel={`Sort Shared Domains`}>
            {sortOptions.map(option => {
              const selected = option.id === state.sort;
              const id = `${scope}-${option.id}`;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole={`button`}
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Sort Shared Domains By ${option.label}`}
                  onPress={() => state.changeSort(option.id)}
                  {...elementProps(`public-discovery-filter`, `sort-${id}`)}
                  style={[styles.filter, selected && styles.active]}
                >
                  <option.Icon {...elementProps(`public-discovery-sort-icon`, id)} size={12} color={selected ? palette.accent : palette.muted} />
                  <Text {...elementProps(`public-discovery-sort-label`, id)} style={[styles.filterLabel, selected && styles.activeLabel]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {loading ? (
        <View {...elementProps(`public-discovery-loading`, scope)} style={styles.grid} accessibilityLabel={`Loading Shared Domains`} accessibilityLiveRegion={`polite`}>
          {[0, 1, 2].map(index => (
            <View key={index} {...elementProps(`public-discovery-card`, `skeleton-${scope}-${index}`)} style={styles.card} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
              <View {...elementProps(`public-discovery-skeleton`, `name-${scope}-${index}`)} style={[styles.skeleton, styles.skeletonName]} />
              <View {...elementProps(`public-discovery-skeleton`, `stage-${scope}-${index}`)} style={styles.skeleton} />
              <View {...elementProps(`public-discovery-skeleton`, `copy-${scope}-${index}`)} style={[styles.skeleton, styles.skeletonDescription]} />
              <View {...elementProps(`public-discovery-skeleton`, `builder-${scope}-${index}`)} style={styles.skeleton} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View {...elementProps(`public-discovery-error`, scope)} style={styles.state} accessibilityLiveRegion={`polite`}>
          <Text {...elementProps(`public-discovery-error-title`, scope)} style={styles.stateTitle}>
            {`Shared Domains Unavailable`}
          </Text>
          <Text {...elementProps(`public-discovery-error-copy`, scope)} style={[styles.stateCopy, styles.error]}>
            {error}
          </Text>
          <Pressable onPress={onRefresh} accessibilityRole={`button`} accessibilityLabel={`Retry Shared Domains`} {...elementProps(`public-discovery-action`, `retry-${scope}`)} style={styles.action}>
            <RefreshCw {...elementProps(`public-discovery-retry-icon`, scope)} size={14} color={palette.accent} />
            <Text {...elementProps(`public-discovery-retry-label`, scope)} style={styles.actionLabel}>
              {`Try Again`}
            </Text>
          </Pressable>
        </View>
      ) : state.visible.length ? (
        <View {...elementProps(`public-discovery-grid`, scope)} style={styles.grid}>
          {state.visible.map(result => <PortfolioCard key={result.key} result={result} scope={scope} styles={styles} palette={palette} />)}
        </View>
      ) : (
        <View {...elementProps(`public-discovery-empty`, scope)} style={styles.state}>
          <Compass {...elementProps(`public-discovery-empty-icon`, scope)} size={24} color={palette.accent} />
          <Text {...elementProps(`public-discovery-empty-title`, scope)} style={styles.stateTitle}>
            {state.filtered ? `No Shared Domains Match` : `The Next Project Could Be Yours`}
          </Text>
          <Text {...elementProps(`public-discovery-empty-copy`, scope)} style={styles.stateCopy}>
            {state.filtered ? `Try another search, extension, or project stage.` : `Public portfolios appear when members make their profiles public and turn on Share Domain Names in Profile.`}
          </Text>
          {state.filtered ? (
            <Pressable onPress={state.clearFilters} accessibilityRole={`button`} accessibilityLabel={`Clear Discovery Filters`} {...elementProps(`public-discovery-action`, `clear-filters-${scope}`)} style={styles.action}>
              <X {...elementProps(`public-discovery-clear-filters-icon`, scope)} size={14} color={palette.accent} />
              <Text {...elementProps(`public-discovery-clear-filters-label`, scope)} style={styles.actionLabel}>
                {`Clear Filters`}
              </Text>
            </Pressable>
          ) : (
            <Link href={user ? routes.profile.href : { params: { returnTo: routes.profile.href }, pathname: routes.signin.href }} asChild>
              <Pressable accessibilityRole={`link`} accessibilityLabel={user ? `Open Profile Settings` : `Sign In To Share Your Portfolio`} {...elementProps(`public-discovery-action`, `profile-${scope}`)} style={styles.action}>
                <UserRound {...elementProps(`public-discovery-profile-icon`, scope)} size={14} color={palette.accent} />
                <Text {...elementProps(`public-discovery-profile-label`, scope)} style={styles.actionLabel}>
                  {user ? `Profile Settings` : `Sign In To Share`}
                </Text>
              </Pressable>
            </Link>
          )}
        </View>
      )}
      {!loading && !error && state.more && (
        <Pressable onPress={state.showMore} accessibilityRole={`button`} accessibilityLabel={`Show More Shared Domains`} {...elementProps(`public-discovery-action`, `more-${scope}`)} style={styles.action}>
          <ChevronDown {...elementProps(`public-discovery-more-icon`, scope)} size={15} color={palette.accent} />
          <Text {...elementProps(`public-discovery-more-label`, scope)} style={styles.actionLabel}>
            {`Show More · ${Math.min(12, state.total - state.visible.length)} Domain(s)`}
          </Text>
        </Pressable>
      )}
      {!!state.results.length && !loading && !error && (
        <Text {...elementProps(`public-discovery-window-note`, scope)} style={styles.caption}>
          {`Search and filters cover the portfolios currently loaded. Project stages are supplied by each member.`}
        </Text>
      )}
    </View>
  );
};

export default PublicPortfolioDiscovery;
