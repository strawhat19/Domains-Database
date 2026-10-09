import { Link } from 'expo-router';
import HeroCubes from '../HeroCubes';
import MagicTyping from '../MagicTyping';
import type { HeroProps } from './types';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { cubes, useStackPill } from '../../shared/config';
import { useTheme } from '../../shared/themeContext/useTheme';
import { themePalettes } from '../../shared/themeContext/theme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { useRef, useMemo, useState, useEffect, useContext } from 'react';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { useRecentsLayout } from '../RecentDomainSearches/useRecentsLayout';
import { Search, Layers3, History, TrendingUp, ArrowUpRight } from 'lucide-react-native';
import { Text, View, Easing, Animated, Pressable, TextInput, useWindowDimensions } from 'react-native';

const Hero = ({ search }: HeroProps) => {
  const recents = useRecentsLayout();
  const reducedMotion = useReducedMotion();
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const radarPhases = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const { width } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const heroPalette = isDark ? themePalettes.dark : palette;
  const heroBackground = isDark ? palette.strong : palette.paper;
  const trendingFill = heroPalette.accent;
  const trendingText = heroPalette.contrast;
  const domainsLabel = search.domainCount > 0 ? `${search.domainCount.toLocaleString()} Domains` : `Domains`;
  const trendingLabel = search.trendingCount > 0 ? `${search.trendingCount.toLocaleString()} Trending` : `Trending`;
  const compact = width < 600;
  const accentSize = Math.min(52, Math.max(28, (width - 48) * .105));
  const [searchFocused, setSearchFocused] = useState(false);
  const dataLoading = search.domainCountLoading || search.trendingCountLoading || search.recentSearchesLoading;
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);
  useEffect(() => {
    skeletonOpacity.setValue(1);
    if (reducedMotion || !dataLoading) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(skeletonOpacity, { toValue: .45, duration: 800, isInteraction: false, useNativeDriver: true }),
      Animated.timing(skeletonOpacity, { toValue: 1, duration: 800, isInteraction: false, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [dataLoading, reducedMotion, skeletonOpacity]);
  useEffect(() => {
    radarPhases.forEach(phase => phase.setValue(0));
    if (reducedMotion) return;

    const animations = radarPhases.map((phase, index) => Animated.sequence([
      Animated.delay(index * 1200),
      Animated.loop(Animated.timing(phase, {
        toValue: 1,
        duration: 2400,
        isInteraction: false,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      })),
    ]));
    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, [radarPhases, reducedMotion]);

  return (
    <View {...elementProps(`landing-hero`)} style={[styles.hero, compact && styles.compactHero]} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
      <View
        pointerEvents={`none`}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`hero-cube-art`)}
        style={[styles.cubeArt, compact && styles.compactCubeArt]}
      >
        <HeroCubes cubes={cubes} />
        <Svg
          width={`100%`}
          height={`100%`}
          pointerEvents={`none`}
          accessible={false}
          {...elementProps(`hero-cube-art-fade`)}
          style={styles.contentFade}
        >
          <Defs>
            <LinearGradient id={`hero-native-art-left-fade`} x1={`0`} y1={`0`} x2={`1`} y2={`0`}>
              <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={1} />
              <Stop offset={`10%`} stopColor={heroBackground} stopOpacity={.75} />
              <Stop offset={`22%`} stopColor={heroBackground} stopOpacity={.2} />
              <Stop offset={`32%`} stopColor={heroBackground} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={`hero-native-art-top-fade`} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
              <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={1} />
              <Stop offset={`8%`} stopColor={heroBackground} stopOpacity={.65} />
              <Stop offset={`16%`} stopColor={heroBackground} stopOpacity={.15} />
              <Stop offset={`24%`} stopColor={heroBackground} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={`100%`} height={`100%`} fill={`url(#hero-native-art-left-fade)`} />
          <Rect width={`100%`} height={`100%`} fill={`url(#hero-native-art-top-fade)`} />
        </Svg>
      </View>
      <Svg
        width={`100%`}
        height={`100%`}
        pointerEvents={`none`}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`hero-content-fade`)}
        style={styles.contentFade}
      >
        <Defs>
          <LinearGradient id={`hero-native-content-fade`} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
            <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={.99} />
            <Stop offset={`45%`} stopColor={heroBackground} stopOpacity={.96} />
            <Stop offset={`75%`} stopColor={heroBackground} stopOpacity={.78} />
            <Stop offset={`100%`} stopColor={heroBackground} stopOpacity={.12} />
          </LinearGradient>
          <LinearGradient id={`hero-native-cube-edge-fade`} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
            <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={0} />
            <Stop offset={`65%`} stopColor={heroBackground} stopOpacity={0} />
            <Stop offset={`80%`} stopColor={heroBackground} stopOpacity={.28} />
            <Stop offset={`92%`} stopColor={heroBackground} stopOpacity={.76} />
            <Stop offset={`100%`} stopColor={heroBackground} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id={`hero-native-cube-right-fade`} x1={`0`} y1={`0`} x2={`1`} y2={`0`}>
            <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={0} />
            <Stop offset={`76%`} stopColor={heroBackground} stopOpacity={0} />
            <Stop offset={`88%`} stopColor={heroBackground} stopOpacity={.3} />
            <Stop offset={`96%`} stopColor={heroBackground} stopOpacity={.85} />
            <Stop offset={`100%`} stopColor={heroBackground} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id={`hero-native-cube-top-fade`} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
            <Stop offset={`0%`} stopColor={heroBackground} stopOpacity={1} />
            <Stop offset={`4%`} stopColor={heroBackground} stopOpacity={.8} />
            <Stop offset={`12%`} stopColor={heroBackground} stopOpacity={.18} />
            <Stop offset={`20%`} stopColor={heroBackground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={`100%`} height={`100%`} fill={`url(#hero-native-content-fade)`} />
        <Rect
          width={`100%`}
          height={`100%`}
          {...elementProps(`hero-cube-edge-fade`)}
          fill={`url(#hero-native-cube-edge-fade)`}
        />
        <Rect
          width={`100%`}
          height={`100%`}
          {...elementProps(`hero-cube-right-fade`)}
          fill={`url(#hero-native-cube-right-fade)`}
        />
        <Rect
          width={`100%`}
          height={`100%`}
          {...elementProps(`hero-cube-top-fade`)}
          fill={`url(#hero-native-cube-top-fade)`}
        />
      </Svg>
      <View {...elementProps(`hero-eyebrow-row`)} style={styles.eyebrowRow}>
        <View {...elementProps(`hero-eyebrow-label`)} style={styles.eyebrowLabel}>
          <View
            accessible={false}
            pointerEvents={`none`}
            {...elementProps(`hero-eyebrow-marker`)}
            style={styles.eyebrowMarker}
          >
            {!reducedMotion && radarPhases.map((phase, index) => (
              <Animated.View
                key={index}
                accessible={false}
                {...elementProps(`hero-eyebrow-ring`, `${index}`)}
                style={[
                  styles.eyebrowRing,
                  {
                    opacity: phase.interpolate({ inputRange: [0, 1], outputRange: [.55, 0] }),
                    transform: [{ scale: phase.interpolate({ inputRange: [0, 1], outputRange: [1, 4] }) }],
                  },
                ]}
              />
            ))}
            <View {...elementProps(`hero-eyebrow-dot`)} accessible={false} style={styles.eyebrowDot} />
          </View>
          <Text {...elementProps(`hero-eyebrow`)} style={styles.eyebrow}>
            {`Your Next Idea`}
          </Text>
        </View>
        <Link asChild href={routes.domains.href}>
          <Pressable
            accessibilityRole={`link`}
            accessibilityState={{ busy: search.domainCountLoading }}
            accessibilityLabel={`Go To ${domainsLabel}`}
            {...elementProps(`hero-domains-link`)}
            style={({ pressed }) => [styles.domainsLink, useStackPill && styles.stackButton, pressed && styles.recentPressed]}
          >
            {useStackPill && (
              <StackPillShape
                sharp
                fill={heroPalette.accent}
                stroke={heroPalette.accent}
                id={`hero-domains-shape`}
              />
            )}
            {search.domainCountLoading && (
              <Animated.View
                accessible={false}
                {...elementProps(`hero-domains-count-skeleton`)}
                style={[styles.countSkeleton, { opacity: skeletonOpacity }]}
              />
            )}
            <Text {...elementProps(`hero-domains-text`)} style={styles.domainsLinkText}>
              {!search.domainCountLoading && search.domainCount > 0 && (
                <>
                  <Text {...elementProps(`hero-domains-count`)} style={styles.ctaCount}>
                    {search.domainCount.toLocaleString()}
                  </Text>
                  {` `}
                </>
              )}
              {`Domains`}
            </Text>
            <ArrowUpRight {...elementProps(`hero-domains-icon`)} size={12} color={heroPalette.contrast} style={styles.buttonContent} />
          </Pressable>
        </Link>
      </View>
      <Text
        {...elementProps(`hero-title`)}
        style={styles.title}
        accessibilityRole={`header`}
      >
        {`Planner & Manager`}
      </Text>
      <Text {...elementProps(`hero-title-accent`)} style={[styles.accent, compact && { fontSize: accentSize, lineHeight: accentSize * 1.08 }]}>
        {`Domains Database`}
      </Text>
      <Text {...elementProps(`hero-description`)} style={styles.description}>
        {`Keep track of every name, registrar, and renewal. A domain portfolio you can actually keep up with.`}
      </Text>
      <View {...elementProps(`hero-domain-search`)} style={styles.search}>
        <View {...elementProps(`hero-domain-search-trending-row`)} style={styles.trendingRow}>
          <View {...elementProps(`hero-magic-typing-wrap`)} style={styles.magicTypingWrap}>
            <MagicTyping
              label={`Get`}
              suffix={`hero`}
              paused={searchFocused || Boolean(search.query)}
            />
          </View>
          <Link asChild href={routes.search.href}>
            <Pressable
              accessibilityRole={`link`}
              accessibilityState={{ busy: search.trendingCountLoading }}
              accessibilityLabel={`Explore ${trendingLabel} Domains`}
              {...elementProps(`hero-trending-link`)}
              style={({ pressed }) => [styles.domainsLink, styles.trendingLink, useStackPill && styles.stackButton, pressed && styles.recentPressed]}
            >
              {useStackPill && (
                <StackPillShape
                  sharp
                  fill={trendingFill}
                  stroke={trendingFill}
                  id={`hero-trending-shape`}
                />
              )}
              {search.trendingCountLoading && (
                <Animated.View
                  accessible={false}
                  {...elementProps(`hero-trending-count-skeleton`)}
                  style={[styles.countSkeleton, { opacity: skeletonOpacity }]}
                />
              )}
              <Text {...elementProps(`hero-trending-text`)} style={[styles.domainsLinkText, styles.trendingLinkText]}>
                {!search.trendingCountLoading && search.trendingCount > 0 && (
                  <>
                    <Text {...elementProps(`hero-trending-count`)} style={styles.ctaCount}>
                      {search.trendingCount.toLocaleString()}
                    </Text>
                    {` `}
                  </>
                )}
                {`Trending`}
              </Text>
              <TrendingUp {...elementProps(`hero-trending-icon`)} size={12} color={trendingText} style={styles.buttonContent} />
            </Pressable>
          </Link>
        </View>
        <View {...elementProps(`hero-domain-search-row`)} style={[styles.searchRow, useStackPill && styles.stackButton]}>
          {useStackPill && (
            <StackPillShape
              fill={`${heroBackground}e6`}
              stroke={`${heroPalette.accent}66`}
              id={`hero-domain-search-wrapper-shape`}
            />
          )}
          <TextInput
            autoCorrect={false}
            value={search.query}
            keyboardType={`url`}
            returnKeyType={`search`}
            autoCapitalize={`none`}
            style={styles.searchInput}
            onChangeText={search.setQuery}
            onSubmitEditing={search.submit}
            onBlur={() => setSearchFocused(false)}
            onFocus={() => setSearchFocused(true)}
            placeholder={`your-next-domain.com`}
            placeholderTextColor={heroPalette.placeholder}
            {...elementProps(`hero-domain-search-input`)}
            accessibilityLabel={`Search For A Domain`}
          />
          <Pressable
            onPress={search.submit}
            style={[styles.searchButton, useStackPill && styles.stackButton]}
            accessibilityRole={`button`}
            {...elementProps(`hero-domain-search-submit`)}
            accessibilityLabel={`Search Domain Availability`}
          >
            {useStackPill && (
              <StackPillShape
                stroke={heroPalette.accent}
                id={`hero-domain-search-submit-shape`}
              />
            )}
            <Search {...elementProps(`hero-domain-search-icon`)} size={15} color={heroPalette.accent} style={styles.buttonContent} />
            <Text {...elementProps(`hero-domain-search-text`)} style={styles.searchButtonText}>{`Search`}</Text>
          </Pressable>
        </View>
        <View
          style={styles.recents}
          onLayout={recents.onLayout}
          {...elementProps(`hero-domain-recents`)}
        >
          <View accessible accessibilityLabel={`Recents`} {...elementProps(`hero-domain-recents-heading`)} style={styles.recentsHeading}>
            <History {...elementProps(`hero-domain-recents-icon`)} size={12} color={heroPalette.muted} />
            {!recents.iconOnly && <Text {...elementProps(`hero-domain-recents-label`)} style={styles.recentsLabel}>{`Recents`}</Text>}
          </View>
          <View
            style={styles.recentsItems}
            accessibilityLiveRegion={`polite`}
            {...elementProps(`hero-domain-recents-items`)}
            accessible={search.recentSearchesLoading}
            accessibilityState={{ busy: search.recentSearchesLoading }}
            accessibilityLabel={search.recentSearchesLoading ? `Loading Recent Domain Searches` : undefined}
          >
            {search.recentSearchesLoading ? [78, 96, 68].map((width, index) => (
              <Animated.View
                key={index}
                accessible={false}
                {...elementProps(`hero-domain-recent-skeleton`, `${index}`)}
                style={[styles.recentSkeleton, { width, opacity: skeletonOpacity }]}
              />
            )) : search.recentSearches.length ? search.recentSearches.slice(0, 3).map((record, index) => (
              <Pressable
                key={record.query}
                accessibilityRole={`button`}
                onPress={() => search.searchDomain(record.query)}
                {...elementProps(`hero-domain-recent`, `${index}`)}
                accessibilityLabel={`Search ${record.query} Again`}
                style={({ pressed }) => [styles.recent, pressed && styles.recentPressed]}
              >
                <Search {...elementProps(`hero-domain-recent-icon`, `${index}`)} size={10} color={heroPalette.muted} />
                <Text {...elementProps(`hero-domain-recent-query`, `${index}`)} style={styles.recentQuery} numberOfLines={1}>
                  {record.query}
                </Text>
              </Pressable>
            )) : (
              <Text {...elementProps(`hero-domain-recents-empty`)} style={styles.recentsMessage}>
                {search.recentSearchesError ? `Recents unavailable` : `Your searches appear here`}
              </Text>
            )}
          </View>
        </View>
        {!!search.recentSearchesError && (
          <Text {...elementProps(`hero-domain-recents-error`)} style={styles.recentsError} accessibilityLiveRegion={`polite`}>
            {search.recentSearchesError}
          </Text>
        )}
      </View>
      <View {...elementProps(`hero-promise`)} style={styles.promise}>
        <Layers3 {...elementProps(`hero-promise-icon`)} size={14} color={heroPalette.accent} />
        <Text {...elementProps(`hero-promise-text`)} style={styles.promiseText}>
          {`Names. Renewals. Registrars.`}
        </Text>
      </View>
    </View>
  );
};

export default Hero;
