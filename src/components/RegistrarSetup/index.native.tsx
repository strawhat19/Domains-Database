import { useMemo, useState } from 'react';
import { File } from 'expo-file-system';
import { createStyles } from './styles.native';
import * as DocumentPicker from 'expo-document-picker';
import { useRegistrarSetup } from './useRegistrarSetup';
import { elementProps } from '../../shared/elementProps';
import { formatCurrency } from '../../shared/domainUtils';
import { useTheme } from '../../shared/themeContext/useTheme';
import { SETUP_REGISTRARS, registrarGuides } from '../../shared/registrars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Check, Upload, Trash2, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react-native';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

const steps = [`Choose registrar`, `Add domains`, `Review`];
const fields = [
  { key: `name`, label: `Domain name`, placeholder: `yourdomain.com` },
  { key: `expiresAt`, label: `Expiry date`, placeholder: `YYYY-MM-DD` },
  { key: `renewalPrice`, label: `Annual cost in USD (optional)`, placeholder: `0.00` },
] as const;

const RegistrarSetup = ({ onClose }: { onClose: () => void }) => {
  const state = useRegistrarSetup(onClose);
  const { theme, palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const [readingCsv, setReadingCsv] = useState(false);
  const busy = state.saving || readingCsv;
  const guide = state.registrar ? registrarGuides[state.registrar] : null;
  const close = () => { if (!busy) state.close(); };

  const openAccount = async () => {
    if (!guide) return;
    try {
      await Linking.openURL(guide.url);
    } catch {
      state.reportError(`Unable To Open Your Registrar. Open Its Website In Your Browser.`);
    }
  };
  const importCsv = async () => {
    if (busy) return;
    setReadingCsv(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: [`text/*`, `application/csv`, `application/vnd.ms-excel`],
      });
      const document = result.assets?.[0];
      if (result.canceled || !document) return;
      if ((document.size ?? 0) > 5 * 1024 * 1024) throw new Error(`Choose A CSV Smaller Than 5 MB`);
      state.loadCsv(await new File(document.uri).text(), document.name);
    } catch (caught) {
      state.reportError(caught instanceof Error ? caught.message : `Unable To Read CSV`);
    } finally {
      setReadingCsv(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType={`fade`}
      onRequestClose={close}
    >
      <View
        {...elementProps(`native-registrar-setup-overlay`)}
        style={[styles.overlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}
      >
        <KeyboardAvoidingView
          style={styles.keyboard}
          {...elementProps(`native-registrar-setup-keyboard`)}
          behavior={Platform.OS === `ios` ? `padding` : `height`}
        >
          <View
            style={styles.dialog}
            accessibilityViewIsModal
            {...elementProps(`native-registrar-setup-dialog`)}
          >
            <View {...elementProps(`native-registrar-setup-header`)} style={styles.header}>
              <View {...elementProps(`native-registrar-setup-heading`)} style={styles.heading}>
                <Text {...elementProps(`native-registrar-setup-eyebrow`)} style={styles.eyebrow}>
                  {`YOUR REGISTRAR, YOUR DOMAINS`}
                </Text>
                <Text
                  style={styles.title}
                  accessibilityRole={`header`}
                  {...elementProps(`native-registrar-setup-title`)}
                >
                  {`Add Domain`}
                </Text>
              </View>
              <Pressable
                disabled={busy}
                onPress={close}
                style={styles.iconButton}
                accessibilityRole={`button`}
                accessibilityLabel={`Close Domain Setup`}
                {...elementProps(`native-registrar-setup-close`)}
              >
                <X size={18} color={palette.muted} {...elementProps(`native-registrar-setup-close-icon`)} />
              </Pressable>
            </View>
            <View {...elementProps(`native-registrar-setup-steps`)} style={styles.steps}>
              {steps.map((label, index) => (
                <Text
                  key={label}
                  {...elementProps(`native-registrar-setup-step`, String(index))}
                  style={[styles.step, state.step === index && styles.activeStep]}
                >
                  {`${index + 1}. ${label}`}
                </Text>
              ))}
            </View>
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps={`handled`}
              contentContainerStyle={styles.content}
              {...elementProps(`native-registrar-setup-content`)}
            >
              {!!state.error && (
                <Text
                  style={styles.error}
                  accessibilityRole={`alert`}
                  {...elementProps(`native-registrar-setup-error`)}
                >
                  {state.error}
                </Text>
              )}
              {state.step === 0 && (
                <View {...elementProps(`native-registrar-setup-choices`)} style={styles.group}>
                  <Text {...elementProps(`native-registrar-setup-intro`)} style={styles.description}>
                    {`Choose the account holding your domains. We'll guide you through bringing in your records.`}
                  </Text>
                  {SETUP_REGISTRARS.map(registrar => {
                    const selected = state.registrar === registrar;
                    const suffix = registrar.toLowerCase();
                    return (
                      <Pressable
                        key={registrar}
                        accessibilityRole={`radio`}
                        accessibilityLabel={registrar}
                        accessibilityState={{ checked: selected }}
                        {...elementProps(`native-registrar-choice`, suffix)}
                        onPress={() => state.selectRegistrar(registrar)}
                        style={[styles.choice, selected && styles.selectedChoice]}
                      >
                        <Text {...elementProps(`native-registrar-choice-label`, suffix)} style={styles.choiceLabel}>
                          {registrar}
                        </Text>
                        {selected
                          ? <Check size={18} color={palette.accent} {...elementProps(`native-registrar-choice-icon`, suffix)} />
                          : <ArrowRight size={18} color={palette.muted} {...elementProps(`native-registrar-choice-icon`, suffix)} />}
                      </Pressable>
                    );
                  })}
                  <Text {...elementProps(`native-registrar-setup-local-note`)} style={styles.description}>
                    {`This imports records you provide and saves them on this device. No passwords or API keys are needed.`}
                  </Text>
                </View>
              )}
              {state.step === 1 && guide && (
                <View {...elementProps(`native-registrar-setup-records`)} style={styles.group}>
                  <View {...elementProps(`native-registrar-account-guide`)} style={styles.guide}>
                    <Text {...elementProps(`native-registrar-account-guide-title`)} style={styles.label}>
                      {`Get your ${state.registrar} records`}
                    </Text>
                    {guide.steps.map((instruction, index) => (
                      <Text
                        key={index}
                        style={styles.description}
                        {...elementProps(`native-registrar-account-step`, String(index))}
                      >
                        {`${index + 1}. ${instruction}`}
                      </Text>
                    ))}
                    <Pressable
                      onPress={openAccount}
                      style={styles.textButton}
                      accessibilityRole={`link`}
                      {...elementProps(`native-registrar-open-account`)}
                      accessibilityLabel={`Open ${state.registrar} Account`}
                    >
                      <Text {...elementProps(`native-registrar-open-account-text`)} style={styles.linkText}>
                        {`Open ${state.registrar}`}
                      </Text>
                      <ArrowUpRight size={15} color={palette.accent} {...elementProps(`native-registrar-open-account-icon`)} />
                    </Pressable>
                  </View>
                  <Pressable
                    disabled={busy}
                    onPress={importCsv}
                    style={styles.secondaryButton}
                    accessibilityRole={`button`}
                    accessibilityLabel={`Import Registrar CSV`}
                    {...elementProps(`native-registrar-import-csv`)}
                  >
                    <Upload size={15} color={palette.ink} {...elementProps(`native-registrar-import-icon`)} />
                    <Text {...elementProps(`native-registrar-import-text`)} style={styles.secondaryText}>
                      {readingCsv ? `Reading CSV…` : `Import CSV`}
                    </Text>
                  </Pressable>
                  <Text {...elementProps(`native-registrar-csv-help`)} style={styles.description}>
                    {`Enter records below or import a CSV with domain and expiry columns. Missing costs default to 0; confirm auto-renew in your account.`}
                  </Text>
                  {!!state.csvNotice && (
                    <Text {...elementProps(`native-registrar-csv-notice`)} style={styles.success} accessibilityLiveRegion={`polite`}>
                      {state.csvNotice}
                    </Text>
                  )}
                  <Text {...elementProps(`native-registrar-owner-label`)} style={styles.label}>
                    {`Owner / portfolio`}
                  </Text>
                  <TextInput
                    value={state.owner}
                    style={styles.input}
                    editable={!busy}
                    onChangeText={state.setOwner}
                    keyboardAppearance={theme}
                    accessibilityLabel={`Owner Or Portfolio`}
                    {...elementProps(`native-registrar-owner-input`)}
                  />
                  {state.drafts.map((draft, index) => (
                    <View key={draft.id} {...elementProps(`native-registrar-domain-fields`, draft.id)} style={styles.domainFields}>
                      <View {...elementProps(`native-registrar-domain-heading`, draft.id)} style={styles.domainHeading}>
                        <Text {...elementProps(`native-registrar-domain-number`, draft.id)} style={styles.label}>
                          {`Domain ${index + 1}`}
                        </Text>
                        {state.drafts.length > 1 && (
                          <Pressable
                            disabled={busy}
                            style={styles.iconButton}
                            accessibilityRole={`button`}
                            onPress={() => state.removeDraft(draft.id)}
                            {...elementProps(`native-registrar-domain-remove`, draft.id)}
                            accessibilityLabel={`Remove Domain ${index + 1} From Import`}
                          >
                            <Trash2 size={16} color={palette.danger} {...elementProps(`native-registrar-domain-remove-icon`, draft.id)} />
                          </Pressable>
                        )}
                      </View>
                      {fields.map(field => (
                        <View key={field.key} {...elementProps(`native-registrar-domain-field`, `${draft.id}-${field.key}`)} style={styles.field}>
                          <Text {...elementProps(`native-registrar-domain-label`, `${draft.id}-${field.key}`)} style={styles.label}>
                            {field.label}
                          </Text>
                          <TextInput
                            editable={!busy}
                            style={styles.input}
                            autoCorrect={false}
                            autoCapitalize={`none`}
                            value={draft[field.key]}
                            keyboardAppearance={theme}
                            placeholder={field.placeholder}
                            placeholderTextColor={palette.placeholder}
                            keyboardType={field.key === `renewalPrice` ? `decimal-pad` : `default`}
                            onChangeText={value => state.updateDraft(draft.id, field.key, value)}
                            {...elementProps(`native-registrar-domain-input`, `${draft.id}-${field.key}`)}
                            accessibilityLabel={`${field.label} For Domain ${index + 1}`}
                          />
                        </View>
                      ))}
                      <View {...elementProps(`native-registrar-domain-auto-renew`, draft.id)} style={styles.domainHeading}>
                        <Text {...elementProps(`native-registrar-domain-auto-renew-label`, draft.id)} style={styles.label}>
                          {`Auto-renew in registrar account`}
                        </Text>
                        <Switch
                          disabled={busy}
                          value={draft.autoRenew}
                          thumbColor={palette.paper}
                          ios_backgroundColor={palette.line}
                          trackColor={{ false: palette.line, true: palette.accent }}
                          onValueChange={value => state.updateDraft(draft.id, `autoRenew`, value)}
                          {...elementProps(`native-registrar-domain-auto-renew-switch`, draft.id)}
                          accessibilityLabel={`Auto-Renew For Domain ${index + 1}`}
                        />
                      </View>
                      <TextInput
                        multiline
                        editable={!busy}
                        value={draft.notes}
                        placeholder={`Notes (optional)`}
                        keyboardAppearance={theme}
                        placeholderTextColor={palette.placeholder}
                        style={[styles.input, styles.notesInput]}
                        onChangeText={value => state.updateDraft(draft.id, `notes`, value)}
                        {...elementProps(`native-registrar-domain-notes`, draft.id)}
                        accessibilityLabel={`Notes For Domain ${index + 1}`}
                      />
                    </View>
                  ))}
                  <Pressable
                    disabled={busy}
                    onPress={state.addDraft}
                    style={styles.secondaryButton}
                    accessibilityRole={`button`}
                    accessibilityLabel={`Add Another Domain`}
                    {...elementProps(`native-registrar-add-another`)}
                  >
                    <Plus size={15} color={palette.ink} {...elementProps(`native-registrar-add-another-icon`)} />
                    <Text {...elementProps(`native-registrar-add-another-text`)} style={styles.secondaryText}>
                      {`Add another domain`}
                    </Text>
                  </Pressable>
                </View>
              )}
              {state.step === 2 && (
                <View {...elementProps(`native-registrar-setup-review`)} style={styles.group}>
                  <Text {...elementProps(`native-registrar-review-intro`)} style={styles.description}>
                    {`Save ${state.review.length} domain(s) from ${state.registrar} to ${state.owner}. Check the details before finishing.`}
                  </Text>
                  {state.review.map((domain, index) => (
                    <View key={domain.name} {...elementProps(`native-registrar-review-domain`, String(index))} style={styles.guide}>
                      <Text {...elementProps(`native-registrar-review-name`, String(index))} style={styles.label}>
                        {domain.name}
                      </Text>
                      <Text {...elementProps(`native-registrar-review-details`, String(index))} style={styles.description}>
                        {`Expiry ${domain.expiresAt} · ${formatCurrency(domain.renewalPrice)} / year`}
                      </Text>
                      <Text {...elementProps(`native-registrar-review-renew`, String(index))} style={styles.description}>
                        {`Auto-renew recorded as ${domain.autoRenew ? `on` : `off`}`}
                      </Text>
                    </View>
                  ))}
                  <Text {...elementProps(`native-registrar-review-storage`)} style={styles.description}>
                    {`These records are saved on this device. Future registrar changes must be imported or entered again.`}
                  </Text>
                </View>
              )}
            </ScrollView>
            <View {...elementProps(`native-registrar-setup-footer`)} style={styles.footer}>
              {state.step > 0 && (
                <Pressable
                  disabled={busy}
                  onPress={state.back}
                  style={styles.secondaryButton}
                  accessibilityRole={`button`}
                  accessibilityLabel={`Previous Step`}
                  {...elementProps(`native-registrar-setup-back`)}
                >
                  <ArrowLeft size={15} color={palette.ink} {...elementProps(`native-registrar-setup-back-icon`)} />
                  <Text {...elementProps(`native-registrar-setup-back-text`)} style={styles.secondaryText}>
                    {`Back`}
                  </Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole={`button`}
                onPress={state.step === 2 ? state.submit : state.next}
                disabled={busy || (state.step === 0 && !state.registrar)}
                {...elementProps(`native-registrar-setup-continue`)}
                style={[styles.primaryButton, (busy || (state.step === 0 && !state.registrar)) && styles.disabled]}
                accessibilityLabel={state.step === 2 ? `Save Domains` : state.step === 1 ? `Review Domains` : `Continue`}
              >
                {state.saving
                  ? <ActivityIndicator size={`small`} color={palette.contrast} {...elementProps(`native-registrar-setup-saving`)} />
                  : <Check size={15} color={palette.contrast} {...elementProps(`native-registrar-setup-continue-icon`)} />}
                <Text {...elementProps(`native-registrar-setup-continue-text`)} style={styles.primaryText}>
                  {state.saving ? `Saving…` : state.step === 2 ? `Save Domains` : state.step === 1 ? `Review Domains` : `Continue`}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default RegistrarSetup;
