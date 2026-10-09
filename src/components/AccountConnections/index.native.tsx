import Toast from '../Toast';
import { Link } from 'expo-router';
import { useMemo, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import ConnectionsInputGuide from '../ConnectionsInputGuide';
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
import { Eye, Plus, Save, EyeOff, Trash2, Globe2, UserPlus, LogIn, ShieldCheck } from 'lucide-react-native';

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
  useEffect(() => { onBusyChange?.(disabled); }, [disabled, onBusyChange]);
  useEffect(() => () => { onBusyChange?.(false); }, [onBusyChange]);
  const handleTabKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (![`Home`, `End`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`].includes(event.key)) return;
    event.preventDefault();
    const count = state.fields.length;
    const nextIndex = event.key === `Home` ? 0 : event.key === `End` ? count - 1
      : (index + ([`ArrowDown`, `ArrowRight`].includes(event.key) ? 1 : -1) + count) % count;
    const field = state.fields[nextIndex];
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
            {state.fields.map((field, index) => {
              const selected = state.activeProvider === field.id;
              const providerScope = `${scope}-${field.id}`;
              return (
                <Pressable
                  key={field.id}
                  {...elementProps(`connection-tab`, providerScope)}
                  {...(Platform.OS === `web` ? {
                    tabIndex: selected ? 0 as const : -1 as const,
                    'aria-controls': `connection-provider-${providerScope}`,
                    onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleTabKeyDown(event, index),
                  } : {})}
                  accessibilityRole={`tab`}
                  accessibilityLabel={field.label}
                  onPress={() => state.selectProvider(field.id)}
                  accessibilityState={{ selected }}
                  style={[styles.tab, selected && styles.activeTab]}
                >
                  <Globe2 {...elementProps(`connection-tab-icon`, providerScope)} size={15} color={selected ? palette.accent : palette.muted} />
                  <Text {...elementProps(`connection-tab-text`, providerScope)} style={[styles.tabText, selected && styles.activeTabText]}>
                    {field.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ConnectionsInputGuide scope={scope} />
        </View>
        <View {...elementProps(`connections-content`, scope)} style={styles.content}>
          {state.fields.map(field => {
            const selected = state.activeProvider === field.id;
            const accounts = state.accounts.filter(account => account.provider === field.id);
            const providerScope = `${scope}-${field.id}`;
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
                  {(field.id === `godaddy` || field.id === `hostinger` || field.id === `vercel` || field.id === `squarespace`) && (
                    <Pressable
                      {...elementProps(`connection-add`, providerScope)}
                      disabled={disabled}
                      accessibilityRole={`button`}
                      onPress={() => state.add(field.id)}
                      style={[styles.button, disabled && styles.disabled]}
                      accessibilityLabel={`Add Another ${field.label} Connection`}
                    >
                      <Plus {...elementProps(`connection-add-icon`, providerScope)} size={15} color={palette.accent} />
                      <Text {...elementProps(`connection-add-text`, providerScope)} style={styles.buttonText}>{`Add Connection`}</Text>
                    </Pressable>
                  )}
                </View>
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
                        {connectionInputSections(field.id).map(section => {
                          const sectionScope = `${accountScope}-${section.id}`;
                          return (
                            <View
                              key={section.id}
                              {...elementProps(`connection-input-section`, sectionScope)}
                              {...(Platform.OS === `web` ? { dataSet: { class: `connection-input-section`, 'key-count': `${section.keys.length}` } } : {})}
                              style={styles.field}
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
                                  <View key={key} {...elementProps(`connection-key-field`, inputScope)} style={styles.field}>
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
                        <View {...elementProps(`connection-account-actions`, accountScope)} style={styles.row}>
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
                          {(!!account.number || accounts.length > 1 || !!account.values.trim()) && (
                            <Pressable
                              {...elementProps(`connection-remove`, accountScope)}
                              disabled={disabled}
                              accessibilityRole={`button`}
                              onPress={() => void state.remove(account.id)}
                              style={[styles.button, disabled && styles.disabled]}
                              accessibilityLabel={`Remove ${field.label} Connection ${index + 1}`}
                            >
                              <Trash2 {...elementProps(`connection-remove-icon`, accountScope)} size={16} color={palette.danger} />
                              <Text {...elementProps(`connection-remove-text`, accountScope)} style={styles.buttonText}>{`Remove`}</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          {(!embedded || state.accounts.length > 1) && (
            <View {...elementProps(`connections-actions`, scope)} style={styles.row}>
              <Pressable {...elementProps(`connections-save`, scope)} style={[styles.button, styles.primary, disabled && styles.disabled]} disabled={disabled} onPress={() => void state.save()}>
                {state.busy
                  ? <ActivityIndicator {...elementProps(`connections-save-spinner`, scope)} size={`small`} color={palette.contrast} />
                  : <Save {...elementProps(`connections-save-icon`, scope)} size={16} color={palette.contrast} />}
                <Text {...elementProps(`connections-save-text`, scope)} style={[styles.buttonText, styles.primaryText]}>{state.busy ? state.syncing ? `Checking Domains…` : `Saving…` : `Save All Connections`}</Text>
              </Pressable>
              <Pressable {...elementProps(`connections-clear`, scope)} style={[styles.button, disabled && styles.disabled]} disabled={disabled} onPress={() => void state.clear()}>
                <Trash2 {...elementProps(`connections-clear-icon`, scope)} size={16} color={palette.danger} />
                <Text {...elementProps(`connections-clear-text`, scope)} style={styles.buttonText}>{`Remove Saved Connections`}</Text>
              </Pressable>
            </View>
          )}
          <View {...elementProps(`connections-private-note`, scope)} style={styles.note}>
            <ShieldCheck {...elementProps(`connections-private-icon`, scope)} size={16} color={palette.accent} />
            <Text {...elementProps(`connections-private-copy`, scope)} style={styles.noteText}>{`Values stay in your private account settings and are sent through the app's server to the selected registrar for read-only domain checks. They never appear in public profiles, Community, or exports. Local storage is readable by someone with access to this device.`}</Text>
          </View>
        </View>
      </View>
      <Toast
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
    </View>
  );
};

export default AccountConnections;
