import { useMemo } from 'react';
import { Link } from 'expo-router';
import LoadingScreen from '../LoadingScreen';
import { createStyles } from './styles.native';
import { useDomainSearch } from './useDomainSearch';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Search, LogIn, PlugZap, X, ShieldCheck, Plus } from 'lucide-react-native';
import SearchResultCard, { SearchResultSkeleton } from './SearchResultCard';
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';

const DomainSearch = () => {
  const state = useDomainSearch();
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const pageStyle = [styles.page, width < 600 && styles.compactPage];
  const accessPageStyle = [...pageStyle, height <= 500 && styles.shortAccessPage];
  const signedIn = Boolean(state.user?.id);
  const busy = state.loading || state.loadingMore;
  const disabled = busy || !state.query.trim();

  if (state.accessLoading) return (
    <View {...elementProps(`domain-search-access-loading`)} style={accessPageStyle} accessibilityLabel={`Loading Domain Search`}>
      <LoadingScreen compact suffix={`domain-search-access`} label={`Loading domain search…`} />
    </View>
  );

  if (!state.eligible) return (
    <View {...elementProps(`domain-search-access-page`)} style={accessPageStyle}>
      <View {...elementProps(`domain-search-access-prompt`)} style={styles.prompt}>
        <ShieldCheck {...elementProps(`domain-search-access-icon`)} size={22} color={palette.accent} />
        <View {...elementProps(`domain-search-access-copy`)} style={styles.promptCopy}>
          <Text {...elementProps(`domain-search-access-title`)} style={styles.promptTitle}>
            {signedIn ? `Connect a registrar to search` : `Sign in to search domains`}
          </Text>
          <Text {...elementProps(`domain-search-access-description`)} style={[styles.promptDescription, !!state.accessError && { color: palette.danger }]}>
            {state.accessError || (signedIn
              ? `Add a registrar connection in your profile to unlock domain search.`
              : `Domain search is available when you sign in and add a registrar connection.`)}
          </Text>
        </View>
        <Link
          asChild
          href={signedIn ? routes.connections.href : { pathname: routes.signin.href, params: { returnTo: routes.search.href } }}
        >
          <Pressable
            {...elementProps(`domain-search-access-link`)}
            style={styles.secondaryButton}
            accessibilityRole={`link`}
            accessibilityLabel={signedIn ? `Add Registrar Connections` : `Sign In To Search Domains`}
          >
            {signedIn
              ? <PlugZap {...elementProps(`domain-search-access-link-icon`)} size={15} color={palette.ink} />
              : <LogIn {...elementProps(`domain-search-access-link-icon`)} size={15} color={palette.ink} />}
            <Text {...elementProps(`domain-search-access-link-text`)} style={styles.secondaryButtonText}>
              {signedIn ? `Connections` : `Sign in`}
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );

  return (
    <View {...elementProps(`domain-search-page`)} style={pageStyle}>
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
          {`Start with a name. Explore extensions and compare available registrars in one place.`}
        </Text>
      </View>
      <View {...elementProps(`domain-search-form`)} style={styles.form}>
        <Text {...elementProps(`domain-search-input-label`)} style={styles.inputLabel}>
          {`Name or domain`}
        </Text>
        <View {...elementProps(`domain-search-form-row`)} style={styles.formRow}>
          <View {...elementProps(`domain-search-input-wrap`)} style={styles.inputWrap}>
            <Search {...elementProps(`domain-search-input-icon`)} size={18} color={palette.muted} />
            <TextInput
              {...elementProps(`domain-search-input`)}
              style={styles.input}
              value={state.query}
              autoCorrect={false}
              autoComplete={`off`}
              autoCapitalize={`none`}
              keyboardType={`url`}
              returnKeyType={`search`}
              placeholder={`your-next-idea`}
              onChangeText={state.setQuery}
              placeholderTextColor={palette.placeholder}
              accessibilityLabel={`Name Or Full Domain To Search`}
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
            accessibilityState={{ disabled, busy }}
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
            {`No extension needed. Popular extensions appear first. Enter a full domain to check one address.`}
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
      {!!state.note && (
        <Text {...elementProps(`domain-search-catalog-note`)} style={[styles.disclaimer, { color: palette.warning }]}>
          {state.note}
        </Text>
      )}
      {!!state.checkWarnings.length && (
        <Text
          {...elementProps(`domain-search-check-warnings`)}
          accessibilityLiveRegion={`polite`}
          style={[styles.disclaimer, { color: palette.warning }]}
        >
          {state.checkWarnings.join(`\n`)}
        </Text>
      )}
      {(busy || !!state.results) && (
        <View {...elementProps(`domain-search-results-section`)} style={styles.resultsSection}>
          <View {...elementProps(`domain-search-results-heading`)} style={styles.resultsHeading}>
            <Text {...elementProps(`domain-search-results-title`)} style={styles.resultsTitle} accessibilityRole={`header`}>
              {state.totalVariants > 1 ? `Domain variants` : `Domain comparison`}
            </Text>
            {!!state.results && (
              <Text {...elementProps(`domain-search-results-count`)} style={styles.resultsCount}>
                {`${state.availableResults.length} available domain(s) · ${state.checkedVariants} of ${state.totalVariants} variant(s) checked`}
              </Text>
            )}
          </View>
          <View {...elementProps(`domain-search-results-grid`)} style={styles.resultsGrid} accessibilityLiveRegion={`polite`}>
            {state.availableResults.map(result => (
              <SearchResultCard
                key={result.domain}
                styles={styles}
                result={result}
                palette={palette}
                suffix={result.domain}
              />
            ))}
            {busy && [0, 1, 2].map(index => <SearchResultSkeleton key={`pending-${index}`} styles={styles} suffix={String(index)} />)}
          </View>
          {!!state.results && !busy && !state.availableResults.length && (
            <View
              {...elementProps(`domain-search-empty-results`)}
              style={state.hasUnconfirmedResults ? styles.errorPanel : styles.readyNote}
              accessibilityRole={state.hasUnconfirmedResults ? `alert` : undefined}
              accessibilityLiveRegion={`polite`}
            >
              <Text
                {...elementProps(`domain-search-empty-copy`)}
                style={state.hasUnconfirmedResults ? styles.errorText : styles.readyCopy}
              >
                {state.hasUnconfirmedResults
                  ? `No availability was confirmed. Some registrar checks failed or returned no availability status. Try searching again.`
                  : `No available domains in the variants checked so far.`}
              </Text>
            </View>
          )}
          {state.hasMore && (
            <Pressable
              {...elementProps(`domain-search-load-more`)}
              disabled={busy}
              onPress={() => void state.loadMore()}
              accessibilityRole={`button`}
              accessibilityState={{ disabled: busy, busy: state.loadingMore }}
              style={[styles.secondaryButton, busy && styles.disabled]}
            >
              {state.loadingMore
                ? <ActivityIndicator {...elementProps(`domain-search-load-more-progress`)} size={`small`} color={palette.ink} />
                : <Plus {...elementProps(`domain-search-load-more-icon`)} size={15} color={palette.ink} />}
              <Text {...elementProps(`domain-search-load-more-text`)} style={styles.secondaryButtonText}>
                {state.loadingMore ? `Checking more variants…` : `Show more variants`}
              </Text>
            </Pressable>
          )}
          <Text {...elementProps(`domain-search-price-disclaimer`)} style={styles.disclaimer}>
            {`Availability and prices can change. Confirm the final total, taxes, and renewal terms at the registrar.`}
          </Text>
        </View>
      )}
      {!state.results && !state.loading && !state.error && (
        <View {...elementProps(`domain-search-ready-note`)} style={styles.readyNote}>
          <ShieldCheck {...elementProps(`domain-search-ready-icon`)} size={15} color={palette.muted} />
          <Text {...elementProps(`domain-search-ready-copy`)} style={styles.readyCopy}>
            {`Compare availability and pricing across available registrars. Purchase links open in a new tab on the web.`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default DomainSearch;
