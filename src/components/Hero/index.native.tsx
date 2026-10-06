import MagicTyping from '../MagicTyping';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import { useMemo, useState, useEffect, useContext } from 'react';
import { Layers3, Search, History } from 'lucide-react-native';
import { useHeroSearch } from './useHeroSearch';
import { useRecentsLayout } from '../RecentDomainSearches/useRecentsLayout';
import ResponsiveDomainHeading from '../ResponsiveDomainHeading';
import { createStyles } from './styles.native';
import { Text, View, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { useTheme } from '../../shared/themeContext/useTheme';

const Hero = () => {
  const search = useHeroSearch();
  const recents = useRecentsLayout();
  const { width } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <View {...elementProps(`landing-hero`)} style={styles.hero} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
      <DiscoveryBackdrop suffix={`hero`} variant={`landing`} />
      <Text {...elementProps(`hero-eyebrow`)} style={styles.eyebrow}>
        {`PERSONAL DOMAIN REGISTRY`}
      </Text>
      <Text
        {...elementProps(`hero-title`)}
        style={styles.title}
        accessibilityRole={`header`}
      >
        {`Your domains.`}
      </Text>
      <Text {...elementProps(`hero-title-accent`)} style={styles.accent}>
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
        <MagicTyping suffix={`hero`} paused={searchFocused || Boolean(search.query)} />
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
            placeholderTextColor={palette.muted}
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
            <Search {...elementProps(`hero-domain-search-icon`)} size={15} color={palette.contrast} />
            <Text {...elementProps(`hero-domain-search-text`)} style={styles.searchButtonText}>{`Search`}</Text>
          </Pressable>
        </View>
        <View
          style={styles.recents}
          onLayout={recents.onLayout}
          {...elementProps(`hero-domain-recents`)}
        >
          <View accessible accessibilityLabel={`Recents`} {...elementProps(`hero-domain-recents-heading`)} style={styles.recentsHeading}>
            <History {...elementProps(`hero-domain-recents-icon`)} size={12} color={palette.muted} />
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
                <Search {...elementProps(`hero-domain-recent-icon`, `${index}`)} size={10} color={palette.muted} />
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
        <Layers3 {...elementProps(`hero-promise-icon`)} size={14} color={palette.accent} />
        <Text {...elementProps(`hero-promise-text`)} style={styles.promiseText}>
          {`Names. Renewals. Registrars.`}
        </Text>
      </View>
    </View>
  );
};

export default Hero;
