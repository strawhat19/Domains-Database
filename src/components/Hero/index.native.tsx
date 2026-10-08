import HeroCubes from '../HeroCubes';
import MagicTyping from '../MagicTyping';
import { useMemo, useState, useEffect, useContext } from 'react';
import { Layers3, Search, History } from 'lucide-react-native';
import Svg, { Defs, Rect, Stop, LinearGradient } from 'react-native-svg';
import { useHeroSearch } from './useHeroSearch';
import { useRecentsLayout } from '../RecentDomainSearches/useRecentsLayout';
import ResponsiveDomainHeading from '../ResponsiveDomainHeading';
import { createStyles } from './styles.native';
import { Text, View, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { useTheme } from '../../shared/themeContext/useTheme';
import { themePalettes } from '../../shared/themeContext/theme';

const Hero = () => {
  const search = useHeroSearch();
  const recents = useRecentsLayout();
  const { width } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const heroPalette = isDark ? themePalettes.dark : palette;
  const heroBackground = isDark ? palette.strong : palette.paper;
  const compact = width < 600;
  const accentSize = Math.min(52, Math.max(28, (width - 48) * .105));
  const [searchFocused, setSearchFocused] = useState(false);
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

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
        <HeroCubes />
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
            <Stop offset={`78%`} stopColor={heroBackground} stopOpacity={0} />
            <Stop offset={`88%`} stopColor={heroBackground} stopOpacity={.3} />
            <Stop offset={`96%`} stopColor={heroBackground} stopOpacity={.88} />
            <Stop offset={`100%`} stopColor={heroBackground} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width={`100%`} height={`100%`} fill={`url(#hero-native-content-fade)`} />
        <Rect
          width={`100%`}
          height={`100%`}
          {...elementProps(`hero-cube-edge-fade`)}
          fill={`url(#hero-native-cube-edge-fade)`}
        />
      </Svg>
      <Text {...elementProps(`hero-eyebrow`)} style={styles.eyebrow}>
        {`Domain Manager`}
      </Text>
      <Text
        {...elementProps(`hero-title`)}
        style={styles.title}
        accessibilityRole={`header`}
      >
        {`Your domains.`}
      </Text>
      <Text {...elementProps(`hero-title-accent`)} style={[styles.accent, compact && { fontSize: accentSize, lineHeight: accentSize * 1.08 }]}>
        {`Under control.`}
      </Text>
      <Text {...elementProps(`hero-description`)} style={styles.description}>
        {`Keep track of every name, registrar, and renewal. A domain portfolio you can actually keep up with.`}
      </Text>
      <View {...elementProps(`hero-domain-search`)} style={styles.search}>
        <ResponsiveDomainHeading
          style={styles.searchLabel}
          forceCompact={width < 600}
          id={`hero-domain-search-label`}
          shortText={`Find your domain`}
          fullText={`Find your next domain`}
        />
        <View {...elementProps(`hero-magic-typing-wrap`)} style={styles.magicTypingWrap}>
          <MagicTyping suffix={`hero`} paused={searchFocused || Boolean(search.query)} />
        </View>
        <View {...elementProps(`hero-domain-search-row`)} style={styles.searchRow}>
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
            style={styles.searchButton}
            accessibilityRole={`button`}
            {...elementProps(`hero-domain-search-submit`)}
            accessibilityLabel={`Search Domain Availability`}
          >
            <Search {...elementProps(`hero-domain-search-icon`)} size={15} color={heroPalette.accent} />
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
          <View {...elementProps(`hero-domain-recents-items`)} style={styles.recentsItems} accessibilityLiveRegion={`polite`}>
            {search.recentSearchesLoading ? (
              <Text {...elementProps(`hero-domain-recents-loading`)} style={styles.recentsMessage}>{`Loading…`}</Text>
            ) : search.recentSearches.length ? search.recentSearches.slice(0, 3).map((record, index) => (
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
