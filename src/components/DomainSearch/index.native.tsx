import { useMemo, useState, useContext } from 'react';
import { Link } from 'expo-router';
import Toast from '../Toast';
import MagicTyping from '../MagicTyping';
import DomainDiscovery from '../DomainDiscovery';
import DiscoveryBackdrop from '../DiscoveryBackdrop';
import DomainSearchLoader from '../DomainSearchLoader';
import RecentDomainSearches from '../RecentDomainSearches';
import ResponsiveDomainHeading from '../ResponsiveDomainHeading';
import DomainDiscoveryCarousel from '../DomainDiscoveryCarousel';
import { createStyles } from './styles.native';
import { useDomainSearch } from './useDomainSearch';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useWatching } from '../../shared/watching/useWatching';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { discoveryCardGap, useDiscoveryShelf } from '../DomainDiscovery/useDiscoveryShelf';
import { useDomainDiscovery } from '../../shared/domainSearch/useDomainDiscovery';
import { Search, LogIn, PlugZap, X, ShieldCheck, Plus } from 'lucide-react-native';
import SearchResultCard from './SearchResultCard';
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';

const DomainSearch = () => {
  const state = useDomainSearch();
  const watching = useWatching();
  const { palette, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight;
  const [introHeight, setIntroHeight] = useState<number | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(Math.max(0, width - 48));
  const styles = useMemo(() => createStyles(palette), [palette]);
  const sideBySide = workspaceWidth >= 940;
  const workspaceHeight = sideBySide && pageContentHeight !== undefined ? Math.max(0, pageContentHeight - 76) : undefined;
  const workspaceStyle = [styles.workspace, sideBySide && styles.wideWorkspace, workspaceHeight !== undefined && { minHeight: workspaceHeight }];
  const pageStyle = [styles.page, width < 600 && styles.compactPage, sideBySide && styles.desktopPage];
  const accessPageStyle = [...pageStyle, height <= 500 && styles.shortAccessPage];
  const signedIn = Boolean(state.user?.id);
  const busy = state.loading || state.loadingMore;
  const hasSearchResults = Boolean(state.results) || busy;
  const disabled = busy || !state.query.trim();
  const pageLoading = state.accessLoading || state.recentSearchesLoading;
  const discovery = useDomainDiscovery(busy);
  const discoveryShelf = useDiscoveryShelf({
    sidebar: sideBySide,
    availableHeight: workspaceHeight,
    count: sideBySide ? discovery.statusResults.length : discovery.filteredResults.length,
    loading: discovery.loading || discovery.accessLoading,
  });
  const controlsWidth = sideBySide ? workspaceWidth - 320 - discoveryCardGap : workspaceWidth;
  const hasRecentSearches = state.recentSearches.length > 0 || state.recentSearchesLoading || !!state.recentSearchesError;
  const inlineRecentSearches = controlsWidth >= (sideBySide ? 576 : 720) && state.eligible && !state.accessLoading && hasRecentSearches;
  const recentSearches = (
    <RecentDomainSearches
      inline={inlineRecentSearches}
      records={state.recentSearches}
      maxHeight={inlineRecentSearches ? introHeight ?? undefined : undefined}
      onSearch={state.searchRecent}
      onClear={state.clearRecentSearches}
      error={state.recentSearchesError}
      loading={state.recentSearchesLoading}
      disabled={busy || state.accessLoading || !state.eligible}
    />
  );

  const discoveryPanel = (
    <View {...elementProps(`domain-search-discovery-column`)} style={[styles.discoveryColumn, sideBySide && styles.wideDiscoveryColumn]}>
      <DomainDiscovery
        suffix={`search`}
        state={discovery}
        disabled={busy}
        sidebar={sideBySide}
        shelf={discoveryShelf}
        onSearch={state.searchRecent}
      />
    </View>
  );

  if (pageLoading) return (
    <View {...elementProps(`domain-search-access-loading`)} style={accessPageStyle} accessibilityLabel={`Loading Domain Search`}>
      <DiscoveryBackdrop suffix={`domain-search-loading`} variant={`search`} />
      <View
        {...elementProps(`domain-search-workspace`)}
        style={workspaceStyle}
        onLayout={event => setWorkspaceWidth(event.nativeEvent.layout.width)}
      >
        <DomainSearchLoader
          sidebar={sideBySide}
          availableHeight={workspaceHeight}
        />
      </View>
    </View>
  );

  if (!state.eligible) return (
    <View {...elementProps(`domain-search-access-page`)} style={accessPageStyle}>
      <DiscoveryBackdrop suffix={`domain-search-access`} variant={`search`} />
      <View
        {...elementProps(`domain-search-workspace`)}
        style={workspaceStyle}
        onLayout={event => setWorkspaceWidth(event.nativeEvent.layout.width)}
      >
        <View {...elementProps(`domain-search-controls-column`)} style={[styles.searchColumn, sideBySide && styles.desktopSearchColumn, sideBySide && styles.wideSearchColumn]}>
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
              href={signedIn ? routes.connections.href : {
                pathname: routes.signin.href,
                params: { returnTo: routes.search.href, ...(state.requestedQuery ? { q: state.requestedQuery } : {}) },
              }}
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
          {recentSearches}
        </View>
        {discoveryPanel}
      </View>
    </View>
  );

  const feedbackAndResults = (
    <>
      {!!state.error && (
        <View {...elementProps(`domain-search-error`)} style={styles.errorPanel} accessibilityRole={`alert`} accessibilityLiveRegion={`polite`}>
          <Text {...elementProps(`domain-search-error-text`)} style={styles.errorText}>
            {state.error}
          </Text>
        </View>
      )}
      {!!state.note && !state.loading && (
        <Text {...elementProps(`domain-search-catalog-note`)} style={[styles.disclaimer, { color: palette.warning }]}>
          {state.note}
        </Text>
      )}
      {!!state.checkWarnings.length && !state.loading && (
        <Text
          {...elementProps(`domain-search-check-warnings`)}
          accessibilityLiveRegion={`polite`}
          style={[styles.disclaimer, { color: palette.warning }]}
        >
          {state.checkWarnings.join(`\n`)}
        </Text>
      )}
      {state.loading && <DomainSearchLoader results />}
      {!state.loading && !!state.results && (
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
    </>
  );

  return (
    <View {...elementProps(`domain-search-page`)} style={pageStyle}>
      <DiscoveryBackdrop suffix={`domain-search`} variant={`search`} />
      <View
        {...elementProps(`domain-search-workspace`)}
        style={workspaceStyle}
        onLayout={event => setWorkspaceWidth(event.nativeEvent.layout.width)}
      >
        <View {...elementProps(`domain-search-controls-column`)} style={[styles.searchColumn, sideBySide && styles.desktopSearchColumn, sideBySide && styles.wideSearchColumn]}>
          <View {...elementProps(`domain-search-intro-row`)} style={[styles.introRow, inlineRecentSearches && styles.wideIntroRow, sideBySide && styles.desktopIntroRow]}>
            <View
              {...elementProps(`domain-search-intro`)}
              style={[styles.intro, inlineRecentSearches && styles.wideIntro, sideBySide && styles.desktopIntro, inlineRecentSearches && sideBySide && styles.desktopInlineIntro]}
              onLayout={event => {
                const nextHeight = event.nativeEvent.layout.height;
                if (Number.isFinite(nextHeight) && nextHeight > 0) setIntroHeight(nextHeight);
              }}
            >
              <View {...elementProps(`domain-search-intro-top-row`)} style={styles.introTopRow}>
                <View {...elementProps(`domain-search-eyebrow`)} style={styles.eyebrow}>
                  <Search {...elementProps(`domain-search-eyebrow-icon`)} size={14} color={palette.accent} />
                  <Text {...elementProps(`domain-search-eyebrow-text`)} style={styles.eyebrowText}>
                    {`DOMAIN DISCOVERY`}
                  </Text>
                </View>
              </View>
              <ResponsiveDomainHeading
                id={`domain-search-title`}
                forceCompact={width < 600}
                accessibilityRole={`header`}
                shortText={`Find your domain.`}
                fullText={`Find your next domain.`}
                style={[styles.title, width < 600 && styles.compactTitle, sideBySide && styles.desktopTitle]}
              />
              <Text {...elementProps(`domain-search-description`)} style={[styles.description, sideBySide && styles.desktopDescription]}>
                {`Explore extensions and compare available registrars in one place.`}
              </Text>
            </View>
            {hasRecentSearches && (
              <View {...elementProps(`domain-search-inline-recents`)} style={[styles.recents, inlineRecentSearches && styles.inlineRecents, inlineRecentSearches && sideBySide && styles.desktopRecents]}>
                {recentSearches}
              </View>
            )}
          </View>
          <View {...elementProps(`domain-search-form`)} style={[styles.form, sideBySide && styles.desktopForm, isDark && styles.darkForm]}>
            <View {...elementProps(`domain-search-form-heading`)} style={styles.formHeading}>
              <Text {...elementProps(`domain-search-input-label`)} style={styles.inputLabel}>
                {`Name or domain`}
              </Text>
              <MagicTyping suffix={`domain-search`} paused={busy || inputFocused || !!state.query} />
            </View>
            <View {...elementProps(`domain-search-form-row`)} style={styles.formRow}>
              <View {...elementProps(`domain-search-input-wrap`)} style={[styles.inputWrap, isDark && styles.darkInputWrap]}>
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
                  onBlur={() => setInputFocused(false)}
                  onFocus={() => setInputFocused(true)}
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
          {sideBySide && (
            <View {...elementProps(`domain-search-marquees`)} style={styles.desktopCarousel}>
              <DomainDiscoveryCarousel
                suffix={`search-tlds`}
                disabled={busy}
                tldFilter={discovery.tldFilter}
                results={discovery.filteredResults}
                tldResults={discovery.statusResults}
                setTldFilter={discovery.setTldFilter}
                onSearch={state.searchRecent}
                density={(pageContentHeight ?? height - 210) < 726 ? `pill` : `compact`}
                loading={discovery.loading || discovery.accessLoading}
              />
            </View>
          )}
          {sideBySide && !hasSearchResults && feedbackAndResults}
        </View>
        {discoveryPanel}
      </View>
      {(!sideBySide || hasSearchResults) && feedbackAndResults}
      <Toast id={`search-watch-error`} message={watching.error} onDismiss={watching.clearError} />
      <Toast id={`search-watch-notice`} kind={`success`} message={watching.notice} onDismiss={watching.clearNotice} />
    </View>
  );
};

export default DomainSearch;
