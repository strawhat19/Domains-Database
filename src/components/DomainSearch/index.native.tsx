import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { useDomainSearch } from './useDomainSearch';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Search, LogIn, PlugZap, X, ShieldCheck } from 'lucide-react-native';
import SearchResultCard, { SearchResultSkeleton } from './SearchResultCard';
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';

const DomainSearch = () => {
  const state = useDomainSearch();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const signedIn = Boolean(state.user?.id);
  const noConnections = state.results?.results.length === 0;
  const disabled = state.authLoading || state.loading || !state.query.trim();

  return (
    <View {...elementProps(`domain-search-page`)} style={[styles.page, width < 600 && styles.compactPage]}>
      <View {...elementProps(`domain-search-intro`)} style={styles.intro}>
        <View {...elementProps(`domain-search-eyebrow`)} style={styles.eyebrow}>
          <Search {...elementProps(`domain-search-eyebrow-icon`)} size={14} color={palette.accent} />
          <Text {...elementProps(`domain-search-eyebrow-text`)} style={styles.eyebrowText}>
            {`DOMAIN DISCOVERY`}
          </Text>
        </View>
        <Text {...elementProps(`domain-search-title`)} style={[styles.title, width < 600 && styles.compactTitle]} accessibilityRole={`header`}>
          {`Find your next domain.`}
        </Text>
        <Text {...elementProps(`domain-search-description`)} style={styles.description}>
          {`Check availability and compare prices across your connected registrars.`}
        </Text>
      </View>
      <View {...elementProps(`domain-search-form`)} style={styles.form}>
        <Text {...elementProps(`domain-search-input-label`)} style={styles.inputLabel}>
          {`Domain name`}
        </Text>
        <View {...elementProps(`domain-search-form-row`)} style={styles.formRow}>
          <View {...elementProps(`domain-search-input-wrap`)} style={styles.inputWrap}>
            <Search {...elementProps(`domain-search-input-icon`)} size={18} color={palette.muted} />
            <TextInput
              {...elementProps(`domain-search-input`)}
              style={styles.input}
              value={state.query}
              autoCorrect={false}
              autoCapitalize={`none`}
              autoComplete={`off`}
              returnKeyType={`search`}
              keyboardType={`url`}
              placeholder={`your-next-idea.com`}
              accessibilityLabel={`Domain Name To Search`}
              placeholderTextColor={palette.placeholder}
              onChangeText={state.setQuery}
              onSubmitEditing={() => void state.submit()}
            />
            {!!state.query && (
              <Pressable {...elementProps(`domain-search-clear`)} style={styles.clearButton} onPress={state.clear} accessibilityLabel={`Clear Domain Search`}>
                <X {...elementProps(`domain-search-clear-icon`)} size={16} color={palette.muted} />
              </Pressable>
            )}
          </View>
          <Pressable
            {...elementProps(`domain-search-submit`)}
            disabled={disabled}
            onPress={() => void state.submit()}
            accessibilityRole={`button`}
            accessibilityState={{ disabled, busy: state.loading }}
            style={[styles.searchButton, disabled && styles.disabled]}
          >
            {state.loading
              ? <ActivityIndicator {...elementProps(`domain-search-submit-progress`)} size={`small`} color={palette.contrast} />
              : <Search {...elementProps(`domain-search-submit-icon`)} size={17} color={palette.contrast} />}
            <Text {...elementProps(`domain-search-submit-text`)} style={styles.searchButtonText}>
              {state.loading ? `Checking…` : `Search domains`}
            </Text>
          </Pressable>
        </View>
        <View {...elementProps(`domain-search-form-footer`)} style={styles.formFooter}>
          <Text {...elementProps(`domain-search-form-hint`)} style={styles.formHint}>
            {`Enter a complete address, including .com, .io, or another extension.`}
          </Text>
          {signedIn && (
            <Link href={routes.connections.href} asChild>
              <Pressable {...elementProps(`domain-search-connections-link`)} style={styles.textLink} accessibilityLabel={`Manage Registrar Connections`}>
                <PlugZap {...elementProps(`domain-search-connections-icon`)} size={13} color={palette.accent} />
                <Text {...elementProps(`domain-search-connections-text`)} style={styles.textLinkText}>
                  {`Manage connections`}
                </Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>
      {!!state.error && (
        <View {...elementProps(`domain-search-error`)} style={styles.errorPanel} accessibilityRole={`alert`} accessibilityLiveRegion={`polite`}>
          <Text {...elementProps(`domain-search-error-text`)} style={styles.errorText}>
            {state.error}
          </Text>
        </View>
      )}
      {!signedIn && (
        <View {...elementProps(`domain-search-signin-prompt`)} style={styles.prompt}>
          <ShieldCheck {...elementProps(`domain-search-signin-icon`)} size={22} color={palette.accent} />
          <View {...elementProps(`domain-search-signin-copy`)} style={styles.promptCopy}>
            <Text {...elementProps(`domain-search-signin-title`)} style={styles.promptTitle}>
              {`Search with your registrars`}
            </Text>
            <Text {...elementProps(`domain-search-signin-description`)} style={styles.promptDescription}>
              {`Sign in, then save a supported registrar connection to check its availability and prices.`}
            </Text>
          </View>
          <Link href={{ pathname: routes.signin.href, params: { returnTo: routes.search.href } }} asChild>
            <Pressable {...elementProps(`domain-search-signin-link`)} style={styles.secondaryButton} accessibilityLabel={`Sign In To Search Domains`}>
              <LogIn {...elementProps(`domain-search-signin-link-icon`)} size={15} color={palette.ink} />
              <Text {...elementProps(`domain-search-signin-link-text`)} style={styles.secondaryButtonText}>
                {`Sign in`}
              </Text>
            </Pressable>
          </Link>
        </View>
      )}
      {signedIn && noConnections && (
        <View {...elementProps(`domain-search-empty`)} style={styles.prompt}>
          <PlugZap {...elementProps(`domain-search-empty-icon`)} size={22} color={palette.accent} />
          <View {...elementProps(`domain-search-empty-copy`)} style={styles.promptCopy}>
            <Text {...elementProps(`domain-search-empty-title`)} style={styles.promptTitle}>
              {`Connect a registrar to search`}
            </Text>
            <Text {...elementProps(`domain-search-empty-description`)} style={styles.promptDescription}>
              {`Add a supported connection in your profile, then search this name again.`}
            </Text>
          </View>
          <Link href={routes.connections.href} asChild>
            <Pressable {...elementProps(`domain-search-empty-link`)} style={styles.secondaryButton} accessibilityLabel={`Add Registrar Connections`}>
              <PlugZap {...elementProps(`domain-search-empty-link-icon`)} size={15} color={palette.ink} />
              <Text {...elementProps(`domain-search-empty-link-text`)} style={styles.secondaryButtonText}>
                {`Connections`}
              </Text>
            </Pressable>
          </Link>
        </View>
      )}
      {(state.loading || !!state.results?.results.length) && (
        <View {...elementProps(`domain-search-results-section`)} style={styles.resultsSection}>
          <View {...elementProps(`domain-search-results-heading`)} style={styles.resultsHeading}>
            <Text {...elementProps(`domain-search-results-title`)} style={styles.resultsTitle} accessibilityRole={`header`}>
              {state.loading ? `Checking your connected registrars…` : `Registrar comparison`}
            </Text>
            {!state.loading && (
              <Text {...elementProps(`domain-search-results-count`)} style={styles.resultsCount}>
                {`${state.results?.results.length ?? 0} registrar(s) checked`}
              </Text>
            )}
          </View>
          <View {...elementProps(`domain-search-results-grid`)} style={styles.resultsGrid} accessibilityLiveRegion={`polite`}>
            {state.loading
              ? [0, 1, 2].map(index => <SearchResultSkeleton key={index} styles={styles} suffix={String(index)} />)
              : state.results?.results.map((result, index) => (
                <SearchResultCard
                  key={`${result.provider}-${index}`}
                  styles={styles}
                  result={result}
                  palette={palette}
                  suffix={`${result.provider}-${index}`}
                />
              ))}
          </View>
          <Text {...elementProps(`domain-search-price-disclaimer`)} style={styles.disclaimer}>
            {`Availability and prices can change. Confirm the final total, taxes, and renewal terms at the registrar.`}
          </Text>
        </View>
      )}
      {signedIn && !state.results && !state.loading && !state.error && (
        <View {...elementProps(`domain-search-ready-note`)} style={styles.readyNote}>
          <ShieldCheck {...elementProps(`domain-search-ready-icon`)} size={15} color={palette.muted} />
          <Text {...elementProps(`domain-search-ready-copy`)} style={styles.readyCopy}>
            {`Searches use your saved supported connections. Purchase links open the registrar website.`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default DomainSearch;
