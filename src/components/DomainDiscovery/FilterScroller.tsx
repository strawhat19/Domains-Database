import type { ReactNode } from 'react';
import { useFilterScroller } from './useFilterScroller';
import { Platform, ScrollView, View } from 'react-native';
import { styles } from './FilterScroller.styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';

interface FilterScrollerProps {
  suffix: string;
  children: ReactNode;
}

const FilterScroller = ({ suffix, children }: FilterScrollerProps) => {
  const { palette } = useTheme();
  const state = useFilterScroller();
  const visibleEdges = [
    { side: `left`, visible: state.showLeftFade },
    { side: `right`, visible: state.showRightFade },
  ] as const;

  return (
    <View {...elementProps(`domain-discovery-filter-scroller`, suffix)} style={styles.outer}>
      <ScrollView
        horizontal
        bounces={false}
        onScroll={state.onScroll}
        style={styles.viewport}
        scrollEventThrottle={16}
        onLayout={state.onLayout}
        contentContainerStyle={styles.track}
        keyboardShouldPersistTaps={`handled`}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={state.onContentSizeChange}
        accessibilityLabel={`Domain Idea Status And TLD Filters`}
        {...elementProps(`domain-discovery-filter-viewport`, suffix)}
        {...(Platform.OS === `web` ? { tabIndex: 0 as const } : {})}
      >
        {children}
      </ScrollView>
      {visibleEdges.filter(edge => edge.visible).map(({ side }) => {
        const fadeSuffix = `${suffix}-${side}`;
        const gradientId = `domain-discovery-filter-fade-gradient-${fadeSuffix}`;
        return (
          <View
            key={side}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`domain-discovery-filter-fade`, fadeSuffix)}
            style={[styles.fade, side === `left` ? styles.fadeLeft : styles.fadeRight, { pointerEvents: `none` }]}
          >
            <Svg width={`100%`} height={`100%`} {...elementProps(`domain-discovery-filter-fade-svg`, fadeSuffix)}>
              <Defs {...elementProps(`domain-discovery-filter-fade-defs`, fadeSuffix)}>
                <LinearGradient
                  x1={`0%`}
                  y1={`0%`}
                  y2={`0%`}
                  x2={`100%`}
                  id={gradientId}
                  {...elementProps(`domain-discovery-filter-fade-gradient`, fadeSuffix)}
                >
                  <Stop
                    offset={`0%`}
                    stopColor={palette.canvas}
                    stopOpacity={side === `left` ? 1 : 0}
                    {...elementProps(`domain-discovery-filter-fade-start`, fadeSuffix)}
                  />
                  <Stop
                    offset={`100%`}
                    stopColor={palette.canvas}
                    stopOpacity={side === `left` ? 0 : 1}
                    {...elementProps(`domain-discovery-filter-fade-end`, fadeSuffix)}
                  />
                </LinearGradient>
              </Defs>
              <Rect
                width={`100%`}
                height={`100%`}
                fill={`url(#${gradientId})`}
                {...elementProps(`domain-discovery-filter-fade-mask`, fadeSuffix)}
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

export default FilterScroller;
