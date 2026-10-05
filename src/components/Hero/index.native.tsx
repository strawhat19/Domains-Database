import { useMemo, useEffect, useContext } from 'react';
import { Layers3, Search } from 'lucide-react-native';
import { useHeroSearch } from './useHeroSearch';
import { createStyles } from './styles.native';
import { Text, View, Pressable, TextInput } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { useTheme } from '../../shared/themeContext/useTheme';

const Hero = () => {
  const search = useHeroSearch();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <View {...elementProps(`landing-hero`)} style={styles.hero} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
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
        <Text {...elementProps(`hero-domain-search-label`)} style={styles.searchLabel}>
          {`Find your next domain`}
        </Text>
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
