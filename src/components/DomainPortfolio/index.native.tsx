import { Link, useRouter } from 'expo-router';
import LoadingScreen from '../LoadingScreen';
import RegistrarSetup from '../RegistrarSetup';
import ConnectRegistrar from '../DomainEditor/ConnectRegistrar';
import { useEffect, useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import DomainCard from '../DomainCard/index.native';
import { REGISTRARS, useSampleData } from '../../shared/config';
import { elementProps } from '../../shared/elementProps';
import { useAuth } from '../../shared/authContext/useAuth';
import { getPortfolioColumnValue } from '../../shared/portfolioColumns';
import { useNativePortfolio } from './useNativePortfolio';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { CheckSquare, Square, ArrowDownAZ, ArrowDownWideNarrow, ArrowRight, CheckCircle2, Download, Globe2, Plus, RotateCcw, Save, Search, Upload, X, Gauge } from 'lucide-react-native';

const textFields = [
  { key: `name`, label: `Domain name`, placeholder: `yourdomain.com`, hint: `Enter the address without https:// or a path` },
  { key: `owner`, label: `Registered to`, placeholder: `Your name or business`, hint: `` },
  { key: `expiresAt`, label: `Expiry date`, placeholder: `YYYY-MM-DD`, hint: `Check this date in your registrar account` },
] as const;

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useNativePortfolio(compact);
  const router = useRouter();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const sampleCount = useSampleData ? state.domains.filter(domain => domain.isSample).length : 0;
  const sampleLabel = sampleCount ? `${sampleCount} sample domain(s) included` : `Your records, on this device`;
  const SortIcon = state.sortByName ? ArrowDownAZ : ArrowDownWideNarrow;
  const visibleIds = state.visibleDomains.map(domain => domain.id);
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

  return (
    <View
      {...elementProps(`native-domain-portfolio`)}
      style={[styles.section, !compact && styles.fullSection]}
    >
      <View {...elementProps(`native-portfolio-heading`)} style={styles.heading}>
        <View {...elementProps(`native-portfolio-heading-copy`)} style={styles.headingCopy}>
          <Text {...elementProps(`native-portfolio-eyebrow`)} style={styles.eyebrow}>
            {`DOMAIN REGISTRY`}
          </Text>
          <Text {...elementProps(`native-portfolio-title`)} style={styles.title}>
            {compact ? `Portfolio overview` : `Your portfolio`}
          </Text>
          <Text {...elementProps(`native-portfolio-description`)} style={styles.description}>
            {state.syncing ? `Checking Connected Registrars…` : `Your domain records, sorted and searchable.`}
          </Text>
        </View>
        <View {...elementProps(`native-portfolio-heading-bottom`)} style={styles.headingBottom}>
          <View {...elementProps(`native-portfolio-counts`)} style={styles.counts}>
            <View {...elementProps(`native-portfolio-count-summary`)} style={styles.countSummary}>
              <Text {...elementProps(`native-portfolio-domain-count`)} style={styles.countText}>
                {state.loading ? `Loading portfolio…` : `${state.domains.length} domain(s) · ${new Set(state.domains.map(domain => domain.registrar).filter(Boolean)).size} registrar(s)`}
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
            <Text {...elementProps(`native-portfolio-attention-count`)} style={styles.attentionText}>
              {state.loading ? `— need attention` : `${state.dueSoon} need attention`}
            </Text>
          </View>
          <Pressable {...elementProps(`native-portfolio-add`)} accessibilityRole={`button`} accessibilityLabel={`Add Domain`} disabled={state.loading} style={[styles.primaryButton, styles.addButton, state.loading && styles.disabled]} onPress={state.openSetup}>
            <Plus {...elementProps(`native-portfolio-add-icon`)} size={15} color={`#ffffff`} />
            <Text {...elementProps(`native-portfolio-add-text`)} style={styles.primaryButtonText}>
              {`Add Domain`}
            </Text>
          </Pressable>
        </View>
      </View>
      {state.loading && <LoadingScreen compact suffix={`native-domain-portfolio`} label={`Loading your portfolio…`} />}
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
              {`${selectedIds.length} selected`}
            </Text>
          </View>
        </ScrollView>
        {!compact && (
          <>
            <View {...elementProps(`native-portfolio-csv-actions`)} style={styles.csvActions}>
              <Pressable {...elementProps(`native-portfolio-import`)} style={[styles.secondaryButton, (state.working || state.loading) && styles.disabled]} disabled={state.working || state.loading} onPress={() => void state.importCsv()} accessibilityRole={`button`} accessibilityLabel={`Import Domains From CSV`}>
                <Upload {...elementProps(`native-portfolio-import-icon`)} size={13} color={palette.muted} />
                <Text {...elementProps(`native-portfolio-import-text`)} style={styles.secondaryButtonText}>
                  {`Import CSV`}
                </Text>
              </Pressable>
              <Pressable {...elementProps(`native-portfolio-export`)} style={[styles.secondaryButton, (state.working || state.loading) && styles.disabled]} disabled={state.working || state.loading} onPress={() => void state.exportCsv()} accessibilityRole={`button`} accessibilityLabel={`Export All Domains To CSV`}>
                <Download {...elementProps(`native-portfolio-export-icon`)} size={13} color={palette.muted} />
                <Text {...elementProps(`native-portfolio-export-text`)} style={styles.secondaryButtonText}>
                  {`Export CSV`}
                </Text>
              </Pressable>
              {state.working && <ActivityIndicator {...elementProps(`native-portfolio-file-progress`)} size={`small`} color={palette.accent} />}
            </View>
            <Text {...elementProps(`native-portfolio-csv-hint`)} style={styles.csvHint}>
              {`CSV columns: domain, registrar, expiry, owner, auto_renew, renewal_price, notes. Re-importing a domain updates its saved details.`}
            </Text>
          </>
        )}
      </View>
      <View {...elementProps(`native-portfolio-records`)} style={styles.records}>
        {state.loading ? [0, 1, 2].map(index => <DomainCard key={index} index={index} loading />) : state.visibleDomains.map((domain, index) => (
          <DomainCard
            key={domain.id}
            index={index}
            domain={domain}
            onSelect={selectDomain}
            onEdit={state.openEditor}
            onDelete={state.deleteDomain}
            selected={selectedIds.includes(domain.id)}
          />
        ))}
        {!state.loading && !state.visibleDomains.length && (
          <View {...elementProps(`native-portfolio-empty`)} style={styles.empty}>
            <Globe2 {...elementProps(`native-portfolio-empty-icon`)} size={26} color={palette.accent} />
            <Text {...elementProps(`native-portfolio-empty-title`)} style={styles.emptyTitle}>
              {state.domains.length ? `No matching domains` : `Add your first domain`}
            </Text>
            <Text {...elementProps(`native-portfolio-empty-description`)} style={styles.emptyDescription}>
              {state.domains.length ? `Try a different search or choose another registrar.` : `Connect a supported registrar, enter a domain, or import your records from CSV.`}
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
        <Text {...elementProps(`native-portfolio-sample-label`)} style={styles.bottomText}>
          {sampleLabel}
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
        ) : useSampleData ? (
          <Pressable {...elementProps(`native-portfolio-restore`)} style={[styles.textButton, state.loading && styles.disabled]} disabled={state.loading} accessibilityRole={`button`} accessibilityLabel={`Restore Sample Domains`} onPress={state.resetSamples}>
            <RotateCcw {...elementProps(`native-portfolio-restore-icon`)} size={11} color={palette.accent} />
            <Text {...elementProps(`native-portfolio-restore-text`)} style={styles.textButtonText}>
              {`Restore samples`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {state.setupOpen && <RegistrarSetup onClose={state.closeSetup} />}
      <Modal visible={state.editorOpen} transparent animationType={`fade`} onRequestClose={state.closeEditor}>
        <View {...elementProps(`native-domain-editor-overlay`)} style={[styles.overlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          <KeyboardAvoidingView {...elementProps(`native-domain-editor-keyboard`)} style={styles.keyboard} behavior={Platform.OS === `ios` ? `padding` : `height`}>
            <View {...elementProps(`native-domain-editor`)} style={styles.modal} accessibilityViewIsModal>
              <View {...elementProps(`native-domain-editor-header`)} style={styles.modalHeader}>
                <View {...elementProps(`native-domain-editor-heading`)} style={styles.modalHeading}>
                  <Text {...elementProps(`native-domain-editor-eyebrow`)} style={styles.modalEyebrow}>
                    {`DOMAIN RECORD`}
                  </Text>
                  <Text {...elementProps(`native-domain-editor-title`)} style={styles.modalTitle}>
                    {state.editingId ? `Edit domain` : `Add domain`}
                  </Text>
                </View>
                <Pressable {...elementProps(`native-domain-editor-close`)} style={styles.modalClose} disabled={state.saving} onPress={state.closeEditor} accessibilityRole={`button`} accessibilityLabel={`Close Domain Editor`}>
                  <X {...elementProps(`native-domain-editor-close-icon`)} size={17} color={palette.muted} />
                </Pressable>
              </View>
              <ScrollView {...elementProps(`native-domain-editor-scroll`)} style={styles.formScroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps={`handled`}>
                <ConnectRegistrar onClose={state.closeEditor} disabled={state.saving} scope={`native-domain-editor`} />
                {!!state.formError && (
                  <View {...elementProps(`native-domain-editor-error`)} style={styles.error} accessibilityRole={`alert`}>
                    <Text {...elementProps(`native-domain-editor-error-text`)} style={styles.errorText}>
                      {state.formError}
                    </Text>
                  </View>
                )}
                {textFields.map(field => (
                  <View {...elementProps(`native-domain-editor-field`, field.key)} key={field.key} style={styles.field}>
                    <Text {...elementProps(`native-domain-editor-field-label`, field.key)} style={styles.fieldLabel}>
                      {field.label}
                    </Text>
                    <TextInput
                      {...elementProps(`native-domain-editor-field-input`, field.key)}
                      style={styles.fieldInput}
                      editable={!state.saving}
                      placeholder={field.placeholder}
                      value={state.input[field.key]}
                      accessibilityLabel={field.label}
                      placeholderTextColor={palette.placeholder}
                      autoCorrect={field.key === `owner`}
                      autoCapitalize={field.key === `owner` ? `words` : `none`}
                      onChangeText={value => state.updateInput(field.key, value)}
                    />
                    {!!field.hint && (
                      <Text {...elementProps(`native-domain-editor-field-hint`, field.key)} style={styles.fieldHint}>
                        {field.hint}
                      </Text>
                    )}
                  </View>
                ))}
                <View {...elementProps(`native-domain-editor-registrar-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-registrar-label`)} style={styles.fieldLabel}>
                    {`Registrar`}
                  </Text>
                  <View {...elementProps(`native-domain-editor-registrar-choices`)} style={styles.registrarChoices}>
                    {REGISTRARS.map(registrar => (
                      <Pressable
                        {...elementProps(`native-domain-editor-registrar-choice`, registrar.toLowerCase().replace(/\s/g, `-`))}
                        key={registrar}
                        disabled={state.saving}
                        accessibilityRole={`button`}
                        accessibilityLabel={registrar}
                        onPress={() => state.updateInput(`registrar`, registrar)}
                        accessibilityState={{ selected: state.input.registrar === registrar }}
                        style={[styles.registrarButton, state.input.registrar === registrar && styles.registrarButtonActive]}
                      >
                        <Text {...elementProps(`native-domain-editor-registrar-choice-text`, registrar.toLowerCase().replace(/\s/g, `-`))} style={[styles.registrarText, state.input.registrar === registrar && styles.registrarTextActive]}>
                          {registrar}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View {...elementProps(`native-domain-editor-price-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-price-label`)} style={styles.fieldLabel}>
                    {`Annual renewal price (USD)`}
                  </Text>
                  <TextInput {...elementProps(`native-domain-editor-price-input`)} style={styles.fieldInput} editable={!state.saving} value={state.renewalPrice} onChangeText={state.setRenewalPrice} placeholder={`0.00`} placeholderTextColor={palette.placeholder} keyboardType={`decimal-pad`} accessibilityLabel={`Annual Renewal Price In USD`} />
                </View>
                <View {...elementProps(`native-domain-editor-auto-renew`)} style={styles.toggle}>
                  <View {...elementProps(`native-domain-editor-auto-renew-copy`)} style={styles.toggleCopy}>
                    <Text {...elementProps(`native-domain-editor-auto-renew-label`)} style={styles.fieldLabel}>
                      {`Auto-renew`}
                    </Text>
                    <Text {...elementProps(`native-domain-editor-auto-renew-hint`)} style={styles.fieldHint}>
                      {`Record the setting in your registrar account`}
                    </Text>
                  </View>
                  <Switch {...elementProps(`native-domain-editor-auto-renew-switch`)} disabled={state.saving} value={state.input.autoRenew} onValueChange={value => state.updateInput(`autoRenew`, value)} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={isDark ? palette.ink : `#ffffff`} ios_backgroundColor={palette.line} accessibilityLabel={`Auto-Renew Enabled In Registrar Account`} />
                </View>
                <View {...elementProps(`native-domain-editor-notes-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-notes-label`)} style={styles.fieldLabel}>
                    {`Notes (optional)`}
                  </Text>
                  <TextInput {...elementProps(`native-domain-editor-notes-input`)} multiline style={[styles.fieldInput, styles.notesInput]} editable={!state.saving} value={state.input.notes} onChangeText={value => state.updateInput(`notes`, value)} placeholder={`What is this domain for?`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Domain Notes`} />
                </View>
              </ScrollView>
              <View {...elementProps(`native-domain-editor-footer`)} style={styles.modalFooter}>
                <Pressable {...elementProps(`native-domain-editor-save`)} style={[styles.primaryButton, state.saving && styles.disabled]} disabled={state.saving} onPress={() => void state.saveDomain()} accessibilityRole={`button`} accessibilityLabel={`Save Domain`}>
                  {state.saving ? <ActivityIndicator {...elementProps(`native-domain-editor-save-progress`)} size={`small`} color={`#ffffff`} /> : <Save {...elementProps(`native-domain-editor-save-icon`)} size={14} color={`#ffffff`} />}
                  <Text {...elementProps(`native-domain-editor-save-text`)} style={styles.primaryButtonText}>
                    {state.saving ? `Saving…` : `Save domain`}
                  </Text>
                </Pressable>
                <Text {...elementProps(`native-domain-editor-footnote`)} style={styles.modalFootnote}>
                  {`Saved on this device. Registrar accounts stay as they are.`}
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
