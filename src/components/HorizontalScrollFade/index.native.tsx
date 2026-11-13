import { styles } from './styles.native';
import type { ComponentType } from 'react';
import { View, ScrollView, type ScrollViewProps } from 'react-native';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import { useFilterScroller } from '../DomainDiscovery/useFilterScroller';

interface HorizontalScrollFadeProps extends ScrollViewProps {
  fadeColor: string;
  nativeID: string;
  scrollComponent?: ComponentType<ScrollViewProps>;
}

const HorizontalScrollFade = ({ fadeColor, nativeID, onLayout, onScroll, onContentSizeChange, scrollComponent: ScrollComponent = ScrollView, ...props }: HorizontalScrollFadeProps) => {
  const state = useFilterScroller();
  return (
    <View nativeID={`${nativeID}-frame`} style={styles.frame}>
      <ScrollComponent
        {...props}
        horizontal
        nativeID={nativeID}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onLayout={event => { state.onLayout(event); onLayout?.(event); }}
        onScroll={event => { state.onScroll(event); onScroll?.(event); }}
        onContentSizeChange={(width, height) => { state.onContentSizeChange(width); onContentSizeChange?.(width, height); }}
      />
      {([`left`, `right`] as const).map(side => {
        const isLeft = side === `left`;
        if (isLeft ? !state.showLeftFade : !state.showRightFade) return null;
        const fadeId = `${nativeID}-fade-${side}`;
        const gradientId = `${fadeId}-gradient`;
        return (
          <View
            key={side}
            nativeID={fadeId}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            style={[styles.fade, isLeft ? styles.left : styles.right]}
          >
            <Svg width={`100%`} height={`100%`} nativeID={`${fadeId}-svg`}>
              <Defs>
                <LinearGradient id={gradientId} x1={`0%`} x2={`100%`} y1={`0%`} y2={`0%`}>
                  <Stop offset={`0%`} stopColor={fadeColor} stopOpacity={isLeft ? 1 : 0} />
                  <Stop offset={`100%`} stopColor={fadeColor} stopOpacity={isLeft ? 0 : 1} />
                </LinearGradient>
              </Defs>
              <Rect width={`100%`} height={`100%`} fill={`url(#${gradientId})`} />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

export default HorizontalScrollFade;
