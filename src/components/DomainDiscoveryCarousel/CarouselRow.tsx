import { Platform, ScrollView, View } from 'react-native';
import type { createStyles } from './styles.native';
import type { useDiscoveryCarousel } from './useDiscoveryCarousel';
import DiscoveryCard from '../DomainDiscovery/DiscoveryCard';
import { elementProps } from '../../shared/elementProps';
import type { ThemePalette } from '../../shared/themeContext/theme';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import type { DiscoveryCardDensity } from '../DomainDiscovery/useDiscoveryShelf';
import type { DomainDiscoveryResult } from '../../shared/domainSearch/discovery';
import type { createStyles as createCardStyles } from '../DomainDiscovery/styles.native';

interface CarouselRowProps {
  suffix: string;
  disabled: boolean;
  buffering: boolean;
  palette: ThemePalette;
  density: DiscoveryCardDensity;
  results: DomainDiscoveryResult[];
  onSearch: (domain: string) => void;
  onWatchPromptChange: (open: boolean) => void;
  styles: ReturnType<typeof createStyles>;
  state: ReturnType<typeof useDiscoveryCarousel>;
  cardStyles: ReturnType<typeof createCardStyles>;
}

const CarouselRow = ({ state, styles, suffix, results, palette, density, disabled, onSearch, buffering, cardStyles, onWatchPromptChange }: CarouselRowProps) => {
  if (!buffering && !results.length) return null;

  return (
    <View
      style={styles.frame}
      onBlur={state.focusOut}
      onFocus={state.focusIn}
      {...elementProps(`domain-discovery-carousel-frame`, suffix)}
      {...(Platform.OS === `web` ? { onMouseEnter: state.hoverIn, onMouseLeave: state.hoverOut } : {})}
    >
      <ScrollView
        horizontal
        ref={state.scroll}
        bounces={false}
        onScroll={state.onScroll}
        onLayout={state.onLayout}
        scrollEnabled={!buffering}
        scrollEventThrottle={16}
        onTouchEnd={state.touchEnd}
        onTouchStart={state.touchStart}
        onTouchCancel={state.touchEnd}
        contentContainerStyle={styles.track}
        keyboardShouldPersistTaps={`handled`}
        onScrollBeginDrag={state.pauseDrag}
        onScrollEndDrag={state.releaseDrag}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollBegin={state.pauseDrag}
        onMomentumScrollEnd={state.releaseDrag}
        onContentSizeChange={state.onContentSizeChange}
        style={[styles.viewport, { height: state.height }]}
        accessibilityLabel={`Available Domain Cards By TLD, ${suffix}`}
        {...elementProps(`domain-discovery-carousel-viewport`, suffix)}
        {...(Platform.OS === `web` ? { tabIndex: 0 as const } : {})}
      >
        {buffering ? (
          <View
            style={styles.cycle}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`domain-discovery-carousel-skeleton-track`, suffix)}
          >
            {[0, 1, 2].map(index => (
              <View
                key={index}
                style={[styles.item, { width: state.cardWidth }]}
                {...elementProps(`domain-discovery-carousel-skeleton-item`, `${suffix}-${index}`)}
              >
                <View
                  {...elementProps(`domain-discovery-carousel-skeleton`, `${suffix}-${index}`)}
                  style={[cardStyles.card, cardStyles.sidebarCard, density === `compact` && cardStyles.compactCard, density === `pill` && cardStyles.pillCard]}
                >
                  <View
                    {...elementProps(`domain-discovery-carousel-skeleton-name`, `${suffix}-${index}`)}
                    style={[cardStyles.skeleton, cardStyles.skeletonName, density === `pill` && cardStyles.pillSkeletonName]}
                  />
                  {density !== `pill` && (
                    <View
                      {...elementProps(`domain-discovery-carousel-skeleton-status`, `${suffix}-${index}`)}
                      style={[cardStyles.skeleton, cardStyles.skeletonStatus]}
                    />
                  )}
                  <View
                    {...elementProps(`domain-discovery-carousel-skeleton-price`, `${suffix}-${index}`)}
                    style={[cardStyles.skeleton, cardStyles.skeletonPrice, density === `pill` && cardStyles.pillSkeletonPrice]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : state.copies.map(copy => {
          const clone = copy !== state.primaryCopy;
          return (
            <View
              key={copy}
              style={styles.cycle}
              aria-hidden={clone}
              accessibilityElementsHidden={clone}
              importantForAccessibility={clone ? `no-hide-descendants` : `auto`}
              {...elementProps(`domain-discovery-carousel-cycle`, `${suffix}-${copy}`)}
            >
              {results.map(result => (
                <View
                  key={result.domain}
                  style={[styles.item, { width: state.cardWidth }]}
                  {...elementProps(`domain-discovery-carousel-item`, `${suffix}-${copy}-${result.domain}`)}
                >
                  <DiscoveryCard
                    sidebar
                    result={result}
                    styles={cardStyles}
                    density={density}
                    palette={palette}
                    onSearch={onSearch}
                    onWatchPromptChange={onWatchPromptChange}
                    disabled={disabled}
                    hiddenFromAccessibility={clone}
                    suffix={`${suffix}-carousel-${copy}-${result.domain}`}
                  />
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
      {!buffering && state.looping && ([`left`, `right`] as const).map(side => {
        const fadeSuffix = `${suffix}-${side}`;
        const gradientId = `domain-discovery-carousel-fade-gradient-${fadeSuffix}`;
        return (
          <View
            key={side}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`domain-discovery-carousel-fade`, fadeSuffix)}
            style={[styles.fade, side === `left` ? styles.fadeLeft : styles.fadeRight, { pointerEvents: `none` }]}
          >
            <Svg width={`100%`} height={`100%`} {...elementProps(`domain-discovery-carousel-fade-svg`, fadeSuffix)}>
              <Defs {...elementProps(`domain-discovery-carousel-fade-defs`, fadeSuffix)}>
                <LinearGradient
                  x1={`0%`}
                  y1={`0%`}
                  y2={`0%`}
                  x2={`100%`}
                  id={gradientId}
                  {...elementProps(`domain-discovery-carousel-fade-gradient`, fadeSuffix)}
                >
                  <Stop
                    offset={`0%`}
                    stopColor={palette.canvas}
                    stopOpacity={side === `left` ? 1 : 0}
                    {...elementProps(`domain-discovery-carousel-fade-start`, fadeSuffix)}
                  />
                  <Stop
                    offset={`100%`}
                    stopColor={palette.canvas}
                    stopOpacity={side === `left` ? 0 : 1}
                    {...elementProps(`domain-discovery-carousel-fade-end`, fadeSuffix)}
                  />
                </LinearGradient>
              </Defs>
              <Rect
                width={`100%`}
                height={`100%`}
                fill={`url(#${gradientId})`}
                {...elementProps(`domain-discovery-carousel-fade-mask`, fadeSuffix)}
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

export default CarouselRow;
