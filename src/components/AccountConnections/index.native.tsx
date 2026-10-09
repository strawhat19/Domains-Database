import Toast from '../Toast';
import { Link } from 'expo-router';
import ToastStack from '../ToastStack';
import { useMemo, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { useLocalStorage } from '../../shared/config';
import ConnectionsInputGuide from '../ConnectionsInputGuide';
import EnvironmentFileDropZone from '../EnvironmentFileDropZone';
import ConnectionEnvironmentImport from '../ConnectionEnvironmentImport';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAccountConnections } from './useAccountConnections';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { Pressable, Text, TextInput, View, Platform, ActivityIndicator } from 'react-native';
import type { AccountConnectionsProps } from '../../shared/connections/types';
import {
  connectionEnvGuidance,
  connectionInputFields,
  supportsRegistrarSync,
  connectionInputSections,
  connectionEnvInstructions,
  connectionInputInstructions,
} from '../../shared/connections/inputs';
import { Eye, Plus, Save, EyeOff, Globe2, FileKey2, UserPlus, LogIn, RotateCcw, ShieldCheck, LockKeyhole } from 'lucide-react-native';

interface ConnectionInputProps {
  busy: boolean;
  value: string;
  label: string;
  fieldId: string;
  description: string;
  descriptionIds: string;
  loading: boolean;
  revealed: boolean;
  palette: ThemePalette;
  placeholder: string;
  onToggle: () => void;
  onChange: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}

const ConnectionInput = ({ busy, value, label, fieldId, styles, palette, loading, revealed, placeholder, description, descriptionIds, onChange, onToggle }: ConnectionInputProps) => {
  const RevealIcon = revealed ? EyeOff : Eye;
  const disabled = busy || loading || !value.trim();
  return (
    <View {...elementProps(`connection-input-wrap`, fieldId)} style={styles.inputWrap}>
      {loading ? <View {...elementProps(`connection-skeleton`, fieldId)} style={styles.skeleton} /> : (
        <TextInput
          {...elementProps(`connection-input`, fieldId)}
          {...(Platform.OS === `web` ? { 'aria-describedby': descriptionIds } : {})}
          style={styles.input}
          autoCorrect={false}
          autoComplete={`off`}
          autoCapitalize={`none`}
          multiline={false}
          editable={!busy && revealed}
          value={value}
          secureTextEntry={!revealed}
          placeholder={placeholder}
          accessibilityLabel={label}
          accessibilityHint={description}
          placeholderTextColor={palette.placeholder}
          onChangeText={onChange}
        />
      )}
      <Pressable
        {...elementProps(`connection-reveal`, fieldId)}
        {...(Platform.OS === `web` ? { 'aria-pressed': revealed } : {})}
        disabled={disabled}
        onPress={onToggle}
        accessibilityRole={`button`}
        style={[styles.revealButton, disabled && styles.disabled]}
        accessibilityState={{ disabled }}
        accessibilityLabel={`${revealed ? `Hide` : `Show`} ${label}`}
      >
        <RevealIcon {...elementProps(`connection-reveal-icon`, fieldId)} size={18} color={palette.muted} />
      </Pressable>
    </View>
  );
};

