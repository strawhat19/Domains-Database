import { Link } from 'expo-router';
import { styles } from './styles.native';
import DomainCard from '../DomainCard/index.native';
import { REGISTRARS } from '../../shared/config';
import { elementProps } from '../../shared/elementProps';
import { useNativePortfolio } from './useNativePortfolio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { ArrowDownAZ, ArrowDownWideNarrow, ArrowRight, CheckCircle2, Download, Globe2, Plus, RotateCcw, Save, Search, Upload, X } from 'lucide-react-native';

const textFields = [
  { key: `name`, label: `Domain name`, placeholder: `yourdomain.com`, hint: `Enter the address without https:// or a path` },
  { key: `owner`, label: `Registered to`, placeholder: `Your name or business`, hint: `` },
  { key: `expiresAt`, label: `Expiry date`, placeholder: `YYYY-MM-DD`, hint: `Check this date in your registrar account` },
] as const;

const DomainPortfolio = ({ compact = false }: { compact?: boolean }) => {
  const state = useNativePortfolio(compact);
  const insets = useSafeAreaInsets();
  const sampleCount = state.domains.filter(domain => domain.isSample).length;
  const sampleLabel = sampleCount ? `${sampleCount} sample domain(s) included` : `Your records, on this device`;
  const SortIcon = state.sortByName ? ArrowDownAZ : ArrowDownWideNarrow;

  return (
    <View {...elementProps(`native-domain-portfolio`)} style={styles.section}>
      <View {...elementProps(`native-portfolio-heading`)} style={styles.heading}>
        <View {...elementProps(`native-portfolio-heading-copy`)} style={styles.headingCopy}>
          <Text {...elementProps(`native-portfolio-eyebrow`)} style={styles.eyebrow}>
            {`YOUR DIGITAL REAL ESTATE`}
          </Text>
          <Text {...elementProps(`native-portfolio-title`)} style={styles.title}>
            {compact ? `The whole portfolio.` : `Your portfolio.`}
          </Text>
          <Text {...elementProps(`native-portfolio-description`)} style={styles.description}>
            {`One quiet place for every domain you own.`}
          </Text>
        </View>
        <View {...elementProps(`native-portfolio-heading-bottom`)} style={styles.headingBottom}>
          <View {...elementProps(`native-portfolio-counts`)} style={styles.counts}>
            <Text {...elementProps(`native-portfolio-domain-count`)} style={styles.countText}>
              {state.loading ? `Loading portfolio…` : `${state.domains.length} domain(s) · ${new Set(state.domains.map(domain => domain.registrar)).size} registrar(s)`}
            </Text>
            <Text {...elementProps(`native-portfolio-attention-count`)} style={styles.attentionText}>
              {`${state.dueSoon} need attention`}
            </Text>
          </View>
          <Pressable {...elementProps(`native-portfolio-add`)} accessibilityRole={`button`} accessibilityLabel={`Add Domain`} disabled={state.loading} style={[styles.primaryButton, state.loading && styles.disabled]} onPress={() => state.openEditor()}>
            <Plus {...elementProps(`native-portfolio-add-icon`)} size={15} color={`#fffefa`} />
            <Text {...elementProps(`native-portfolio-add-text`)} style={styles.primaryButtonText}>
              {`Add domain`}
            </Text>
          </Pressable>
        </View>
      </View>
      {!!state.notice && (
        <View {...elementProps(`native-portfolio-notice`)} style={styles.notice} accessibilityLiveRegion={`polite`}>
          <CheckCircle2 {...elementProps(`native-portfolio-notice-icon`)} size={15} color={`#248477`} />
          <Text {...elementProps(`native-portfolio-notice-text`)} style={styles.noticeText}>
            {state.notice}
          </Text>
          <Pressable {...elementProps(`native-portfolio-notice-dismiss`)} style={styles.noticeDismiss} onPress={state.clearNotice} accessibilityRole={`button`} accessibilityLabel={`Dismiss Notification`}>
            <X {...elementProps(`native-portfolio-notice-dismiss-icon`)} size={13} color={`#248477`} />
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
            <Search {...elementProps(`native-portfolio-search-icon`)} size={15} color={`#8a938d`} />
            <TextInput
              {...elementProps(`native-portfolio-search-input`)}
              value={state.search}
              autoCorrect={false}
              autoCapitalize={`none`}
              style={styles.searchInput}
              onChangeText={state.setSearch}
              placeholder={`Find a domain or owner…`}
              placeholderTextColor={`#8a938d`}
              accessibilityLabel={`Search Domains`}
            />
          </View>
          <Pressable {...elementProps(`native-portfolio-sort`)} style={styles.sortButton} accessibilityRole={`button`} accessibilityLabel={state.sortByName ? `Sort By Soonest Expiry` : `Sort By Domain Name`} onPress={() => state.setSortByName(current => !current)}>
            <SortIcon {...elementProps(`native-portfolio-sort-icon`)} size={17} color={`#61716f`} />
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
        {!compact && (
          <>
            <View {...elementProps(`native-portfolio-csv-actions`)} style={styles.csvActions}>
              <Pressable {...elementProps(`native-portfolio-import`)} style={[styles.secondaryButton, (state.working || state.loading) && styles.disabled]} disabled={state.working || state.loading} onPress={() => void state.importCsv()} accessibilityRole={`button`} accessibilityLabel={`Import Domains From CSV`}>
                <Upload {...elementProps(`native-portfolio-import-icon`)} size={13} color={`#61716f`} />
                <Text {...elementProps(`native-portfolio-import-text`)} style={styles.secondaryButtonText}>
                  {`Import CSV`}
                </Text>
              </Pressable>
              <Pressable {...elementProps(`native-portfolio-export`)} style={[styles.secondaryButton, (state.working || state.loading) && styles.disabled]} disabled={state.working || state.loading} onPress={() => void state.exportCsv()} accessibilityRole={`button`} accessibilityLabel={`Export All Domains To CSV`}>
                <Download {...elementProps(`native-portfolio-export-icon`)} size={13} color={`#61716f`} />
                <Text {...elementProps(`native-portfolio-export-text`)} style={styles.secondaryButtonText}>
                  {`Export CSV`}
                </Text>
              </Pressable>
              {state.working && <ActivityIndicator {...elementProps(`native-portfolio-file-progress`)} size={`small`} color={`#138b8b`} />}
            </View>
            <Text {...elementProps(`native-portfolio-csv-hint`)} style={styles.csvHint}>
              {`CSV columns: domain, registrar, expiry (YYYY-MM-DD), owner, auto_renew, renewal_price, notes. Import merges matching domains.`}
            </Text>
          </>
        )}
      </View>
      <View {...elementProps(`native-portfolio-records`)} style={styles.records}>
        {state.loading ? [0, 1, 2].map(index => <DomainCard key={index} index={index} loading />) : state.visibleDomains.map(domain => (
          <DomainCard key={domain.id} domain={domain} onEdit={state.openEditor} onDelete={state.deleteDomain} />
        ))}
        {!state.loading && !state.visibleDomains.length && (
          <View {...elementProps(`native-portfolio-empty`)} style={styles.empty}>
            <Globe2 {...elementProps(`native-portfolio-empty-icon`)} size={26} color={`#138b8b`} />
            <Text {...elementProps(`native-portfolio-empty-title`)} style={styles.emptyTitle}>
              {state.domains.length ? `No matches, yet.` : `Room for your first domain.`}
            </Text>
            <Text {...elementProps(`native-portfolio-empty-description`)} style={styles.emptyDescription}>
              {state.domains.length ? `Try a different search or choose another registrar.` : `Add an address you own or import your portfolio from a CSV file.`}
            </Text>
            <Pressable
              {...elementProps(`native-portfolio-empty-action`)}
              style={styles.secondaryButton}
              accessibilityRole={`button`}
              accessibilityLabel={state.domains.length ? `Clear Filters` : `Add First Domain`}
              onPress={() => {
                if (!state.domains.length) state.openEditor();
                else { state.setSearch(``); state.setRegistrar(`All`); }
              }}
            >
              {state.domains.length ? <X {...elementProps(`native-portfolio-empty-action-icon`)} size={13} color={`#61716f`} /> : <Plus {...elementProps(`native-portfolio-empty-action-icon`)} size={13} color={`#61716f`} />}
              <Text {...elementProps(`native-portfolio-empty-action-text`)} style={styles.secondaryButtonText}>
                {state.domains.length ? `Clear filters` : `Add a domain`}
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
              <ArrowRight {...elementProps(`native-portfolio-view-all-icon`)} size={12} color={`#138b8b`} />
            </Pressable>
          </Link>
        ) : (
          <Pressable {...elementProps(`native-portfolio-restore`)} style={[styles.textButton, state.loading && styles.disabled]} disabled={state.loading} accessibilityRole={`button`} accessibilityLabel={`Restore Sample Domains`} onPress={state.resetSamples}>
            <RotateCcw {...elementProps(`native-portfolio-restore-icon`)} size={11} color={`#138b8b`} />
            <Text {...elementProps(`native-portfolio-restore-text`)} style={styles.textButtonText}>
              {`Restore samples`}
            </Text>
          </Pressable>
        )}
      </View>
      <Modal visible={state.editorOpen} transparent animationType={`fade`} onRequestClose={state.closeEditor}>
        <View {...elementProps(`native-domain-editor-overlay`)} style={[styles.overlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          <KeyboardAvoidingView {...elementProps(`native-domain-editor-keyboard`)} style={styles.keyboard} behavior={Platform.OS === `ios` ? `padding` : `height`}>
            <View {...elementProps(`native-domain-editor`)} style={styles.modal} accessibilityViewIsModal>
              <View {...elementProps(`native-domain-editor-header`)} style={styles.modalHeader}>
                <View {...elementProps(`native-domain-editor-heading`)} style={styles.modalHeading}>
                  <Text {...elementProps(`native-domain-editor-eyebrow`)} style={styles.modalEyebrow}>
                    {`MAKE A LITTLE ROOM`}
                  </Text>
                  <Text {...elementProps(`native-domain-editor-title`)} style={styles.modalTitle}>
                    {state.editingId ? `Edit your domain.` : `Add an address.`}
                  </Text>
                </View>
                <Pressable {...elementProps(`native-domain-editor-close`)} style={styles.modalClose} disabled={state.saving} onPress={state.closeEditor} accessibilityRole={`button`} accessibilityLabel={`Close Domain Editor`}>
                  <X {...elementProps(`native-domain-editor-close-icon`)} size={17} color={`#61716f`} />
                </Pressable>
              </View>
              <ScrollView {...elementProps(`native-domain-editor-scroll`)} style={styles.formScroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps={`handled`}>
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
                      placeholderTextColor={`#8a938d`}
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
                  <TextInput {...elementProps(`native-domain-editor-price-input`)} style={styles.fieldInput} editable={!state.saving} value={state.renewalPrice} onChangeText={state.setRenewalPrice} placeholder={`0.00`} placeholderTextColor={`#8a938d`} keyboardType={`decimal-pad`} accessibilityLabel={`Annual Renewal Price In USD`} />
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
                  <Switch {...elementProps(`native-domain-editor-auto-renew-switch`)} disabled={state.saving} value={state.input.autoRenew} onValueChange={value => state.updateInput(`autoRenew`, value)} trackColor={{ false: `#dce3d9`, true: `#138b8b` }} thumbColor={`#fffefa`} accessibilityLabel={`Auto-Renew Enabled In Registrar Account`} />
                </View>
                <View {...elementProps(`native-domain-editor-notes-field`)} style={styles.field}>
                  <Text {...elementProps(`native-domain-editor-notes-label`)} style={styles.fieldLabel}>
                    {`Notes (optional)`}
                  </Text>
                  <TextInput {...elementProps(`native-domain-editor-notes-input`)} multiline style={[styles.fieldInput, styles.notesInput]} editable={!state.saving} value={state.input.notes} onChangeText={value => state.updateInput(`notes`, value)} placeholder={`What is this domain for?`} placeholderTextColor={`#8a938d`} accessibilityLabel={`Domain Notes`} />
                </View>
              </ScrollView>
              <View {...elementProps(`native-domain-editor-footer`)} style={styles.modalFooter}>
                <Pressable {...elementProps(`native-domain-editor-save`)} style={[styles.primaryButton, state.saving && styles.disabled]} disabled={state.saving} onPress={() => void state.saveDomain()} accessibilityRole={`button`} accessibilityLabel={`Save Domain`}>
                  {state.saving ? <ActivityIndicator {...elementProps(`native-domain-editor-save-progress`)} size={`small`} color={`#fffefa`} /> : <Save {...elementProps(`native-domain-editor-save-icon`)} size={14} color={`#fffefa`} />}
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
