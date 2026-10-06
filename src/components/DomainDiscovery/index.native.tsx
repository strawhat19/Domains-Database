import { useMemo } from 'react';
import FilterScroller from './FilterScroller';
import DiscoveryCard from './DiscoveryCard';
import { discoveryIcons } from './presentation';
import { Globe2, Compass, RotateCw } from 'lucide-react-native';
import { createStyles } from './styles.native';
import type { DomainDiscoveryProps } from './types';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { discoveryStatuses, discoveryExtensions, type DomainDiscoveryFilter } from '../../shared/domainSearch/discovery';

const filters: { id: DomainDiscoveryFilter; label: string; description: string }[] = [
  { id: `all`, label: `All`, description: `All available domain ideas` },
  ...discoveryStatuses,
];

const tldFilters = [`all`, ...discoveryExtensions];

const DomainDiscovery = ({ state, shelf, suffix, onSearch, sidebar = false, disabled = false }: DomainDiscoveryProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const activeFilter = filters.find(value => value.id === state.filter);
  const filteredResults = sidebar ? state.statusResults : state.filteredResults;
  const tldResults = sidebar || state.tldFilter === `all` ? state.results : state.results.filter(result => result.extension === state.tldFilter);
  const loading = state.loading || state.accessLoading;
  const placeholderCount = sidebar ? shelf.placeholderCount : loading && !state.results.length ? 3 : 0;
  const checkedAt = state.checkedAt ? new Date(state.checkedAt).toLocaleTimeString(`en-US`, { hour: `numeric`, minute: `2-digit` }) : ``;

  const cardList = (
    <>
      {!shelf.buffering && filteredResults.map(result => (
        <DiscoveryCard
          key={result.domain}
          styles={styles}
          result={result}
          sidebar={sidebar}
          palette={palette}
          onSearch={onSearch}
          disabled={disabled}
          density={shelf.density}
          fillShelf={sidebar && !shelf.overflow}
          suffix={`${suffix}-${result.domain}`}
        />
      ))}
      {Array.from({ length: placeholderCount }, (_, index) => (
        <View
          key={index}
          accessibilityElementsHidden
          importantForAccessibility={`no-hide-descendants`}
          {...elementProps(`domain-discovery-skeleton`, `${suffix}-${index}`)}
          style={[styles.card, sidebar && styles.sidebarCard, shelf.density === `compact` && styles.compactCard, shelf.density === `pill` && styles.pillCard, sidebar && !shelf.overflow && styles.filledSidebarCard]}
        >
          {shelf.density === `pill` ? (
            <>
              <View {...elementProps(`domain-discovery-skeleton-name`, `${suffix}-${index}`)} style={[styles.skeleton, styles.pillSkeletonName]} />
              <View {...elementProps(`domain-discovery-skeleton-status`, `${suffix}-${index}`)} style={[styles.skeleton, styles.pillSkeletonStatus]} />
              <View {...elementProps(`domain-discovery-skeleton-price`, `${suffix}-${index}`)} style={[styles.skeleton, styles.pillSkeletonPrice]} />
            </>
          ) : (
            <>
              <View {...elementProps(`domain-discovery-skeleton-name`, `${suffix}-${index}`)} style={[styles.skeleton, styles.skeletonName]} />
              <View {...elementProps(`domain-discovery-skeleton-status`, `${suffix}-${index}`)} style={[styles.skeleton, styles.skeletonStatus]} />
              <View {...elementProps(`domain-discovery-skeleton-price`, `${suffix}-${index}`)} style={[styles.skeleton, styles.skeletonPrice]} />
            </>
          )}
        </View>
      ))}
    </>
  );

  return (
    <View {...elementProps(`domain-discovery`, suffix)} style={[styles.section, sidebar && styles.sidebarSection, sidebar && { height: shelf.panelHeight }]}>
      <View {...elementProps(`domain-discovery-title-row`, suffix)} style={styles.heading}>
        <View {...elementProps(`domain-discovery-title-group`, suffix)} style={styles.titleGroup}>
          <Compass
            size={16}
            color={palette.accent}
            {...elementProps(`domain-discovery-title-icon`, suffix)}
            {...(Platform.OS === `web` ? { 'aria-hidden': true } : { accessible: false })}
          />
          <Text {...elementProps(`domain-discovery-title`, suffix)} style={styles.headingTitle} accessibilityRole={`header`}>
            {`Explore Domains`}
          </Text>
        </View>
        <View {...elementProps(`domain-discovery-heading-tools`, suffix)} style={styles.headingTools}>
          <Text {...elementProps(`domain-discovery-count`, suffix)} style={styles.count} accessibilityLiveRegion={`polite`}>
            {`${filteredResults.length} of ${state.results.length} domain(s)`}
          </Text>
          {state.eligible && (
            <Pressable
              onPress={state.refresh}
              disabled={loading || disabled}
              accessibilityRole={`button`}
              accessibilityLabel={`Refresh All Available Domain Ideas`}
              accessibilityState={{ disabled: loading || disabled }}
              {...elementProps(`domain-discovery-refresh`, suffix)}
              style={({ pressed }) => [styles.refresh, (pressed || loading || disabled) && styles.faded]}
            >
              <RotateCw {...elementProps(`domain-discovery-refresh-icon`, suffix)} size={13} color={palette.muted} />
            </Pressable>
          )}
        </View>
      </View>
      <FilterScroller suffix={suffix}>
        <View {...elementProps(`domain-discovery-filters`, suffix)} style={styles.filterGroup} accessibilityLabel={`Filter Domain Ideas By Status`}>
          {filters.map(value => {
            const selected = value.id === state.filter;
            const color = selected ? palette.accent : palette.muted;
            const Icon = discoveryIcons[value.id];
            const filterSuffix = `${suffix}-${value.id}`;
            const status = value.id;
            const count = status === `all` ? tldResults.length
              : tldResults.filter(result => result.statuses.includes(status)).length;
            return (
              <Pressable
                key={value.id}
                accessibilityRole={`button`}
                accessibilityState={{ selected }}
                accessibilityHint={value.description}
                onPress={() => state.setFilter(value.id)}
                {...elementProps(`domain-discovery-filter`, filterSuffix)}
                accessibilityLabel={`Show ${value.label}, ${count} Domain(s)`}
                style={({ pressed }) => [styles.category, selected && styles.selectedCategory, pressed && styles.faded]}
              >
                <Icon {...elementProps(`domain-discovery-filter-icon`, filterSuffix)} size={14} color={color} />
                <Text {...elementProps(`domain-discovery-filter-label`, filterSuffix)} style={[styles.categoryLabel, { color }]}>
                  {`${value.label} ${count}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!sidebar && <View {...elementProps(`domain-discovery-filter-divider`, suffix)} style={styles.filterDivider} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} />}
        {!sidebar && <View {...elementProps(`domain-discovery-tld-filters`, suffix)} style={styles.filterGroup} accessibilityLabel={`Filter Domain Ideas By TLD`}>
          {tldFilters.map(extension => {
            const selected = extension === state.tldFilter;
            const color = selected ? palette.accent : palette.muted;
            const label = extension === `all` ? `All TLDs` : `.${extension}`;
            const tldSuffix = `${suffix}-${extension}`;
            const count = extension === `all` ? state.statusResults.length
              : state.statusResults.filter(result => result.extension === extension).length;
            return (
              <Pressable
                key={extension}
                accessibilityRole={`button`}
                accessibilityState={{ selected }}
                onPress={() => state.setTldFilter(extension)}
                {...elementProps(`domain-discovery-tld-filter`, tldSuffix)}
                accessibilityLabel={`Show ${label}, ${count} Domain(s)`}
                style={({ pressed }) => [styles.category, selected && styles.selectedCategory, pressed && styles.faded]}
              >
                <Globe2 {...elementProps(`domain-discovery-tld-filter-icon`, tldSuffix)} size={14} color={color} />
                <Text {...elementProps(`domain-discovery-tld-filter-label`, tldSuffix)} style={[styles.categoryLabel, { color }]}>
                  {`${label} ${count}`}
                </Text>
              </Pressable>
            );
          })}
        </View>}
      </FilterScroller>
      <Text {...elementProps(`domain-discovery-description`, suffix)} style={styles.description}>
        {`Curated ideas · ${activeFilter?.description ?? ``}${sidebar || state.tldFilter === `all` ? `` : ` · .${state.tldFilter}`}`}
      </Text>
      {sidebar ? (
        <ScrollView
          style={styles.shelf}
          onLayout={shelf.onLayout}
          scrollEnabled={shelf.overflow}
          keyboardShouldPersistTaps={`handled`}
          showsVerticalScrollIndicator={shelf.overflow}
          {...elementProps(`domain-discovery-shelf`, suffix)}
          accessibilityLabel={`Explore Domains`}
          contentContainerStyle={[styles.shelfTrack, shelf.density === `pill` && styles.pillTrack]}
        >
          <View {...elementProps(`domain-discovery-grid`, suffix)} style={[styles.sidebarGrid, !shelf.overflow && styles.filledShelfGrid, { gap: shelf.gap }]} accessibilityLiveRegion={`polite`}>
            {cardList}
          </View>
        </ScrollView>
      ) : (
        <View {...elementProps(`domain-discovery-grid`, suffix)} style={styles.grid} accessibilityLiveRegion={`polite`}>
          {cardList}
        </View>
      )}
      {loading && (
        <Text {...elementProps(`domain-discovery-progress`, suffix)} style={styles.detail} accessibilityLiveRegion={`polite`}>
          {state.accessLoading ? `Loading domain ideas…` : `Checking registrar availability…`}
        </Text>
      )}
      {!loading && !state.eligible && (
        <Text {...elementProps(`domain-discovery-access-copy`, suffix)} style={styles.detail}>
          {`Connect a registrar to see available domain ideas.`}
        </Text>
      )}
      {!loading && state.eligible && !filteredResults.length && !state.error && (
        <Text {...elementProps(`domain-discovery-empty`, suffix)} style={styles.detail}>
          {disabled ? `Domain ideas will resume after your search.` : state.results.length
            ? sidebar ? `No cards match this status. Select All to see every available idea.` : `No cards match these filters. Select All and All TLDs to see every available idea.`
            : `No available ideas confirmed. Refresh to check again.`}
        </Text>
      )}
      {!!state.error && (
        <Text {...elementProps(`domain-discovery-error`, suffix)} style={styles.error} accessibilityLiveRegion={`polite`}>
          {state.error}
        </Text>
      )}
      {!!state.results.length && (
        <Text {...elementProps(`domain-discovery-price-note`, suffix)} style={styles.detail}>
          {`Checked ${checkedAt} · Availability and registration prices can change`}
        </Text>
      )}
    </View>
  );
};

export default DomainDiscovery;