const AccountConnections = ({ scope = `profile-connections`, embedded = false, providers, onBusyChange }: AccountConnectionsProps) => {
  const state = useAccountConnections({ providers });
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = state.busy || state.loading || state.syncing;
  const importDisabled = disabled;
  useEffect(() => { onBusyChange?.(disabled); }, [disabled, onBusyChange]);
  useEffect(() => () => { onBusyChange?.(false); }, [onBusyChange]);
  const handleTabKeyDown = (event: KeyboardEvent<HTMLElement>, provider: string) => {
    if (![`Home`, `End`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`].includes(event.key)) return;
    event.preventDefault();
    const tabs = state.tabs.filter(tab => !tab.locked);
    const count = tabs.length;
    if (!count) return;
    const index = tabs.findIndex(tab => tab.id === provider);
    const nextIndex = event.key === `Home` ? 0 : event.key === `End` ? count - 1
      : (index + ([`ArrowDown`, `ArrowRight`].includes(event.key) ? 1 : -1) + count) % count;
    const field = tabs[nextIndex];
    if (!field) return;
    state.selectProvider(field.id);
    document.getElementById(`connection-tab-${scope}-${field.id}`)?.focus();
  };
  if (!state.signedIn) return (
    <View {...elementProps(`connections-signup-prompt`, scope)} style={styles.field}>
      <Text {...elementProps(`connections-signup-title`, scope)} style={styles.title}>{`Sign Up To Connect Registrars`}</Text>
      <Text {...elementProps(`connections-signup-copy`, scope)} style={styles.copy}>{`Create an account to securely manage your registrar connections and sync your domains.`}</Text>
      <View {...elementProps(`connections-signup-actions`, scope)} style={styles.row}>
        <Link asChild href={routes.signup.href}>
          <Pressable {...elementProps(`connections-signup`, scope)} style={[styles.button, styles.primary]}>
            <UserPlus {...elementProps(`connections-signup-icon`, scope)} size={16} color={palette.contrast} />
            <Text {...elementProps(`connections-signup-text`, scope)} style={[styles.buttonText, styles.primaryText]}>{`Sign Up`}</Text>
          </Pressable>
        </Link>
        <Link asChild href={routes.signin.href}>
          <Pressable {...elementProps(`connections-signin`, scope)} style={styles.button}>
            <LogIn {...elementProps(`connections-signin-icon`, scope)} size={16} color={palette.ink} />
            <Text {...elementProps(`connections-signin-text`, scope)} style={styles.buttonText}>{`Sign In`}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
  return (
    <View
      {...elementProps(`account-connections`, scope)}
      {...(Platform.OS === `web` ? { dataSet: { class: `account-connections`, embedded: embedded ? `true` : `false` } } : {})}
      style={[styles.panel, embedded && styles.embedded]}
    >
      <View {...elementProps(`connections-layout`, scope)} style={styles.layout}>
        <View {...elementProps(`connections-sidebar`, scope)} style={styles.sidebar}>
          <View
            {...elementProps(`connection-tabs`, scope)}
            style={styles.tabs}
            accessibilityRole={`tablist`}
            accessibilityLabel={`Registrar Connectors`}
          >
            {state.tabs.map(field => {
              const selected = state.activeProvider === field.id;
              const providerScope = `${scope}-${field.id}`;
              return (
                <Pressable
                  key={field.id}
                  disabled={field.locked}
                  {...elementProps(`connection-tab`, providerScope)}
                  {...(Platform.OS === `web` ? {
                    tabIndex: selected ? 0 as const : -1 as const,
                    ...(field.available ? { 'aria-controls': `connection-provider-${providerScope}` } : {}),
                    title: !field.available ? `${field.label} — Coming Soon${field.pro ? ` On Pro Plan` : ``}` : field.pro ? `On Pro Plan` : undefined,
                    onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleTabKeyDown(event, field.id),
                  } : {})}
                  accessibilityRole={`tab`}
                  accessibilityLabel={`${field.label}${field.pro ? `, On Pro Plan` : ``}`}
                  accessibilityHint={!field.available ? `Connection Setup Coming Soon` : field.locked ? `Requires The Pro Plan` : undefined}
                  onPress={() => state.selectProvider(field.id)}
                  accessibilityState={{ selected, disabled: field.locked }}
                  style={[styles.tab, selected && styles.activeTab, field.locked && styles.lockedTab]}
                >
                  <Globe2 {...elementProps(`connection-tab-icon`, providerScope)} size={15} color={selected ? palette.accent : palette.muted} />
                  <Text {...elementProps(`connection-tab-text`, providerScope)} style={[styles.tabText, selected && styles.activeTabText]}>
                    {field.label}
                  </Text>
                  {field.pro && (
                    <View {...elementProps(`connection-pro-badge`, providerScope)} style={styles.proBadge}>
                      <LockKeyhole {...elementProps(`connection-pro-badge-icon`, providerScope)} size={11} color={palette.accent} />
                      <Text {...elementProps(`connection-pro-badge-text`, providerScope)} style={styles.proBadgeText}>{`On Pro Plan`}</Text>
                    </View>
                  )}
                  {!field.pro && !field.available && (
                    <View {...elementProps(`connection-coming-soon-badge`, providerScope)} style={styles.proBadge}>
                      <Text {...elementProps(`connection-coming-soon-badge-text`, providerScope)} style={styles.proBadgeText}>{`Coming Soon`}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          <ConnectionsInputGuide scope={scope} />
        </View>
        <View {...elementProps(`connections-content`, scope)} style={styles.content}>
          {!state.activeProvider && <Text {...elementProps(`connections-pro-required`, scope)} style={styles.copy}>{`These Registrar(s) Are Available On Pro Plan`}</Text>}
          {!embedded && (
            <View {...elementProps(`connections-environment-import`, scope)} style={styles.field}>
              <Text {...elementProps(`connections-import-env-copy`, scope)} style={styles.copy}>
                {`${Platform.OS === `web` ? `Drop or choose a .env file to fill the fields automatically. For pasted contents, use Load Keys` : `Paste your .env contents and use Load Keys`}. Review the fields, then choose Save All Connections or Save & Sync for one connection. Existing connections and edits are kept; duplicates are skipped.`}
              </Text>
            </View>
          )}
          {state.fields.map(field => {
            const selected = state.activeProvider === field.id;
            const accounts = state.accounts.filter(account => account.provider === field.id);
            const providerScope = `${scope}-${field.id}`;
            const addDisabled = disabled || !state.canAddConnection(field.id);
            const supportsMultipleConnections = [`vercel`, `godaddy`, `hostinger`, `squarespace`].includes(field.id);
            return (
              <View
                key={field.id}
                {...elementProps(`connection-provider`, providerScope)}
                {...(Platform.OS === `web` ? {
                  role: `tabpanel` as const,
                  inert: !selected,
                  'aria-hidden': !selected,
                  tabIndex: selected ? 0 as const : -1 as const,
                  'aria-labelledby': `connection-tab-${providerScope}`,
                } : {})}
                accessibilityElementsHidden={!selected}
                importantForAccessibility={selected ? `auto` : `no-hide-descendants`}
                style={[styles.provider, !selected && { display: `none` }]}
              >
                <View {...elementProps(`connection-provider-heading`, providerScope)} style={styles.row}>
                  <Text {...elementProps(`connection-provider-label`, providerScope)} style={styles.title}>{field.label}</Text>
                  {selected && state.syncing && (
                    <View
                      accessible
                      {...elementProps(`connections-sync-status`, scope)}
                      style={styles.syncStatus}
                      accessibilityRole={`progressbar`}
                      accessibilityLiveRegion={`polite`}
                      accessibilityState={{ busy: true }}
                      accessibilityLabel={`Syncing Domains…`}
                    >
                      <ActivityIndicator {...elementProps(`connections-sync-spinner`, scope)} size={`small`} color={palette.accent} />
                      <Text {...elementProps(`connections-sync-text`, scope)} style={styles.copy}>{`Syncing Domains…`}</Text>
                    </View>
                  )}
                  {(!embedded || supportsMultipleConnections) && (
                    <View {...elementProps(`connection-provider-actions`, providerScope)} style={styles.providerActions}>
                      {!embedded && (
                        <EnvironmentFileDropZone
                          kind={`button`}
                          scope={providerScope}
                          disabled={importDisabled}
                          onFiles={files => void state.readEnvironmentFiles(files)}
                        >
                          <Pressable
                            disabled={importDisabled}
                            accessibilityRole={`button`}
                            onPress={state.openImport}
                            {...elementProps(`connections-import-env`, providerScope)}
                            style={[styles.button, importDisabled && styles.disabled]}
                            accessibilityLabel={`Import Registrar Keys From .env`}
                            accessibilityHint={Platform.OS === `web` ? `Choose A File Or Drop A .env File Here` : `Paste .env Contents To Load Registrar Keys`}
                            accessibilityState={{ expanded: state.importOpen, disabled: importDisabled, busy: state.importing || state.readingFile }}
                            {...(Platform.OS === `web` ? { 'aria-controls': `connection-env-panel-${providerScope}` } : {})}
                          >
                            {state.importing || state.readingFile
                              ? <ActivityIndicator {...elementProps(`connections-import-env-spinner`, providerScope)} size={`small`} color={palette.accent} />
                              : <FileKey2 {...elementProps(`connections-import-env-icon`, providerScope)} size={16} color={palette.accent} />}
                            <Text {...elementProps(`connections-import-env-text`, providerScope)} style={styles.buttonText}>
                              {state.importing ? `Importing…` : state.readingFile ? `Reading File…` : `Import From .env`}
                            </Text>
                          </Pressable>
                        </EnvironmentFileDropZone>
                      )}
                      {supportsMultipleConnections && (
                        <Pressable
                          {...elementProps(`connection-add`, providerScope)}
                          disabled={addDisabled}
                          accessibilityRole={`button`}
                          onPress={() => state.add(field.id)}
                          style={[styles.button, addDisabled && styles.disabled]}
                          accessibilityState={{ disabled: addDisabled }}
                          accessibilityLabel={`Add Another ${field.label} Connection`}
                          accessibilityHint={!state.canAddConnection(field.id) ? `Save At Least One Key For A ${field.label} Connection First` : undefined}
                        >
                          <Plus {...elementProps(`connection-add-icon`, providerScope)} size={15} color={palette.accent} />
                          <Text {...elementProps(`connection-add-text`, providerScope)} style={styles.buttonText}>{`Add Connection`}</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
                {!embedded && selected && state.importOpen && (
                  <ConnectionEnvironmentImport
                    scope={providerScope}
                    disabled={disabled}
                    reading={state.readingFile}
                    contents={state.importText}
                    error={state.importError}
                    onClose={state.closeImport}
                    onLoad={state.loadImportText}
                    onChange={state.changeImportText}
                    canImportServer={state.canImportServer}
                    onFiles={files => void state.readEnvironmentFiles(files)}
                    onServer={() => { state.closeImport(); void state.importServerEnvironment(); }}
                  />
                )}
                {field.id === `squarespace` && (
                  <View {...elementProps(`connection-access-links`, providerScope)} style={styles.row}>
                    {[
                      { id: `account`, label: `Open Squarespace`, href: `https://account.squarespace.com/domains` },
                      { id: `oauth`, label: `Developer Apps`, href: `https://account.squarespace.com/developer-apps` },
                      { id: `api`, label: `Reseller API Access`, href: `https://developers.squarespace.com/reseller/api-fundamentals` },
                    ].map(link => (
                      <Link asChild key={link.id} target={`_blank`} rel={`noopener noreferrer`} href={link.href}>
                        <Pressable
                          {...elementProps(`connection-access-link`, `${providerScope}-${link.id}`)}
                          {...(Platform.OS === `web` ? { hrefAttrs: { target: `_blank`, rel: `noopener noreferrer` } } : {})}
                          style={styles.button}
                          accessibilityRole={`link`}
                          accessibilityLabel={`${link.label} — Opens In A New Tab Or Browser`}
                        >
                          <Globe2 {...elementProps(`connection-access-icon`, `${providerScope}-${link.id}`)} size={15} color={palette.accent} />
                          <Text {...elementProps(`connection-access-text`, `${providerScope}-${link.id}`)} style={styles.buttonText}>
                            {link.label}
                          </Text>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                )}
                {state.loading && <View {...elementProps(`connection-skeleton`, providerScope)} style={styles.skeleton} />}
                <View
                  {...elementProps(`connection-accounts`, providerScope)}
                  {...(Platform.OS === `web` ? { dataSet: { class: `connection-accounts`, count: `${accounts.length}` } } : {})}
                  style={styles.accounts}
                >
                  {accounts.map((account, index) => {
                    const accountScope = `${scope}-${account.id}`;
                    const status = state.accountStatuses[account.id];
                    return (
                      <View key={account.id} {...elementProps(`connection-field`, accountScope)} style={styles.account}>
                        <View {...elementProps(`connection-account-heading`, accountScope)} style={styles.row}>
                          <Text {...elementProps(`connection-account-title`, accountScope)} style={styles.label}>{`${field.label} Connection ${index + 1}`}</Text>
                        </View>
                        {connectionInputSections(field.id, !!state.inputValue(account, `HOSTINGER_EXTERNAL_DOMAINS`).trim()).map(section => {
                          const sectionScope = `${accountScope}-${section.id}`;
                          return (
                            <View
                              key={section.id}
                              {...elementProps(`connection-input-section`, sectionScope)}
                              {...(Platform.OS === `web` ? { dataSet: { class: `connection-input-section`, 'key-count': `${section.keys.length}` } } : {})}
                              style={styles.inputSection}
                            >
                              {!!section.label && (
                                <Text {...elementProps(`connection-input-section-title`, sectionScope)} style={styles.label}>
                                  {section.label}
                                </Text>
                              )}
                              {!!section.hint && (
                                <Text {...elementProps(`connection-hint`, sectionScope)} style={styles.copy}>
                                  {section.hint}
                                </Text>
                              )}
                              {section.keys.map(key => {
                                const input = connectionInputFields[key];
                                const environment = connectionEnvGuidance(key);
                                const inputScope = `${accountScope}-${key.toLowerCase().replace(/_/g, `-`)}`;
                                return (
                                  <View key={key} {...elementProps(`connection-key-field`, inputScope)} style={styles.keyField}>
                                    <View {...elementProps(`connection-field-row`, inputScope)} style={styles.keyRow}>
                                      <View {...elementProps(`connection-input-column`, inputScope)} style={styles.inputColumn}>
                                        <Text {...elementProps(`connection-label`, inputScope)} style={styles.label}>
                                          {input.label}
                                        </Text>
                                        <ConnectionInput
                                          styles={styles}
                                          palette={palette}
                                          busy={disabled}
                                          fieldId={inputScope}
                                          loading={state.loading}
                                          placeholder={input.placeholder}
                                          label={`${field.label} ${input.label}`}
                                          value={state.inputValue(account, key)}
                                          revealed={state.isVisible(account, key)}
                                          description={`${connectionInputInstructions} ${input.format} Example (fake): ${input.example}. ${connectionEnvInstructions} .env Example (Fake): ${environment.assignment}. ${environment.note} ${input.hint ?? ``}`}
                                          descriptionIds={[
                                            `connections-input-instructions-${scope}`,
                                            `connections-env-instructions-${scope}`,
                                            `connection-format-${inputScope}`,
                                            `connection-example-${inputScope}`,
                                            `connection-env-example-${inputScope}`,
                                            `connection-env-note-${inputScope}`,
                                            ...(input.hint ? [`connection-hint-${inputScope}`] : []),
                                          ].join(` `)}
                                          onToggle={() => state.toggleVisibility(account, key)}
                                          onChange={value => state.change(account.id, key, value)}
                                        />
                                      </View>
                                      <View {...elementProps(`connection-format-help`, inputScope)} style={styles.formatHelp}>
                                        <Text {...elementProps(`connection-format`, inputScope)} style={styles.copy}>
                                          {`Format: ${input.format}`}
                                        </Text>
                                        <Text {...elementProps(`connection-example`, inputScope)} style={styles.example}>
                                          {`Example (Fake): ${input.example}`}
                                        </Text>
                                        <Text {...elementProps(`connection-env-example`, inputScope)} style={styles.example}>
                                          {`.env Example (Fake): ${environment.assignment}`}
                                        </Text>
                                        <Text {...elementProps(`connection-env-note`, inputScope)} style={styles.copy}>
                                          {environment.note}
                                        </Text>
                                        {!!input.hint && (
                                          <Text {...elementProps(`connection-hint`, inputScope)} style={styles.copy}>
                                            {input.hint}
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })}
                        <Text {...elementProps(`connection-hint`, accountScope)} style={styles.copy}>{field.hint}</Text>
                        {field.id === `vercel` && (
                          <Link asChild target={`_blank`} rel={`noopener noreferrer`} href={`https://vercel.com/account/settings/tokens`}>
                            <Pressable
                              {...elementProps(`connection-token-link`, accountScope)}
                              {...(Platform.OS === `web` ? { hrefAttrs: { target: `_blank`, rel: `noopener noreferrer` } } : {})}
                              style={styles.button}
                              accessibilityRole={`link`}
                              accessibilityLabel={`Open Vercel Access Tokens`}
                            >
                              <Globe2 {...elementProps(`connection-token-icon`, accountScope)} size={15} color={palette.accent} />
                              <Text {...elementProps(`connection-token-text`, accountScope)} style={styles.buttonText}>{`API Tokens`}</Text>
                            </Pressable>
                          </Link>
                        )}
                        <View {...elementProps(`actionsCell`, accountScope)} style={styles.actionsCell}>
                          <View {...elementProps(`rowStatus`, accountScope)} style={styles.rowStatus}>
                            <View {...elementProps(`statusDotWrap`, accountScope)} style={styles.statusDotWrap}>
                              <View
                                {...elementProps(`statusDot`, accountScope)}
                                style={[styles.statusDot, { backgroundColor: status?.state === `connected`
                                  ? palette.success : status?.state === `error` ? palette.danger : palette.muted }]}
                              />
                            </View>
                            <Text {...elementProps(`statusText`, accountScope)} style={styles.statusText} accessibilityLiveRegion={`polite`}>
                              {status?.message ?? `Not Connected`}
                            </Text>
                          </View>
                        </View>
                        <View {...elementProps(`connection-account-actions`, accountScope)} style={[styles.row, styles.actionRow]}>
                          <Pressable
                            {...elementProps(`connection-reset`, accountScope)}
                            accessibilityRole={`button`}
                            onPress={() => state.clearForm(account.id)}
                            disabled={disabled || !state.hasFormValues(account.id)}
                            accessibilityHint={`Clears Form Fields And Keeps Saved Connections`}
                            accessibilityLabel={`Clear ${field.label} Connection ${index + 1} Form`}
                            style={[styles.button, styles.resetButton, (disabled || !state.hasFormValues(account.id)) && styles.disabled]}
                          >
                            <RotateCcw {...elementProps(`connection-reset-icon`, accountScope)} size={16} color={palette.muted} />
                            <Text {...elementProps(`connection-reset-text`, accountScope)} style={[styles.buttonText, styles.resetText]}>{`Clear Form`}</Text>
                          </Pressable>
                          <Pressable
                            {...elementProps(`connection-save`, accountScope)}
                            disabled={disabled}
                            accessibilityRole={`button`}
                            onPress={() => void state.save(account.id)}
                            style={[styles.button, styles.primary, disabled && styles.disabled]}
                          >
                            <Save {...elementProps(`connection-save-icon`, accountScope)} size={16} color={palette.contrast} />
                            <Text {...elementProps(`connection-save-text`, accountScope)} style={[styles.buttonText, styles.primaryText]}>
                              {!supportsRegistrarSync(account) ? `Save Credentials` : account.number ? `Save & Sync` : `Connect & Sync`}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          {(!embedded || state.accounts.length > 1) && (
            <View {...elementProps(`connections-actions`, scope)} style={[styles.row, styles.actionRow]}>
              <Pressable
                accessibilityRole={`button`}
                {...elementProps(`connections-reset`, scope)}
                onPress={() => state.clearForm()}
                disabled={disabled || !state.hasFormValues()}
                accessibilityHint={`Clears Form Fields And Keeps Saved Connections`}
                style={[styles.button, styles.resetButton, (disabled || !state.hasFormValues()) && styles.disabled]}
              >
                <RotateCcw {...elementProps(`connections-reset-icon`, scope)} size={16} color={palette.muted} />
                <Text {...elementProps(`connections-reset-text`, scope)} style={[styles.buttonText, styles.resetText]}>{`Clear All Forms`}</Text>
              </Pressable>
              <Pressable {...elementProps(`connections-save`, scope)} style={[styles.button, styles.primary, disabled && styles.disabled]} disabled={disabled} onPress={() => void state.save()}>
                {state.busy
                  ? <ActivityIndicator {...elementProps(`connections-save-spinner`, scope)} size={`small`} color={palette.contrast} />
                  : <Save {...elementProps(`connections-save-icon`, scope)} size={16} color={palette.contrast} />}
                <Text {...elementProps(`connections-save-text`, scope)} style={[styles.buttonText, styles.primaryText]}>{state.readingFile ? `Reading File…` : state.importing ? `Importing…` : state.busy ? state.syncing ? `Checking Domains…` : `Saving…` : `Save All Connections`}</Text>
              </Pressable>
            </View>
          )}
          <View {...elementProps(`connections-private-note`, scope)} style={styles.note}>
            <ShieldCheck {...elementProps(`connections-private-icon`, scope)} size={16} color={palette.accent} />
            <Text {...elementProps(`connections-private-copy`, scope)} style={styles.noteText}>{`Values stay in your private account settings and are sent through the app's server to the selected registrar for read-only domain checks. They never appear in public profiles, Community, or exports. ${useLocalStorage ? `Local storage is readable by someone with access to this device.` : `Firestore access is restricted to your account and trusted Owners.`}`}</Text>
          </View>
        </View>
      </View>
      <ToastStack scope={scope} notices={state.keyNotices} onDismiss={state.dismissKeyNotice}>
        {!!(state.error || state.notice) && (
          <Toast
            inline
            id={`${scope}-feedback`}
            onDismiss={state.dismiss}
            message={state.error || state.notice}
            kind={state.error ? `error` : `success`}
            action={state.showDomainsLink ? (
              <Link asChild href={routes.domains.href}>
                <Pressable
                  {...elementProps(`connections-view-domains`, scope)}
                  style={styles.viewDomainsButton}
                  accessibilityRole={`link`}
                  accessibilityLabel={`View Synced Domains`}
                >
                  <Globe2 {...elementProps(`connections-view-domains-icon`, scope)} size={16} color={palette.success} />
                  <Text {...elementProps(`connections-view-domains-text`, scope)} style={styles.viewDomainsText}>{`View Domains`}</Text>
                </Pressable>
              </Link>
            ) : undefined}
          />
        )}
      </ToastStack>
    </View>
  );
};

export default AccountConnections;
