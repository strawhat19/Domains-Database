import { useMemo, useState } from 'react';
import CarouselRow from './CarouselRow';
import { createStyles } from './styles.native';
import HeaderCountBadge from '../HeaderCountBadge';
import FilterScroller from '../DomainDiscovery/FilterScroller';
import type { DomainDiscoveryCarouselProps } from './types';
import { useDiscoveryCarousel } from './useDiscoveryCarousel';
import { Globe2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { discoveryExtensions } from '../../shared/domainSearch/discovery';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { createStyles as createCardStyles } from '../DomainDiscovery/styles.native';

const tldFilters = [`all`, ...discoveryExtensions];

const DomainDiscoveryCarousel = ({ error, suffix, results, onSearch, tldFilter, tldResults, toggleTldFilter, loading = false, disabled = false, density = `compact` }: DomainDiscoveryCarouselProps) => {
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const [watchPromptOpen, setWatchPromptOpen] = useState(false);
  const buffering = loading && !results.length;
  const carouselDisabled = disabled || buffering || watchPromptOpen;
  const firstResults = results.filter((_, index) => index % 2 === 0);
  const secondResults = results.filter((_, index) => index % 2 === 1);
  const firstState = useDiscoveryCarousel(firstResults.length, carouselDisabled, density, 1);
  const secondState = useDiscoveryCarousel(secondResults.length, carouselDisabled, density, -1);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const cardStyles = useMemo(() => createCardStyles(palette), [palette]);
  const navigationDisabled = carouselDisabled || (!firstState.looping && !secondState.looping);
  const selectedTld = tldFilter === `all` ? `` : ` .${tldFilter}`;
  const rows = [
    { id: `first`, state: firstState, results: firstResults },
    { id: `second`, state: secondState, results: secondResults },
  ];
  const previous = () => { firstState.previous(); secondState.previous(); };
  const next = () => { firstState.next(); secondState.next(); };

  return (
    <View
      style={styles.section}
      {...elementProps(`domain-discovery-carousel`, suffix)}
    >
      <View {...elementProps(`domain-discovery-carousel-heading`, suffix)} style={styles.heading}>
        <View {...elementProps(`domain-discovery-carousel-title-group`, suffix)} style={styles.titleGroup}>
          <Globe2 {...elementProps(`domain-discovery-carousel-title-icon`, suffix)} size={14} color={palette.accent} />
          <Text {...elementProps(`domain-discovery-carousel-title`, suffix)} style={styles.title} accessibilityRole={`header`}>
            {`Trending Domains by Platform`}
          </Text>
          <Text {...elementProps(`domain-discovery-carousel-count`, suffix)} style={styles.count}>{`${results.length} domain(s)`}</Text>
        </View>
        <View {...elementProps(`domain-discovery-carousel-controls`, suffix)} style={styles.controls}>
          {([
            { id: `previous`, label: `Previous Domain Ideas`, Icon: ChevronLeft, action: previous },
            { id: `next`, label: `Next Domain Ideas`, Icon: ChevronRight, action: next },
          ] as const).map(({ id, label, Icon, action }) => (
            <Pressable
              key={id}
              onPress={action}
              disabled={navigationDisabled}
              accessibilityRole={`button`}
              accessibilityLabel={label}
              accessibilityState={{ disabled: navigationDisabled }}
              {...elementProps(`domain-discovery-carousel-control`, `${suffix}-${id}`)}
              style={({ pressed }) => [styles.control, (pressed || navigationDisabled) && styles.faded]}
            >
              <Icon {...elementProps(`domain-discovery-carousel-control-icon`, `${suffix}-${id}`)} size={15} color={palette.accent} />
            </Pressable>
          ))}
        </View>
      </View>
      <FilterScroller suffix={`${suffix}-tlds`}>
        <View {...elementProps(`domain-discovery-carousel-tld-filters`, suffix)} style={styles.filterGroup} accessibilityLabel={`Filter Domain Cards By TLD`}>
          {tldFilters.map(extension => {
            const selected = extension === tldFilter;
            const color = selected ? palette.accent : palette.muted;
            const label = extension === `all` ? `All Extensions` : `.${extension}`;
            const filterSuffix = `${suffix}-${extension}`;
            const count = extension === `all` ? tldResults.length : tldResults.filter(result => result.extension === extension).length;
            return (
              <Pressable
                key={extension}
                accessibilityRole={`button`}
                accessibilityState={{ selected }}
                onPress={() => toggleTldFilter(extension)}
                accessibilityLabel={`${selected && extension !== `all` ? `Clear` : `Show`} ${label}, ${count} Domain(s)`}
                {...elementProps(`domain-discovery-carousel-tld-filter`, filterSuffix)}
                style={({ pressed }) => [styles.filter, selected && styles.selectedFilter, pressed && styles.faded]}
              >
                <Globe2 {...elementProps(`domain-discovery-carousel-tld-filter-icon`, filterSuffix)} size={14} color={color} />
                <Text {...elementProps(`domain-discovery-carousel-tld-filter-label`, filterSuffix)} style={[styles.filterLabel, { color }]}>
                  {label}
                </Text>
                <HeaderCountBadge count={count} id={`domain-discovery-carousel-tld-count-${filterSuffix}`} />
              </Pressable>
            );
          })}
        </View>
      </FilterScroller>
      {loading && (
        <View {...elementProps(`domain-discovery-carousel-loading-row`, suffix)} style={cardStyles.progressRow}>
          <ActivityIndicator
            aria-hidden
            color={palette.accent}
            animating={!reducedMotion}
            hidesWhenStopped={false}
            size={Platform.OS === `ios` ? `small` : 12}
            {...elementProps(`domain-discovery-carousel-loading-spinner`, suffix)}
          />
          <Text {...elementProps(`domain-discovery-carousel-loading`, suffix)} style={styles.note} accessibilityLiveRegion={`polite`}>
            {`Checking registrar availability${selectedTld ? ` for${selectedTld} domains` : ``}…`}
          </Text>
        </View>
      )}
      <View {...elementProps(`domain-discovery-carousel-rows`, suffix)} style={styles.rows}>
        {rows.map(row => (buffering || !!row.results.length) && (
          <CarouselRow
            key={row.id}
            state={row.state}
            styles={styles}
            density={density}
            palette={palette}
            disabled={disabled}
            buffering={buffering}
            onSearch={onSearch}
            onWatchPromptChange={setWatchPromptOpen}
            results={row.results}
            cardStyles={cardStyles}
            suffix={`${suffix}-${row.id}`}
          />
        ))}
        {!loading && !results.length && !error && (
          <View {...elementProps(`domain-discovery-carousel-empty`, suffix)} style={styles.empty}>
            <Text {...elementProps(`domain-discovery-carousel-empty-text`, suffix)} style={styles.note} accessibilityLiveRegion={`polite`}>
              {`No${selectedTld} domains confirmed available for these filters.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export { discoveryCarouselSizing } from './sizing';
export type { DomainDiscoveryCarouselProps } from './types';
export default DomainDiscoveryCarousel;
