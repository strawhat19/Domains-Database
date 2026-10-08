import { useMemo } from 'react';
import DomainSiteIcon from '../DomainSiteIcon';
import StackPillShape from '../StackPillShape';
import { useMarquee } from './useMarquee.native';
import { createStyles } from './styles.native';
import { Globe2, Info, Sparkles } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useStackPill } from '../../shared/config';
import { useDomainMarquee } from './useDomainMarquee';
import type { DomainMarqueeItem } from './useDomainMarquee';
import { useTheme } from '../../shared/themeContext/useTheme';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

const MarqueeTrack = ({ items, scope }: { items: DomainMarqueeItem[]; scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const {
    copies,
    scroll,
    onScroll,
    measureContent,
    openItem,
    onTouchMove,
    measureCycle,
    onTouchStart,
    measureViewport,
    pauseInteraction,
    releaseInteraction,
    onScrollBeginDrag,
  } = useMarquee(JSON.stringify(items.map(item => [item.id, item.label])));

  return (
    <ScrollView
      horizontal
      ref={scroll}
      bounces={false}
      onScroll={onScroll}
      style={styles.viewport}
      scrollEventThrottle={16}
      onTouchMove={onTouchMove}
      onTouchStart={onTouchStart}
      onLayout={measureViewport}
      onTouchEnd={releaseInteraction}
      onTouchCancel={releaseInteraction}
      onScrollBeginDrag={onScrollBeginDrag}
      contentContainerStyle={styles.track}
      showsHorizontalScrollIndicator={false}
      onScrollEndDrag={releaseInteraction}
      onMomentumScrollBegin={pauseInteraction}
      onMomentumScrollEnd={releaseInteraction}
      onContentSizeChange={measureContent}
      {...elementProps(`native-domain-marquee-viewport`, scope)}
    >
      {copies.map(copyIndex => (
        <View
          key={copyIndex}
          style={styles.cycle}
          accessibilityElementsHidden={copyIndex !== 1}
          onLayout={copyIndex === 0 ? measureCycle : undefined}
          importantForAccessibility={copyIndex === 1 ? `auto` : `no-hide-descendants`}
          {...elementProps(`native-domain-marquee-cycle`, `${scope}-${copyIndex}`)}
        >
          {items.map((item, index) => {
            const teal = index % 2 === 0;
            const color = teal ? palette.accent : palette.ink;
            const Icon = { Globe2, Info, Sparkles }[item.icon];
            const suffix = `${scope}-${copyIndex}-${item.id}`;
            return (
              <Pressable
                key={item.id}
                hitSlop={4}
                onPress={() => openItem(item)}
                accessibilityRole={`link`}
                accessibilityLabel={item.label}
                accessibilityHint={item.external ? `Opens in browser` : `Opens notification details`}
                {...elementProps(`native-domain-marquee-pill`, suffix)}
                style={({ pressed }) => [styles.pill, teal ? styles.tealPill : styles.navyPill, useStackPill && styles.stackPill, pressed && styles.pressed]}
              >
                {useStackPill && (
                  <StackPillShape
                    stroke={palette.line}
                    fill={teal ? palette.subtle : palette.input}
                    id={`native-domain-marquee-pill-shape-${suffix}`}
                  />
                )}
                {item.domain ? (
                  <DomainSiteIcon
                    compact
                    size={14}
                    fallback={`link`}
                    domain={item.domain}
                    iconUrl={item.iconUrl}
                    id={`native-domain-marquee-pill-icon-${suffix}`}
                  />
                ) : (
                  <Icon
                    size={14}
                    color={color}
                    {...elementProps(`native-domain-marquee-pill-icon`, suffix)}
                  />
                )}
                <Text
                  numberOfLines={1}
                  style={[styles.label, { color }]}
                  {...elementProps(`native-domain-marquee-pill-label`, suffix)}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

const DomainMarquee = ({ scope = `header`, translucent = false }: { scope?: string; translucent?: boolean }) => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { items, loading, showDomains } = useDomainMarquee();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const fadeWidth = Math.max(32, Math.min(72, width * .06));

  return (
    <View
      style={[styles.bar, { width }, translucent && { backgroundColor: `transparent` }]}
      {...elementProps(`native-domain-marquee`, scope)}
      accessibilityLabel={showDomains ? `Your domains` : `Notifications`}
    >
      {loading ? (
        <View
          style={styles.loading}
          accessibilityElementsHidden
          importantForAccessibility={`no-hide-descendants`}
          {...elementProps(`native-domain-marquee-loading`, scope)}
        >
          {[0, 1, 2, 3, 4, 5].map(index => (
            <View
              key={index}
              style={[styles.skeleton, { width: index % 2 ? 160 : 110 }, useStackPill && styles.stackSkeleton]}
              {...elementProps(`native-domain-marquee-skeleton`, `${scope}-${index}`)}
            >
              {useStackPill && <StackPillShape stroke={palette.skeleton} fill={palette.skeleton} id={`native-domain-marquee-skeleton-shape-${scope}-${index}`} />}
            </View>
          ))}
        </View>
      ) : items.length > 0 && (
        <MarqueeTrack
          scope={scope}
          items={items}
          key={showDomains ? `domains` : `notifications`}
        />
      )}
      {([`left`, `right`] as const).map(side => {
        const suffix = `${scope}-${side}`;
        const gradientId = `native-domain-marquee-fade-gradient-${suffix}`;
        return (
          <View
            key={side}
            accessibilityElementsHidden
            importantForAccessibility={`no-hide-descendants`}
            {...elementProps(`native-domain-marquee-fade`, suffix)}
            style={[styles.fade, side === `left` ? styles.fadeLeft : styles.fadeRight, { width: fadeWidth, pointerEvents: `none` }]}
          >
            <Svg
              width={`100%`}
              height={`100%`}
              {...elementProps(`native-domain-marquee-fade-svg`, suffix)}
            >
              <Defs {...elementProps(`native-domain-marquee-fade-defs`, suffix)}>
                <LinearGradient
                  x1={`0%`}
                  y1={`0%`}
                  x2={`100%`}
                  y2={`0%`}
                  id={gradientId}
                  {...elementProps(`native-domain-marquee-fade-gradient`, suffix)}
                >
                  <Stop
                    offset={`0%`}
                    stopColor={palette.paper}
                    stopOpacity={side === `left` ? 1 : 0}
                    {...elementProps(`native-domain-marquee-fade-start`, suffix)}
                  />
                  <Stop
                    offset={`100%`}
                    stopColor={palette.paper}
                    stopOpacity={side === `left` ? 0 : 1}
                    {...elementProps(`native-domain-marquee-fade-end`, suffix)}
                  />
                </LinearGradient>
              </Defs>
              <Rect
                width={`100%`}
                height={`100%`}
                fill={`url(#${gradientId})`}
                {...elementProps(`native-domain-marquee-fade-mask`, suffix)}
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
};

export default DomainMarquee;
