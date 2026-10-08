import { Link, useRouter } from 'expo-router';
import RegistrarSetup from '../RegistrarSetup';
import { createStyles } from './styles.native';
import { REGISTRARS } from '../../shared/config';
import TagPicker from '../TagPicker/index.native';
import DomainCard from '../DomainCard/index.native';
import CurrencyField from '../CurrencyField/index.native';
import DomainSiteIcon from '../DomainSiteIcon/index.native';
import DomainStarButton from '../DomainStarButton/index.native';
import DomainSourceBadge from '../DomainSourceBadge/index.native';
import DomainProjectSelect from '../DomainProjectSelect/index.native';
import { useEffect, useMemo, useState } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useNativePortfolio } from './useNativePortfolio';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import ConnectRegistrar from '../DomainEditor/ConnectRegistrar';
import { normalizeDomainLink } from '../../shared/domainLinks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { getDomainDeletionRestriction } from '../../shared/domainUtils';
import { normalizeDomainDifficulty, normalizeDomainProjectStatus } from '../../shared/domainProject';
import { getCustomSiteIconUrl, getDomainSiteIconUrl } from '../../shared/domainSiteIcon';
import { usePortfolioPreferences } from '../../shared/portfolioPreferences/usePortfolioPreferences';
import { ActivityIndicator, Image, Linking, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { CheckSquare, Square, ArrowDownAZ, ArrowDownWideNarrow, ArrowRight, CheckCircle2, Globe2, Link2, Plus, Save, Search, X, Gauge, Trash2, RefreshCw } from 'lucide-react-native';

const textFields = [
  { key: `name`, label: `Domain name`, placeholder: `yourdomain.com`, hint: `Enter the address without https:// or a path` },
  { key: `owner`, label: `Registered to`, placeholder: `Your name or business`, hint: `` },
  { key: `expiresAt`, label: `Renewal Date`, placeholder: `YYYY-MM-DD`, hint: `Check this date in your registrar account` },
  { key: `createdAt`, label: `Created`, placeholder: `YYYY-MM-DD`, hint: `` },
] as const;

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useNativePortfolio(compact);
  const { customGroups } = usePortfolioPreferences();
  const appDomainIds = useMemo(() => new Set(customGroups
    .filter(group => group.isApp)
    .flatMap(group => group.domainIds)), [customGroups]);
  const router = useRouter();
  const { user } = useAuth();
  const [editorIconFailed, setEditorIconFailed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionToolsWidth, setSelectionToolsWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const SortIcon = state.sortByName ? ArrowDownAZ : ArrowDownWideNarrow;
  const manualSyncBlocked = state.loading || state.syncing || state.manualSyncWaitSeconds > 0;
  const manualSyncLabel = state.syncing ? `Syncing…` : state.manualSyncWaitSeconds > 0
    ? `Wait ${Math.floor(state.manualSyncWaitSeconds / 60)}:${String(state.manualSyncWaitSeconds % 60).padStart(2, `0`)}` : `Sync`;
  const visibleIds = state.visibleDomains.map(domain => domain.id);
  const editorSiteIconUrl = getDomainSiteIconUrl(state.input);
  const editorHasCustomSiteIcon = Boolean(getCustomSiteIconUrl(state.input).trim());
  const developmentLinkActions = (state.input.developmentLinks ?? []).flatMap((value, index) => {
    try {
      const url = normalizeDomainLink(value, `Development Link`);
      return url ? [{ url, index }] : [];
    } catch { return []; }
  });
  const editingSyncedDomain = state.editingSyncedDomain;
  const editingRecord = state.domains.find(domain => domain.id === state.editingId) ?? state.editingDomain;
  const deletionRestriction = editingRecord ? getDomainDeletionRestriction(editingRecord) : ``;
  const deleteDisabled = state.saving || Boolean(deletionRestriction);
  const selectDomain = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const selectVisible = () => setSelectedIds(current => [...new Set([...current, ...visibleIds])]);
  const clearVisible = () => setSelectedIds(current => current.filter(id => !visibleIds.includes(id)));
  const insightFailed = !state.refreshing && Boolean(state.insightError);
  const insightDomains = selectedIds.length
    ? state.domains.filter(domain => selectedIds.includes(domain.id)) : state.filteredDomains;
  const refreshWebsiteInfo = () => {
    if (!user) { router.push(`/signin`); return; }
    const records = [...insightDomains];
    records.sort((first, second) => String(getPortfolioColumnValue(first, `websiteInsightsCheckedAt`) ?? ``).localeCompare(String(getPortfolioColumnValue(second, `websiteInsightsCheckedAt`) ?? ``)));
    void state.refreshWebsiteInsights(records);
  };
  useEffect(() => {
    const existing = new Set(state.domains.map(domain => domain.id));
    setSelectedIds(current => {
      const remaining = current.filter(id => existing.has(id));
      return remaining.length === current.length ? current : remaining;
    });
  }, [state.domains]);
  useEffect(() => setEditorIconFailed(false), [editorSiteIconUrl, state.editorOpen]);

  return (
    <View
      {...elementProps(`native-domain-portfolio`)}
      style={[styles.section, !compact && styles.fullSection]}
    >
      <View {...elementProps(`native-portfolio-heading`)} style={styles.heading}>
        <View {...elementProps(`native-portfolio-heading-copy`)} style={styles.headingCopy}>
          <Text {...elementProps(`native-portfolio-eyebrow`)} style={styles.eyebrow}>
            {`Table`}
          </Text>
          <Text {...elementProps(`native-portfolio-title`)} style={styles.title}>
            {`Domains`}
          </Text>
          <Text {...elementProps(`native-portfolio-description`)} style={styles.description}>
            {`Your domain records, sorted and searchable.`}
          </Text>
        </View>
        <View {...elementProps(`native-portfolio-heading-bottom`)} style={styles.headingBottom}>
          <View {...elementProps(`native-portfolio-counts`)} style={styles.counts}>
            <View {...elementProps(`native-portfolio-count-summary`)} style={styles.countSummary}>
              <Text {...elementProps(`native-portfolio-domain-count`)} style={styles.countText}>
                {state.loading ? `Loading portfolio…` : `${state.domains.length} ${state.domains.length === 1 ? `Domain` : `Domains`} · ${new Set(state.domains.map(domain => domain.registrar).filter(Boolean)).size} registrar(s)`}
              </Text>
              {!state.loading && state.registrarCounts.map(({ registrar, count }) => {
                const slug = registrar.toLowerCase().replace(/\s+/g, `-`);
                return (
                  <View
                    key={registrar}
                    style={styles.registrarCount}
                    {...elementProps(`native-portfolio-registrar-count`, slug)}
                  >
                    <Text
                      style={styles.registrarCountLabel}
                      {...elementProps(`native-portfolio-registrar-count-label`, slug)}
                    >
                      {registrar}
                    </Text>
                    <Text
                      style={styles.registrarCountValue}
                      {...elementProps(`native-portfolio-registrar-count-value`, slug)}
                    >
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View {...elementProps(`native-portfolio-counts-details`)} style={styles.countsDetails}>
              <Text {...elementProps(`native-portfolio-attention-count`)} style={styles.attentionText}>
                {state.loading ? `— need attention` : `${state.dueSoon} need attention`}
              </Text>
              {state.syncing && (
                <View
                  accessible
                  {...elementProps(`native-portfolio-sync-status`)}
                  style={styles.syncStatus}
                  accessibilityRole={`progressbar`}
                  accessibilityLiveRegion={`polite`}
                  accessibilityState={{ busy: true }}
                  accessibilityLabel={`Syncing Domains…`}
                >
                  <ActivityIndicator {...elementProps(`native-portfolio-sync-spinner`)} size={`small`} color={palette.accent} />
                  <Text {...elementProps(`native-portfolio-sync-text`)} style={styles.description}>{`Syncing Domains…`}</Text>
                </View>
              )}
            </View>
          </View>
          <View {...elementProps(`native-portfolio-primary-actions`)} style={styles.headingActions}>
            {user && state.canSyncManually && (
              <Pressable
                {...elementProps(`native-portfolio-sync-domains`)}
                disabled={manualSyncBlocked}
                accessibilityRole={`button`}
                onPress={() => void state.syncManually()}
                accessibilityState={{ disabled: manualSyncBlocked, busy: state.syncing }}
                accessibilityLabel={`Sync Domains From Connected Registrars, ${manualSyncLabel}`}
                accessibilityHint={state.manualSyncMessage || `Refresh Your Domains From Connected Registrars`}
                style={[styles.secondaryButton, styles.syncButton, manualSyncBlocked && styles.disabled]}
              >
                {state.syncing ? <ActivityIndicator {...elementProps(`native-portfolio-sync-button-progress`)} size={`small`} color={palette.accent} /> : <RefreshCw {...elementProps(`native-portfolio-sync-domains-icon`)} size={15} color={palette.accent} />}
                <Text {...elementProps(`native-portfolio-sync-domains-text`)} style={styles.secondaryButtonText}>
                  {manualSyncLabel}
                </Text>
              </Pressable>
            )}
            <Pressable {...elementProps(`native-portfolio-add`)} accessibilityRole={`button`} accessibilityLabel={`Add Domain`} disabled={state.loading} style={[styles.primaryButton, styles.addButton, state.loading && styles.disabled]} onPress={state.openSetup}>
              <Plus {...elementProps(`native-portfolio-add-icon`)} size={15} color={`#ffffff`} />
              <Text {...elementProps(`native-portfolio-add-text`)} style={styles.primaryButtonText}>
                {`Add Domain`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      {user && !!state.manualSyncMessage && (
        <Text {...elementProps(`native-portfolio-manual-sync-message`)} style={styles.manualSyncMessage} accessibilityLiveRegion={`polite`}>
          {state.manualSyncMessage}
        </Text>
      )}
      <Pressable
        onPress={refreshWebsiteInfo}
        accessibilityRole={`button`}
        style={styles.primaryButton}
        {...elementProps(`native-refresh-website-info`)}
        disabled={state.loading || state.refreshing || !insightDomains.length}
        accessibilityLabel={`Check Up To 10 Selected Or Filtered Websites`}
      >
        <Gauge {...elementProps(`native-website-info-icon`)} size={15} color={palette.contrast} />
        <Text {...elementProps(`native-website-info-text`)} style={styles.primaryButtonText}>
          {state.refreshing ? `Checking Websites…` : user ? `Refresh Website Info` : `Sign In For Website Info`}
        </Text>
      </Pressable>
      {(state.refreshing || state.insightNotice || state.insightError) && (
        <View
          {...elementProps(`native-website-info-feedback`)}
          accessibilityLiveRegion={`polite`}
          accessibilityRole={insightFailed ? `alert` : undefined}
          style={[styles.notice, insightFailed && { backgroundColor: palette.dangerBackground }]}
        >
          <Text
            {...elementProps(`native-website-info-feedback-text`)}
            style={[styles.noticeText, insightFailed && { color: palette.danger }]}
          >
            {state.refreshing ? `Checking Up To 10 Domains — Performance And Rank Are Not Visitor Counts` : state.insightError || state.insightNotice}
          </Text>
          {!state.refreshing && (
            <Pressable
              {...elementProps(`native-website-info-dismiss`)}
              style={styles.noticeDismiss}
              accessibilityRole={`button`}
              accessibilityLabel={`Dismiss Website Info`}
              onPress={() => { state.clearInsightError(); state.clearInsightNotice(); }}
            >
              <X {...elementProps(`native-website-info-dismiss-icon`)} size={13} color={insightFailed ? palette.danger : palette.success} />
            </Pressable>
          )}
        </View>
      )}
      {!!state.notice && (
        <View {...elementProps(`native-portfolio-notice`)} style={styles.notice} accessibilityLiveRegion={`polite`}>
          <CheckCircle2 {...elementProps(`native-portfolio-notice-icon`)} size={15} color={palette.success} />
          <Text {...elementProps(`native-portfolio-notice-text`)} style={styles.noticeText}>
            {state.notice}
          </Text>
          <Pressable {...elementProps(`native-portfolio-notice-dismiss`)} style={styles.noticeDismiss} onPress={state.clearNotice} accessibilityRole={`button`} accessibilityLabel={`Dismiss Notification`}>
            <X {...elementProps(`native-portfolio-notice-dismiss-icon`)} size={13} color={palette.success} />
          </Pressable>
        </View>
      )}
      {!!state.error && (
        <View {...elementProps(`native-portfolio-error`)} style={styles.error} accessibilityRole={`alert`}>
          <Text {...elementProps(`native-portfolio-error-text`)} style={styles.errorText}>
            {state.error}
          </Text>
        </View>
      )}
      <View {...elementProps(`native-portfolio-tools`)} style={styles.tools}>
        <View {...elementProps(`native-portfolio-search-row`)} style={styles.searchRow}>
          <View {...elementProps(`native-portfolio-search`)} style={styles.search}>
            <Search {...elementProps(`native-portfolio-search-icon`)} size={15} color={palette.placeholder} />
            <TextInput
              {...elementProps(`native-portfolio-search-input`)}
              value={state.search}
              autoCorrect={false}
              autoCapitalize={`none`}
              style={styles.searchInput}
              onChangeText={state.setSearch}
              placeholder={`Find a domain or owner…`}
              placeholderTextColor={palette.placeholder}
              accessibilityLabel={`Search Domains`}
            />
          </View>
          <Pressable {...elementProps(`native-portfolio-sort`)} style={styles.sortButton} accessibilityRole={`button`} accessibilityLabel={state.sortByName ? `Sort By Soonest Expiry` : `Sort By Domain Name`} onPress={() => state.setSortByName(current => !current)}>
            <SortIcon {...elementProps(`native-portfolio-sort-icon`)} size={17} color={palette.muted} />
          </Pressable>
        </View>
        <ScrollView {...elementProps(`native-portfolio-registrars`)} horizontal showsHorizontalScrollIndicator={false} style={styles.registrarScroll} contentContainerStyle={styles.registrarList}>
          {([`All`, ...REGISTRARS] as const).map(registrar => (
            <Pressable
              {...elementProps(`native-portfolio-registrar-filter`, registrar.toLowerCase().replace(/\s/g, `-`))}
              key={registrar}
              accessibilityRole={`button`}
              onPress={() => state.setRegistrar(registrar)}
              accessibilityLabel={`Show ${registrar === `All` ? `All Registrars` : registrar}`}
              accessibilityState={{ selected: state.registrar === registrar }}
              style={[styles.registrarButton, state.registrar === registrar && styles.registrarButtonActive]}
            >
              <Text {...elementProps(`native-portfolio-registrar-filter-text`, registrar.toLowerCase().replace(/\s/g, `-`))} style={[styles.registrarText, state.registrar === registrar && styles.registrarTextActive]}>
                {registrar === `All` ? `All registrars` : registrar}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView
          {...elementProps(`native-portfolio-selection-tools`)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.registrarScroll}
          contentContainerStyle={styles.registrarList}
          onLayout={event => setSelectionToolsWidth(event.nativeEvent.layout.width)}
        >
          <Pressable
            {...elementProps(`native-portfolio-check-all`)}
            style={[styles.secondaryButton, !visibleIds.length && styles.disabled]}
            disabled={!visibleIds.length}
            onPress={selectVisible}
            accessibilityRole={`button`}
            accessibilityLabel={`Select All Visible Domains`}
          >
            <CheckSquare {...elementProps(`native-portfolio-check-all-icon`)} size={13} color={palette.accent} />
            <Text {...elementProps(`native-portfolio-check-all-text`)} style={styles.secondaryButtonText}>
              {`Check all`}
            </Text>
          </Pressable>
          <Pressable
            {...elementProps(`native-portfolio-uncheck-all`)}
            style={[styles.secondaryButton, !selectedIds.some(id => visibleIds.includes(id)) && styles.disabled]}
            disabled={!selectedIds.some(id => visibleIds.includes(id))}
            onPress={clearVisible}
            accessibilityRole={`button`}
            accessibilityLabel={`Unselect All Visible Domains`}
          >
            <Square {...elementProps(`native-portfolio-uncheck-all-icon`)} size={13} color={palette.muted} />
            <Text {...elementProps(`native-portfolio-uncheck-all-text`)} style={styles.secondaryButtonText}>
              {`Uncheck all`}
            </Text>
          </Pressable>
          <View {...elementProps(`native-portfolio-selected-count`)} style={styles.secondaryButton} accessibilityLiveRegion={`polite`}>
            <Text {...elementProps(`native-portfolio-selected-count-text`)} style={styles.secondaryButtonText}>
              {selectedIds.length
                ? `${selectedIds.length} SELECTED${selectionToolsWidth >= 640 ? ` / ${state.domains.length} TOTAL` : ``}`
                : `${state.domains.length} TOTAL`}
            </Text>
          </View>
        </ScrollView>
      </View>
      <View {...elementProps(`native-portfolio-records`)} style={styles.records}>
        {state.loading ? [0, 1, 2].map(index => <DomainCard key={index} index={index} loading />) : state.visibleDomains.map((domain, index) => (
          <DomainCard
            key={domain.id}
            index={index}
            domain={domain}
            onSelect={selectDomain}
            onEdit={state.openEditor}
            selected={selectedIds.includes(domain.id)}
            hideProjectDetails={appDomainIds.has(domain.id)}
          />
        ))}
        {!state.loading && !state.visibleDomains.length && (
          <View {...elementProps(`native-portfolio-empty`)} style={styles.empty}>
            <Globe2 {...elementProps(`native-portfolio-empty-icon`)} size={26} color={palette.accent} />
            <Text {...elementProps(`native-portfolio-empty-title`)} style={styles.emptyTitle}>
              {state.domains.length ? `No matching domains` : `Add your first domain`}
            </Text>
            <Text {...elementProps(`native-portfolio-empty-description`)} style={styles.emptyDescription}>
              {state.domains.length ? `Try a different search or choose another registrar.` : `Connect your registrar to sync domains automatically. Manual entry and CSV import are also available in Add Domain.`}
            </Text>
            <Pressable
              {...elementProps(`native-portfolio-empty-action`)}
              style={styles.secondaryButton}
              accessibilityRole={`button`}
              accessibilityLabel={state.domains.length ? `Clear Filters` : `Add Domain`}
              onPress={() => {
                if (!state.domains.length) state.openSetup();
                else { state.setSearch(``); state.setRegistrar(`All`); }
              }}
            >
              {state.domains.length ? <X {...elementProps(`native-portfolio-empty-action-icon`)} size={13} color={palette.muted} /> : <Plus {...elementProps(`native-portfolio-empty-action-icon`)} size={13} color={palette.muted} />}
              <Text {...elementProps(`native-portfolio-empty-action-text`)} style={styles.secondaryButtonText}>
                {state.domains.length ? `Clear filters` : `Add Domain`}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      <View {...elementProps(`native-portfolio-bottom`)} style={styles.bottom}>
        <Text {...elementProps(`native-portfolio-showing`)} numberOfLines={1} style={styles.bottomText}>
          {state.loading ? `Loading…` : `Showing ${state.visibleDomains.length} Of ${state.filteredDomains.length}`}
        </Text>
        {compact ? (
          <Link href={`/domains`} asChild>
            <Pressable {...elementProps(`native-portfolio-view-all`)} style={styles.textButton} accessibilityLabel={`View Full Portfolio`}>
              <Text {...elementProps(`native-portfolio-view-all-text`)} style={styles.textButtonText}>
                {`View all ${state.filteredDomains.length}`}
              </Text>
              <ArrowRight {...elementProps(`native-portfolio-view-all-icon`)} size={12} color={palette.accent} />
            </Pressable>
          </Link>
        ) : (
          <Pressable {...elementProps(`native-portfolio-connect-registrar`)} style={[styles.secondaryButton, state.loading && styles.disabled]} disabled={state.loading} onPress={state.openSetup} accessibilityRole={`button`} accessibilityLabel={`Connect Registrar`}>
            <Link2 {...elementProps(`native-portfolio-connect-registrar-icon`)} size={13} color={palette.accent} />
            <Text {...elementProps(`native-portfolio-connect-registrar-text`)} style={styles.secondaryButtonText}>{`Connect Registrar`}</Text>
          </Pressable>
        )}
      </View>
      {state.setupOpen && <RegistrarSetup onClose={state.closeSetup} onManual={() => state.openEditor()} />}
      <Modal visible={state.editorOpen} transparent animationType={`fade`} onRequestClose={state.closeEditor}>
        <View {...elementProps(`native-domain-editor-overlay`)} style={[styles.overlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          <KeyboardAvoidingView {...elementProps(`native-domain-editor-keyboard`)} style={styles.keyboard} behavior={Platform.OS === `ios` ? `padding` : `height`}>
            <View {...elementProps(`native-domain-editor`)} style={styles.modal} accessibilityViewIsModal>
              <View {...elementProps(`native-domain-editor-header`)} style={styles.modalHeader}>
                <View {...elementProps(`native-domain-editor-heading`)} style={styles.modalHeading}>
                  <Text {...elementProps(`native-domain-editor-eyebrow`)} style={styles.modalEyebrow}>
                    {state.editingDomain ? `DOMAIN SETTINGS` : `DOMAIN RECORD`}
                  </Text>
                  <View
                    style={styles.modalTitleRow}
                    {...elementProps(`native-domain-editor-title-row`, state.editingId ?? `new`)}
                  >
                    <Text {...elementProps(`native-domain-editor-title`)} style={styles.modalTitle}>
                      {state.editingDomain?.name ?? `Add domain`}
                    </Text>
                    {state.editingDomain && (
                      <View
                        style={styles.modalRegistrarInfo}
                        {...elementProps(`native-domain-editor-registrar-info`, state.editingDomain.id)}
                      >
                        <Text
                          numberOfLines={1}
                          style={styles.modalRegistrar}
                          {...elementProps(`native-domain-editor-registrar-name`, state.editingDomain.id)}
                        >
                          {state.editingDomain.registrar || `—`}
                        </Text>
                        <DomainSourceBadge
                          domain={state.editingDomain}
                          id={`native-domain-editor-source-${state.editingDomain.id}`}
                        />
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={styles.modalHeaderActions}
                  {...elementProps(`native-domain-editor-header-actions`, state.editingId ?? `new`)}
                >
                  {state.editingDomain && (
                    <DomainStarButton
                      size={34}
                      disabled={state.saving}
                      domainId={state.editingDomain.id}
                      domainName={state.editingDomain.name}
                      id={`native-domain-editor-star-${state.editingDomain.id}`}
                    />
                  )}
                  <Pressable {...elementProps(`native-domain-editor-close`)} style={styles.modalClose} disabled={state.saving} onPress={state.closeEditor} accessibilityRole={`button`} accessibilityLabel={`Close Domain Editor`}>
                    <X {...elementProps(`native-domain-editor-close-icon`)} size={17} color={palette.muted} />
                  </Pressable>
                </View>
              </View>
              <ScrollView {...elementProps(`native-domain-editor-scroll`)} style={styles.formScroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps={`handled`}>
                <View {...elementProps(`native-domain-editor-site-icon-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-site-icon-label`)} style={styles.fieldLabel}>
                    {`Site Icon URL`}
                  </Text>
                  <View {...elementProps(`native-domain-editor-site-icon-row`)} style={styles.siteIconRow}>
                    <View
                      style={styles.siteIconPreviewGroup}
                      {...elementProps(`native-domain-editor-site-icon-preview-group`, state.editingId ?? `new`)}
                    >
                      <View {...elementProps(`native-domain-editor-site-icon-preview`)} style={styles.siteIconPreview}>
                        {editorSiteIconUrl && !editorIconFailed ? (
                          <Image
                            key={editorSiteIconUrl}
                            style={styles.siteIconImage}
                            source={{ uri: editorSiteIconUrl }}
                            accessibilityIgnoresInvertColors
                            onError={() => setEditorIconFailed(true)}
                            {...elementProps(`native-domain-editor-site-icon-image`)}
                            accessibilityLabel={`${editorHasCustomSiteIcon ? `Custom Logo` : `Site Icon`} Preview For ${state.input.name || `New Domain`}`}
                          />
                        ) : (
                          <Globe2 {...elementProps(`native-domain-editor-site-icon-fallback`)} size={22} color={palette.muted} />
                        )}
                      </View>
                      {editorHasCustomSiteIcon && (
                        <Text
                          style={styles.fieldHint}
                          {...elementProps(`native-domain-editor-custom-logo-label`, state.editingId ?? `new`)}
                        >
                          {`Custom logo`}
                        </Text>
                      )}
                    </View>
                    <TextInput
                      autoCorrect={false}
                      autoComplete={`off`}
                      autoCapitalize={`none`}
                      keyboardType={`url`}
                      editable={!state.saving}
                      accessibilityLabel={`Site Icon URL`}
                      value={getCustomSiteIconUrl(state.input)}
                      placeholder={`https://example.com/icon.png`}
                      placeholderTextColor={palette.placeholder}
                      {...elementProps(`native-domain-editor-site-icon-url`)}
                      style={[styles.fieldInput, styles.siteIconInput]}
                      onChangeText={value => state.updateInput(`meta`, { ...state.input.meta, siteIconUrl: value })}
                    />
                  </View>
                  {editorHasCustomSiteIcon && (
                    <View
                      accessible
                      style={styles.siteIconRow}
                      accessibilityRole={`image`}
                      {...elementProps(`native-domain-editor-original-site-icon`, state.editingId ?? `new`)}
                      accessibilityLabel={`Original Site Icon For ${state.input.name || `New Domain`}`}
                    >
                      <View
                        style={styles.siteIconPreview}
                        {...elementProps(`native-domain-editor-original-site-icon-preview`, state.editingId ?? `new`)}
                      >
                        <DomainSiteIcon
                          compact
                          size={30}
                          domain={state.input.name}
                          id={`native-domain-editor-original-site-icon-${state.editingId ?? `new`}`}
                        />
                      </View>
                      <Text
                        style={styles.fieldHint}
                        {...elementProps(`native-domain-editor-original-site-icon-label`, state.editingId ?? `new`)}
                      >
                        {`Original site icon`}
                      </Text>
                    </View>
                  )}
                  <Text {...elementProps(`native-domain-editor-site-icon-hint`)} style={styles.fieldHint}>
                    {`Use a public HTTP or HTTPS image URL. Leave blank to use the domain's favicon.`}
                  </Text>
                </View>
                {!editingSyncedDomain && <ConnectRegistrar onClose={state.closeEditor} disabled={state.saving} scope={`native-domain-editor`} />}
                {!!state.formError && (
                  <View {...elementProps(`native-domain-editor-error`)} style={styles.error} accessibilityRole={`alert`}>
                    <Text {...elementProps(`native-domain-editor-error-text`)} style={styles.errorText}>
                      {state.formError}
                    </Text>
                  </View>
                )}
                {textFields.filter(field => !state.editingDomain || ![`expiresAt`, `createdAt`].includes(field.key)).map(field => (
                  <View {...elementProps(`native-domain-editor-field`, field.key)} key={field.key} style={styles.field}>
                    <Text {...elementProps(`native-domain-editor-field-label`, field.key)} style={styles.fieldLabel}>
                      {field.label}
                    </Text>
                    <TextInput
                      {...elementProps(`native-domain-editor-field-input`, field.key)}
                      placeholder={field.placeholder}
                      value={state.input[field.key] ?? ``}
                      accessibilityLabel={field.label}
                      placeholderTextColor={palette.placeholder}
                      autoCorrect={field.key === `owner`}
                      editable={!state.saving && !editingSyncedDomain}
                      autoCapitalize={field.key === `owner` ? `words` : `none`}
                      onChangeText={value => state.updateInput(field.key, value)}
                      style={[styles.fieldInput, editingSyncedDomain && styles.fieldReadonly]}
                    />
                    {(editingSyncedDomain || !!field.hint) && (
                      <Text {...elementProps(`native-domain-editor-field-hint`, field.key)} style={styles.fieldHint}>
                        {editingSyncedDomain ? `Managed by your registrar` : field.hint}
                      </Text>
                    )}
                  </View>
                ))}
                {!state.editingDomain && <View {...elementProps(`native-domain-editor-registrar-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-registrar-label`)} style={styles.fieldLabel}>
                    {`Registrar`}
                  </Text>
                  {editingSyncedDomain ? (
                    <TextInput
                      editable={false}
                      value={state.input.registrar}
                      accessibilityLabel={`Registrar`}
                      style={[styles.fieldInput, styles.fieldReadonly]}
                      {...elementProps(`native-domain-editor-registrar-input`)}
                    />
                  ) : (
                    <View {...elementProps(`native-domain-editor-registrar-choices`)} style={styles.registrarChoices}>
                      {REGISTRARS.map(registrar => (
                        <Pressable
                          key={registrar}
                          disabled={state.saving}
                          accessibilityRole={`button`}
                          accessibilityLabel={registrar}
                          onPress={() => state.updateInput(`registrar`, registrar)}
                          accessibilityState={{ selected: state.input.registrar === registrar }}
                          {...elementProps(`native-domain-editor-registrar-choice`, registrar.toLowerCase().replace(/\s/g, `-`))}
                          style={[styles.registrarButton, state.input.registrar === registrar && styles.registrarButtonActive]}
                        >
                          <Text {...elementProps(`native-domain-editor-registrar-choice-text`, registrar.toLowerCase().replace(/\s/g, `-`))} style={[styles.registrarText, state.input.registrar === registrar && styles.registrarTextActive]}>
                            {registrar}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>}
                {!editingSyncedDomain && <View {...elementProps(`native-domain-editor-price-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-price-label`)} style={styles.fieldLabel}>
                    {`Annual renewal price (USD)`}
                  </Text>
                  <View {...elementProps(`native-domain-editor-price-control`, state.editingId ?? `new`)} style={styles.priceControl}>
                    <View
                      accessible={false}
                      style={styles.pricePrefix}
                      accessibilityElementsHidden
                      importantForAccessibility={`no-hide-descendants`}
                      {...elementProps(`native-domain-editor-price-prefix`, state.editingId ?? `new`)}
                    >
                      <Text {...elementProps(`native-domain-editor-price-currency`, state.editingId ?? `new`)} style={styles.priceCurrency}>{`$`}</Text>
                    </View>
                    <TextInput {...elementProps(`native-domain-editor-price-input`)} style={[styles.fieldInput, styles.priceInput]} editable={!state.saving} value={state.renewalPrice} onChangeText={state.setRenewalPrice} placeholder={`0.00`} placeholderTextColor={palette.placeholder} keyboardType={`decimal-pad`} accessibilityLabel={`Annual Renewal Price In USD`} />
                  </View>
                </View>}
                <View
                  style={styles.fieldPair}
                  {...elementProps(`native-domain-editor-price-fields`, state.editingId ?? `new`)}
                >
                  <View
                    style={styles.pairedField}
                    {...elementProps(`native-domain-editor-estimated-revenue-field`, state.editingId ?? `new`)}
                  >
                    <CurrencyField
                      label={`Est. Revenue`}
                      disabled={state.saving}
                      value={state.input.estimatedRevenue}
                      id={`native-domain-editor-estimated-revenue-${state.editingId ?? `new`}`}
                      onChange={value => state.updateInput(`estimatedRevenue`, value)}
                    />
                  </View>
                  <View
                    style={styles.pairedField}
                    {...elementProps(`native-domain-editor-starting-bid-field`, state.editingId ?? `new`)}
                  >
                    <CurrencyField
                      label={`Starting Bid`}
                      disabled={state.saving}
                      value={state.input.startingBid}
                      id={`native-domain-editor-starting-bid-${state.editingId ?? `new`}`}
                      onChange={value => state.updateInput(`startingBid`, value)}
                    />
                  </View>
                </View>
                {!editingSyncedDomain && <View {...elementProps(`native-domain-editor-auto-renew`)} style={styles.toggle}>
                  <View {...elementProps(`native-domain-editor-auto-renew-copy`)} style={styles.toggleCopy}>
                    <Text {...elementProps(`native-domain-editor-auto-renew-label`)} style={styles.fieldLabel}>
                      {`Auto-renew`}
                    </Text>
                    <Text {...elementProps(`native-domain-editor-auto-renew-hint`)} style={styles.fieldHint}>
                      {`Record the setting in your registrar account`}
                    </Text>
                  </View>
                  <Switch {...elementProps(`native-domain-editor-auto-renew-switch`)} disabled={state.saving} value={state.input.autoRenew} onValueChange={value => state.updateInput(`autoRenew`, value)} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={isDark ? palette.ink : `#ffffff`} ios_backgroundColor={palette.line} accessibilityLabel={`Auto-Renew Enabled In Registrar Account`} />
                </View>}
                {state.editingDomain && (
                  <View {...elementProps(`native-domain-editor-group-field`)} style={styles.field}>
                    <Text {...elementProps(`native-domain-editor-group-label`)} style={styles.fieldLabel}>
                      {`Custom Group`}
                    </Text>
                    <View
                      accessibilityRole={`radiogroup`}
                      accessibilityLabel={`Custom Domain Group`}
                      style={styles.registrarChoices}
                      {...elementProps(`native-domain-editor-group-choices`)}
                    >
                      {state.groupEditor.options.map(group => {
                        const groupId = group.id || `ungrouped`;
                        const selected = state.groupEditor.groupId === group.id;
                        return (
                          <Pressable
                            key={groupId}
                            disabled={state.saving}
                            accessibilityRole={`radio`}
                            accessibilityLabel={group.label}
                            accessibilityState={{ checked: selected }}
                            onPress={() => state.groupEditor.setGroupId(group.id)}
                            {...elementProps(`native-domain-editor-group-choice`, groupId)}
                            style={[styles.registrarButton, selected && styles.registrarButtonActive]}
                          >
                            <Text
                              {...elementProps(`native-domain-editor-group-choice-text`, groupId)}
                              style={[styles.registrarText, selected && styles.registrarTextActive]}
                            >
                              {group.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
                <View {...elementProps(`native-domain-editor-project-fields`)} style={styles.fieldPair}>
                  <View {...elementProps(`native-domain-editor-status-field`)} style={[styles.field, styles.pairedField]}>
                    <Text {...elementProps(`native-domain-editor-status-label`)} style={styles.fieldLabel}>
                      {`Status`}
                    </Text>
                    <DomainProjectSelect
                      label={`Status`}
                      field={`projectStatus`}
                      disabled={state.saving}
                      value={state.input.projectStatus}
                      id={`native-domain-editor-status-input`}
                      onChange={value => state.updateInput(`projectStatus`, normalizeDomainProjectStatus(value))}
                    />
                  </View>
                  <View {...elementProps(`native-domain-editor-difficulty-field`)} style={[styles.field, styles.pairedField]}>
                    <Text {...elementProps(`native-domain-editor-difficulty-label`)} style={styles.fieldLabel}>
                      {`Difficulty Level`}
                    </Text>
                    <DomainProjectSelect
                      field={`difficulty`}
                      disabled={state.saving}
                      label={`Difficulty Level`}
                      value={state.input.difficulty}
                      id={`native-domain-editor-difficulty-input`}
                      onChange={value => state.updateInput(`difficulty`, normalizeDomainDifficulty(value))}
                    />
                  </View>
                </View>
                <View
                  style={styles.field}
                  {...elementProps(`native-domain-editor-tags-field`, state.editingId ?? `new`)}
                >
                  <Text
                    style={styles.fieldLabel}
                    {...elementProps(`native-domain-editor-tags-label`, state.editingId ?? `new`)}
                  >
                    {`Tags`}
                  </Text>
                  <TagPicker
                    label={`Tags`}
                    disabled={state.saving}
                    value={state.input.tags}
                    id={`native-domain-editor-tags-${state.editingId ?? `new`}`}
                    onChange={tags => state.updateInput(`tags`, tags)}
                  />
                </View>
                <View {...elementProps(`native-domain-editor-plan-fields`)} style={styles.fieldPair}>
                  <View {...elementProps(`native-domain-editor-mvp-field`)} style={[styles.field, styles.pairedField]}>
                    <Text {...elementProps(`native-domain-editor-mvp-label`)} style={styles.fieldLabel}>
                      {`MVP`}
                    </Text>
                    <TextInput
                      maxLength={500}
                      style={styles.fieldInput}
                      editable={!state.saving}
                      value={state.input.mvp ?? ``}
                      accessibilityLabel={`Domain MVP`}
                      placeholder={`First version goals`}
                      placeholderTextColor={palette.placeholder}
                      {...elementProps(`native-domain-editor-mvp-input`)}
                      onChangeText={value => state.updateInput(`mvp`, value)}
                    />
                  </View>
                  <View {...elementProps(`native-domain-editor-future-field`)} style={[styles.field, styles.pairedField]}>
                    <Text {...elementProps(`native-domain-editor-future-label`)} style={styles.fieldLabel}>
                      {`Future`}
                    </Text>
                    <TextInput
                      maxLength={500}
                      style={styles.fieldInput}
                      editable={!state.saving}
                      value={state.input.future ?? ``}
                      accessibilityLabel={`Domain Future`}
                      placeholder={`Future plans`}
                      placeholderTextColor={palette.placeholder}
                      {...elementProps(`native-domain-editor-future-input`)}
                      onChangeText={value => state.updateInput(`future`, value)}
                    />
                  </View>
                </View>
                <View
                  style={styles.field}
                  {...elementProps(`native-domain-editor-development-links-field`, state.editingId ?? `new`)}
                >
                  <Text
                    style={styles.fieldLabel}
                    {...elementProps(`native-domain-editor-development-links-label`, state.editingId ?? `new`)}
                  >
                    {`Development Links`}
                  </Text>
                  <TextInput
                    multiline
                    autoCorrect={false}
                    autoComplete={`off`}
                    autoCapitalize={`none`}
                    keyboardType={`url`}
                    editable={!state.saving}
                    placeholder={`http://localhost:8081`}
                    accessibilityLabel={`Development Links`}
                    placeholderTextColor={palette.placeholder}
                    value={state.input.developmentLinks?.join(`\n`) ?? ``}
                    accessibilityHint={`Enter One HTTP Or HTTPS URL Per Line`}
                    style={[styles.fieldInput, styles.descriptionInput]}
                    {...elementProps(`native-domain-editor-development-links-input`, state.editingId ?? `new`)}
                    onChangeText={value => state.updateInput(`developmentLinks`, value.split(/\r?\n/))}
                  />
                  <Text
                    style={styles.fieldHint}
                    {...elementProps(`native-domain-editor-development-links-hint`, state.editingId ?? `new`)}
                  >
                    {`Enter one HTTP or HTTPS URL per line.`}
                  </Text>
                  {!!developmentLinkActions.length && (
                    <View
                      style={styles.registrarChoices}
                      {...elementProps(`native-domain-editor-development-links-actions`, state.editingId ?? `new`)}
                    >
                      {developmentLinkActions.map(({ url, index }) => (
                        <Pressable
                          key={index}
                          disabled={state.saving}
                          accessibilityRole={`link`}
                          accessibilityState={{ disabled: state.saving }}
                          accessibilityLabel={`Open Development Link ${index + 1}: ${url}`}
                          style={[styles.secondaryButton, state.saving && styles.disabled]}
                          onPress={() => void Linking.openURL(url).catch(() => undefined)}
                          {...elementProps(`native-domain-editor-development-link-open`, `${state.editingId ?? `new`}-${index}`)}
                        >
                          <Link2
                            size={14}
                            color={palette.accent}
                            {...elementProps(`native-domain-editor-development-link-icon`, `${state.editingId ?? `new`}-${index}`)}
                          />
                          <Text
                            style={styles.secondaryButtonText}
                            {...elementProps(`native-domain-editor-development-link-text`, `${state.editingId ?? `new`}-${index}`)}
                          >
                            {`Open Link ${index + 1}`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
                <View {...elementProps(`native-domain-editor-description-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-description-label`)} style={styles.fieldLabel}>
                    {`Description (optional)`}
                  </Text>
                  <TextInput
                    multiline
                    editable={!state.saving}
                    value={state.input.description ?? ``}
                    accessibilityLabel={`Domain Description`}
                    placeholder={`Describe this domain's purpose`}
                    placeholderTextColor={palette.placeholder}
                    style={[styles.fieldInput, styles.descriptionInput]}
                    {...elementProps(`native-domain-editor-description-input`)}
                    onChangeText={value => state.updateInput(`description`, value)}
                  />
                </View>
              </ScrollView>
              <View {...elementProps(`native-domain-editor-footer`)} style={styles.modalFooter}>
                <Pressable {...elementProps(`native-domain-editor-save`)} style={[styles.primaryButton, state.saving && styles.disabled]} disabled={state.saving} onPress={() => void state.saveDomain()} accessibilityRole={`button`} accessibilityLabel={`Save Domain`}>
                  {state.saving && !state.deleting ? <ActivityIndicator {...elementProps(`native-domain-editor-save-progress`)} size={`small`} color={`#ffffff`} /> : <Save {...elementProps(`native-domain-editor-save-icon`)} size={14} color={`#ffffff`} />}
                  <Text {...elementProps(`native-domain-editor-save-text`)} style={styles.primaryButtonText}>
                    {state.saving && !state.deleting ? `Saving…` : `Save domain`}
                  </Text>
                </Pressable>
                {state.editingDomain && (
                  <View
                    style={styles.field}
                    {...elementProps(`native-domain-editor-delete-action`, state.editingDomain.id)}
                  >
                    <Pressable
                      disabled={deleteDisabled}
                      onPress={state.requestDelete}
                      accessibilityRole={`button`}
                      accessibilityLabel={`Delete ${state.editingDomain.name}`}
                      accessibilityHint={deletionRestriction || `Confirm removal from your portfolio`}
                      accessibilityState={{ disabled: deleteDisabled }}
                      {...elementProps(`native-domain-editor-delete`, state.editingDomain.id)}
                      style={[styles.secondaryButton, styles.deleteButton, deleteDisabled && styles.disabled]}
                    >
                      <Trash2
                        size={14}
                        color={palette.danger}
                        {...elementProps(`native-domain-editor-delete-icon`, state.editingDomain.id)}
                      />
                      <Text
                        style={[styles.secondaryButtonText, styles.deleteButtonText]}
                        {...elementProps(`native-domain-editor-delete-text`, state.editingDomain.id)}
                      >
                        {state.deleting ? `Deleting…` : `Delete Domain`}
                      </Text>
                    </Pressable>
                    {!!deletionRestriction && (
                      <Text
                        style={styles.fieldHint}
                        {...elementProps(`native-domain-editor-delete-restriction`, state.editingDomain.id)}
                      >
                        {deletionRestriction}
                      </Text>
                    )}
                  </View>
                )}
                <Text {...elementProps(`native-domain-editor-footnote`)} style={styles.modalFootnote}>
                  {`Registrar accounts stay as they are.`}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default DomainPortfolio;
