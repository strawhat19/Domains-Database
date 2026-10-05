import { useMemo } from 'react';
import { Link } from 'expo-router';
import Toast from '../Toast';
import WatchingRow from '../WatchingRow';
import { createStyles } from './styles.native';
import { useWatchingPage } from './useWatchingPage';
import { routes } from '../../shared/routes';
import { Eye, Search, RefreshCw } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, TextInput, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';

const Watching = () => {
  const state = useWatchingPage();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const syncDisabled = state.disabled || !state.records.length;

  return (
    <View {...elementProps(`watching-page`)} style={[styles.page, width < 600 && styles.compactPage]}>
      <View {...elementProps(`watching-heading`)} style={styles.heading}>
        <View {...elementProps(`watching-eyebrow`)} style={styles.eyebrow}>
          <Eye {...elementProps(`watching-eyebrow-icon`)} size={14} color={palette.accent} />
          <Text {...elementProps(`watching-eyebrow-text`)} style={styles.eyebrowText}>{`YOUR WATCH LIST`}</Text>
        </View>
        <Text {...elementProps(`watching-title`)} style={styles.title} accessibilityRole={`header`}>{`Watching`}</Text>
        <Text {...elementProps(`watching-summary`)} style={styles.description}>
          {state.loading ? `Loading your watch list…` : `${state.records.length} domain(s) · ${state.availableCount} available`}
        </Text>
        <View {...elementProps(`watching-heading-actions`)} style={styles.headingActions}>
          <Pressable
            {...elementProps(`watching-sync`)}
            disabled={syncDisabled}
            accessibilityRole={`button`}
            accessibilityLabel={`Sync Mock Registrar Data`}
            accessibilityState={{ disabled: syncDisabled, busy: state.syncing }}
            style={[styles.button, syncDisabled && styles.disabled]}
            onPress={() => void state.syncManually().catch(() => undefined)}
          >
            {state.syncing
              ? <ActivityIndicator {...elementProps(`watching-sync-progress`)} size={`small`} color={palette.ink} />
              : <RefreshCw {...elementProps(`watching-sync-icon`)} size={15} color={palette.ink} />}
            <Text {...elementProps(`watching-sync-text`)} style={styles.buttonText}>{state.syncing ? `Syncing…` : `Sync`}</Text>
          </Pressable>
          <Link href={routes.search.href} asChild>
            <Pressable {...elementProps(`watching-search-link`)} style={[styles.button, styles.primaryButton]} accessibilityRole={`link`}>
              <Search {...elementProps(`watching-search-link-icon`)} size={15} color={palette.contrast} />
              <Text {...elementProps(`watching-search-link-text`)} style={[styles.buttonText, styles.primaryButtonText]}>{`Find Domains`}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      <View {...elementProps(`watching-data-description`)} style={styles.dataDescription}>
        <Text {...elementProps(`watching-storage-description`)} style={styles.description}>{state.storageMessage}</Text>
        <Text {...elementProps(`watching-sync-description`)} style={styles.description}>
          {`Sync refreshes mock registrar availability and prices until a backend is connected. Search snapshots keep the data from your search.`}
        </Text>
      </View>
      {!!state.error && <Toast id={`watching-error`} message={state.error} onDismiss={state.clearError} />}
      {!!state.notice && <Toast kind={`success`} id={`watching-notice`} message={state.notice} onDismiss={state.clearNotice} />}
      <View {...elementProps(`watching-search-wrap`)} style={styles.searchWrap}>
        <Search {...elementProps(`watching-filter-icon`)} size={16} color={palette.muted} />
        <TextInput
          {...elementProps(`watching-filter`)}
          value={state.query}
          autoCorrect={false}
          autoComplete={`off`}
          style={styles.searchInput}
          autoCapitalize={`none`}
          editable={!state.loading}
          onChangeText={state.setQuery}
          placeholder={`Find a watched domain…`}
          placeholderTextColor={palette.placeholder}
          accessibilityLabel={`Filter Watching By Domain Or Registrar`}
        />
      </View>
      <View {...elementProps(`watching-records`)} style={styles.records} accessibilityLiveRegion={`polite`}>
        {state.loading ? [0, 1, 2].map(index => (
          <View key={index} {...elementProps(`watching-skeleton-card`, String(index))} style={styles.skeletonCard} accessibilityLabel={`Loading Watched Domain`}>
            <View {...elementProps(`watching-skeleton-domain`, String(index))} style={[styles.skeleton, styles.skeletonDomain]} />
            <View {...elementProps(`watching-skeleton-prices`, String(index))} style={styles.skeleton} />
            <View {...elementProps(`watching-skeleton-date`, String(index))} style={[styles.skeleton, styles.skeletonDate]} />
          </View>
        )) : state.filteredRecords.map(record => (
          <WatchingRow key={record.id} record={record} busy={state.disabled} onRemove={state.removeWatch} />
        ))}
        {!state.loading && !state.filteredRecords.length && (
          <View {...elementProps(`watching-empty`)} style={styles.empty}>
            <Eye {...elementProps(`watching-empty-icon`)} size={24} color={palette.muted} />
            <Text {...elementProps(`watching-empty-title`)} style={styles.emptyTitle} accessibilityRole={`header`}>
              {state.records.length ? `No matching domains` : state.error ? `Watching could not be loaded` : `Your watch list is empty`}
            </Text>
            <Text {...elementProps(`watching-empty-description`)} style={[styles.description, styles.emptyDescription]}>
              {state.records.length ? `Try another domain or registrar.` : state.error ? `Review the error above before trying again.` : `Search for a domain and select Watch to save it here.`}
            </Text>
            {state.records.length ? (
              <Pressable {...elementProps(`watching-clear-filter`)} style={styles.button} onPress={() => state.setQuery(``)} accessibilityRole={`button`}>
                <Search {...elementProps(`watching-clear-filter-icon`)} size={14} color={palette.ink} />
                <Text {...elementProps(`watching-clear-filter-text`)} style={styles.buttonText}>{`Clear Filter`}</Text>
              </Pressable>
            ) : !state.error && (
              <Link href={routes.search.href} asChild>
                <Pressable {...elementProps(`watching-empty-search`)} style={styles.button} accessibilityRole={`link`}>
                  <Search {...elementProps(`watching-empty-search-icon`)} size={14} color={palette.ink} />
                  <Text {...elementProps(`watching-empty-search-text`)} style={styles.buttonText}>{`Search Domains`}</Text>
                </Pressable>
              </Link>
            )}
          </View>
        )}
      </View>
      <Text {...elementProps(`watching-price-disclaimer`)} style={styles.disclaimer}>
        {`Availability and prices can change. Confirm taxes, final totals, and renewal terms with the registrar before buying.`}
      </Text>
    </View>
  );
};

export default Watching;
