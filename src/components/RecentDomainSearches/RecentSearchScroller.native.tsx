import type { ReactNode } from 'react';
import type { createStyles } from './styles.native';
import { Platform, ScrollView, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import type { ThemePalette } from '../../shared/themeContext/theme';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import { useFilterScroller } from '../DomainDiscovery/useFilterScroller';

interface RecentSearchScrollerProps {
  height: number;
  suffix: string;
  inline: boolean;
  children: ReactNode;
  palette: ThemePalette;
  styles: ReturnType<typeof createStyles>;
}

const RecentSearchScroller = ({ height, styles, suffix, palette, children, inline }: RecentSearchScrollerProps) => {
  const state = useFilterScroller();
  const fadeColor = inline ? palette.paper : palette.canvas;
  const edges = [
    { side: `left`, visible: state.showLeftFade },
    { side: `right`, visible: state.showRightFade },
  ] as const;

  return (
    <View {...elementProps(`recent-domain-searches-scroll-frame`, suffix)} style={styles.scrollFrame}>
      <ScrollView
        horizontal
        bounces={false}
        onScroll={state.onScroll}
        scrollEventThrottle={16}
        onLayout={state.onLayout}
        contentContainerStyle={styles.inlineTrack}
        keyboardShouldPersistTaps={`handled`}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={state.onContentSizeChange}
        accessibilityLabel={`Recents`}
        style={[styles.inlineScroll, { height }]}
        {...elementProps(`recent-domain-searches-scroll`, suffix)}
        {...(Platform.OS === `web` ? { tabIndex: 0 as const } : {})}
      >
        {children}
      </ScrollView>
      {edges.filter(edge => edge.visible).map(({ side }) => {
        const fadeSuffix = `${suffix}-${side}`;
        const gradientId = `recent-domain-searches-fade-gradient-${fadeSuffix}`;
        return (
          <View
            key={side}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`recent-domain-searches-fade`, fadeSuffix)}
            style={[styles.fade, side === `left` ? styles.fadeLeft : styles.fadeRight, { pointerEvents: `none` }]}
          >
            <Svg width={`100%`} height={`100%`} {...elementProps(`recent-domain-searches-fade-svg`, fadeSuffix)}>
              <Defs {...elementProps(`recent-domain-searches-fade-defs`, fadeSuffix)}>
                <LinearGradient
                  x1={`0%`}
                  y1={`0%`}
                  y2={`0%`}
                  x2={`100%`}
                  id={gradientId}
                  {...elementProps(`recent-domain-searches-fade-gradient`, fadeSuffix)}
                >
                  <Stop
                    offset={`0%`}
                    stopColor={fadeColor}
                    stopOpacity={side === `left` ? 1 : 0}
                    {...elementProps(`recent-domain-searches-fade-start`, fadeSuffix)}
                  />
                  <Stop
                    offset={`100%`}
                    stopColor={fadeColor}
                    stopOpacity={side === `left` ? 0 : 1}
                    {...elementProps(`recent-domain-searches-fade-end`, fadeSuffix)}
                  />
                </LinearGradient>
              </Defs>
              <Rect
                width={`100%`}
                height={`100%`}
                fill={`url(#${gradientId})`}
                {...elementProps(`recent-domain-searches-fade-mask`, fadeSuffix)}
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

export default RecentSearchScroller;
