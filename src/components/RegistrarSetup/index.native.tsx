import { File } from 'expo-file-system';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import AccountConnections from '../AccountConnections';
import * as DocumentPicker from 'expo-document-picker';
import { useRegistrarSetup } from './useRegistrarSetup';
import { elementProps } from '../../shared/elementProps';
import { formatCurrency } from '../../shared/domainUtils';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Link2, LogIn, Pencil, Upload, Download, UserPlus, FileDown } from 'lucide-react-native';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

interface RegistrarSetupProps {
  onClose: () => void;
  onManual?: () => void;
}

const RegistrarSetup = ({ onClose, onManual }: RegistrarSetupProps) => {
  const auth = useAuth();
  const router = useRouter();
  const state = useRegistrarSetup(onClose);
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [readingCsv, setReadingCsv] = useState(false);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const busy = state.saving || state.exporting || readingCsv || connectionBusy;
  const connecting = state.entryTab === `connect`;
  const close = () => { if (!busy) state.close(); };
  const addManually = () => {
    if (busy || !onManual) return;
    state.close();
    onManual();
  };
  const authenticate = (pathname: `/signin` | `/signup`) => {
    if (busy || auth.busy || auth.loading) return;
    state.close();
    router.push({ pathname, params: { returnTo: routes.connections.href } });
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
  const saveDisabled = busy || (!connecting && !state.canReview);
  const saveLabel = state.saving ? `Saving…` : connecting ? `Done` : `Save Domains`;

  return (
    <Modal visible transparent animationType={`fade`} onRequestClose={close}>
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
            accessibilityViewIsModal
            {...elementProps(`native-registrar-setup-dialog`)}
            style={[styles.dialog, width >= 900 && styles.wideDialog]}
          >
            <View {...elementProps(`native-registrar-setup-header`)} style={styles.header}>
              <View {...elementProps(`native-registrar-setup-heading`)} style={styles.heading}>
                <Text {...elementProps(`native-registrar-setup-eyebrow`)} style={styles.eyebrow}>{`YOUR REGISTRAR, YOUR DOMAINS`}</Text>
                <Text style={styles.title} accessibilityRole={`header`} {...elementProps(`native-registrar-setup-title`)}>{`Add Domain`}</Text>
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
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps={`handled`}
              contentContainerStyle={styles.content}
              {...elementProps(`native-registrar-setup-content`)}
            >
              {!!state.error && (
                <Text style={styles.error} accessibilityRole={`alert`} {...elementProps(`native-registrar-setup-error`)}>{state.error}</Text>
              )}
              <View {...elementProps(`native-registrar-entry-tabs`)} style={styles.tabs} accessibilityRole={`tablist`} accessibilityLabel={`Add Domains Method`}>
                {([`connect`, `csv`] as const).map(tab => {
                  const selected = state.entryTab === tab;
                  const TabIcon = tab === `connect` ? Link2 : Upload;
                  return (
                    <Pressable
                      key={tab}
                      disabled={busy}
                      accessibilityRole={`tab`}
                      accessibilityState={{ selected, disabled: busy }}
                      onPress={() => state.setEntryTab(tab)}
                      {...elementProps(`native-registrar-entry-tab`, tab)}
                      style={[styles.tab, selected && styles.activeTab, busy && styles.disabled]}
                    >
                      <TabIcon size={15} color={selected ? palette.accent : palette.muted} {...elementProps(`native-registrar-entry-tab-icon`, tab)} />
                      <Text {...elementProps(`native-registrar-entry-tab-text`, tab)} style={[styles.tabText, selected && styles.activeTabText]}>
                        {tab === `connect` ? `Connect Registrars` : `Import / Export CSV`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {connecting ? (
                <View {...elementProps(`native-registrar-connect-panel`)} style={styles.group}>
                  <Text {...elementProps(`native-registrar-connect-recommended`)} style={styles.recommended}>{`RECOMMENDED`}</Text>
                  <Text {...elementProps(`native-registrar-connect-description`)} style={styles.description}>
                    {`Connect your registrars to import domains automatically and keep your portfolio synced. Manage all your private connections together, just like in your profile.`}
                  </Text>
                  {auth.loading ? (
                    <ActivityIndicator size={`small`} color={palette.accent} {...elementProps(`native-registrar-auth-loading`)} />
                  ) : auth.user ? (
                    <AccountConnections
                      embedded
                      key={auth.user.id}
                      onBusyChange={setConnectionBusy}
                      scope={`native-registrar-setup-connections`}
                    />
                  ) : (
                    <View {...elementProps(`native-registrar-auth-prompt`)} style={styles.guide}>
                      <Text {...elementProps(`native-registrar-auth-prompt-title`)} style={styles.label}>{`Sign Up To Connect Registrars`}</Text>
                      <Text {...elementProps(`native-registrar-auth-prompt-copy`)} style={styles.description}>
                        {`Create an account to save your private registrar connections and sync your domains. Already have an account? Sign in to continue.`}
                      </Text>
                      <View {...elementProps(`native-registrar-auth-actions`)} style={styles.actions}>
                        <Pressable disabled={auth.busy} onPress={() => authenticate(`/signup`)} style={[styles.primaryButton, auth.busy && styles.disabled]} accessibilityRole={`link`} {...elementProps(`native-registrar-signup`)}>
                          <UserPlus size={15} color={palette.contrast} {...elementProps(`native-registrar-signup-icon`)} />
                          <Text {...elementProps(`native-registrar-signup-text`)} style={styles.primaryText}>{`Sign Up`}</Text>
                        </Pressable>
                        <Pressable disabled={auth.busy} onPress={() => authenticate(`/signin`)} style={[styles.secondaryButton, auth.busy && styles.disabled]} accessibilityRole={`link`} {...elementProps(`native-registrar-signin`)}>
                          <LogIn size={15} color={palette.ink} {...elementProps(`native-registrar-signin-icon`)} />
                          <Text {...elementProps(`native-registrar-signin-text`)} style={styles.secondaryText}>{`Sign In`}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View {...elementProps(`native-registrar-csv-panel`)} style={styles.group}>
                  <View {...elementProps(`native-registrar-csv-guide`)} style={styles.guide}>
                    <Text {...elementProps(`native-registrar-csv-guide-title`)} style={styles.label}>{`Import Domain Records`}</Text>
                    <Text {...elementProps(`native-registrar-csv-description`)} style={styles.description}>
                      {`Export a CSV from any registrar account, or use our template. Upload it here, review the records below, then save. One CSV can include multiple registrars. Export CSV downloads your full portfolio.`}
                    </Text>
                  </View>
                  <View {...elementProps(`native-registrar-csv-actions`)} style={styles.actions}>
                    <Pressable disabled={busy} onPress={() => void importCsv()} style={[styles.secondaryButton, busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Import Registrar CSV`} {...elementProps(`native-registrar-import-csv`)}>
                      <Upload size={15} color={palette.ink} {...elementProps(`native-registrar-import-icon`)} />
                      <Text {...elementProps(`native-registrar-import-text`)} style={styles.secondaryText}>{readingCsv ? `Reading CSV…` : `Import CSV`}</Text>
                    </Pressable>
                    <Pressable disabled={busy || !state.canExport} onPress={() => void state.exportCsv()} style={[styles.secondaryButton, (busy || !state.canExport) && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Export Portfolio CSV`} {...elementProps(`native-registrar-export-csv`)}>
                      <Download size={15} color={palette.ink} {...elementProps(`native-registrar-export-icon`)} />
                      <Text {...elementProps(`native-registrar-export-text`)} style={styles.secondaryText}>{`Export CSV`}</Text>
                    </Pressable>
                    <Pressable disabled={busy} onPress={() => void state.downloadTemplate()} style={[styles.secondaryButton, busy && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={`Download Domain CSV Template`} {...elementProps(`native-registrar-csv-template`)}>
                      <FileDown size={15} color={palette.ink} {...elementProps(`native-registrar-csv-template-icon`)} />
                      <Text {...elementProps(`native-registrar-csv-template-text`)} style={styles.secondaryText}>{`CSV Template`}</Text>
                    </Pressable>
                  </View>
                  {!!state.csvNotice && <Text {...elementProps(`native-registrar-csv-notice`)} style={styles.success} accessibilityLiveRegion={`polite`}>{state.csvNotice}</Text>}
                  {state.review.map((domain, index) => (
                    <View key={domain.name} {...elementProps(`native-registrar-review-domain`, String(index))} style={styles.guide}>
                      <Text {...elementProps(`native-registrar-review-name`, String(index))} style={styles.label}>{`${index + 1}. ${domain.name}`}</Text>
                      <Text {...elementProps(`native-registrar-review-details`, String(index))} style={styles.description}>{`${domain.registrar} · Expiry ${domain.expiresAt || `Not Set`} · ${formatCurrency(domain.renewalPrice)} / year`}</Text>
                      <Text {...elementProps(`native-registrar-review-renew`, String(index))} style={styles.description}>{`Auto-renew recorded as ${domain.autoRenew ? `on` : `off`}`}</Text>
                    </View>
                  ))}
                  {!!state.review.length && (
                    <Text {...elementProps(`native-registrar-review-storage`)} style={styles.description}>
                      {`Imported records are saved on this device. Connect your registrars for automatic syncing.`}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
            <View {...elementProps(`native-registrar-setup-footer`)} style={styles.footer}>
              {onManual && (
                <Pressable disabled={busy} onPress={addManually} style={[styles.textButton, busy && styles.disabled]} accessibilityRole={`button`} {...elementProps(`native-registrar-setup-manual`)}>
                  <Pencil size={15} color={palette.accent} {...elementProps(`native-registrar-setup-manual-icon`)} />
                  <Text {...elementProps(`native-registrar-setup-manual-text`)} style={styles.linkText}>{`Add Manually`}</Text>
                </Pressable>
              )}
              <Pressable
                disabled={saveDisabled}
                accessibilityRole={`button`}
                accessibilityLabel={saveLabel}
                {...elementProps(`native-registrar-setup-save`)}
                style={[styles.primaryButton, saveDisabled && styles.disabled]}
                onPress={connecting ? close : () => void state.submit()}
              >
                {state.saving
                  ? <ActivityIndicator size={`small`} color={palette.contrast} {...elementProps(`native-registrar-setup-saving`)} />
                  : <Check size={15} color={palette.contrast} {...elementProps(`native-registrar-setup-save-icon`)} />}
                <Text {...elementProps(`native-registrar-setup-save-text`)} style={styles.primaryText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default RegistrarSetup;
