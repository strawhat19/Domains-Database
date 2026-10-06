import Toast from '../Toast';
import { Link } from 'expo-router';
import { useMemo, useEffect } from 'react';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAccountConnections } from './useAccountConnections';
import type { ThemePalette } from '../../shared/themeContext/theme';
import type { RegistrarDomain } from '../../shared/registrarSync/types';
import { Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { connectionFields, type AccountConnectionsProps } from '../../shared/connections/types';
import { Eye, Plus, Save, EyeOff, Trash2, Globe2, UserPlus, LogIn, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

interface HostedDomainCandidateProps {
  scope: string;
  busy: boolean;
  including: boolean;
  palette: ThemePalette;
  domain: RegistrarDomain;
  onInclude: () => void;
  styles: ReturnType<typeof createStyles>;
}

interface ConnectionInputProps {
  busy: boolean;
  value: string;
  label: string;
  fieldId: string;
  loading: boolean;
  revealed: boolean;
  multiline?: boolean;
  palette: ThemePalette;
  placeholder: string;
  onToggle: () => void;
  onChange: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}

const ConnectionInput = ({ busy, value, label, fieldId, styles, palette, loading, revealed, placeholder, onChange, onToggle, multiline = true }: ConnectionInputProps) => {
  const RevealIcon = revealed ? EyeOff : Eye;
  const disabled = busy || loading || !value.trim();
  return (
    <View {...elementProps(`connection-input-wrap`, fieldId)} style={styles.inputWrap}>
      {loading ? <View {...elementProps(`connection-skeleton`, fieldId)} style={styles.skeleton} /> : (
        <TextInput
          {...elementProps(`connection-input`, fieldId)}
          style={styles.input}
          autoCorrect={false}
          autoComplete={`off`}
          autoCapitalize={`none`}
          multiline={multiline && revealed}
          editable={!busy && revealed}
          value={value}
          secureTextEntry={!revealed}
          placeholder={placeholder}
          accessibilityLabel={`${label} Connection Values`}
          placeholderTextColor={palette.placeholder}
          onChangeText={onChange}
        />
      )}
      <Pressable
        {...elementProps(`connection-reveal`, fieldId)}
        disabled={disabled}
        onPress={onToggle}
        accessibilityRole={`button`}
        style={[styles.revealButton, disabled && styles.disabled]}
        accessibilityState={{ disabled, checked: revealed }}
        accessibilityLabel={`${revealed ? `Hide` : `Show`} ${label} Values`}
      >
        <RevealIcon {...elementProps(`connection-reveal-icon`, fieldId)} size={18} color={palette.muted} />
      </Pressable>
    </View>
  );
};

const HostedDomainCandidate = ({ busy, scope, domain, styles, palette, including, onInclude }: HostedDomainCandidateProps) => {
  const domainId = `${scope}-${domain.name}`;
  const registrarName = typeof domain.meta?.registrarName === `string` ? domain.meta.registrarName : ``;
  const registrar = domain.registrar || registrarName || `Registrar Not Identified`;
  const source = typeof domain.meta?.registrarSource === `string` ? domain.meta.registrarSource : ``;
  return (
    <View {...elementProps(`hosted-domain-candidate`, domainId)} style={styles.candidateRow}>
      <View {...elementProps(`hosted-domain-copy`, domainId)} style={styles.candidateCopy}>
        <Text {...elementProps(`hosted-domain-name`, domainId)} style={styles.candidateName}>
          {domain.name}
        </Text>
        <Text {...elementProps(`hosted-domain-details`, domainId)} style={styles.candidateDetails}>
          {`Hostinger hosting · ${registrar === `Registrar Not Identified` ? registrar : `Registered with ${registrar}`}`}
        </Text>
        {!!source && (
          <Text {...elementProps(`hosted-domain-source`, domainId)} style={styles.candidateSource}>
            {source}
          </Text>
        )}
      </View>
      <Pressable
        {...elementProps(`hosted-domain-include`, domainId)}
        disabled={busy}
        onPress={onInclude}
        accessibilityRole={`button`}
        accessibilityState={{ disabled: busy, busy: including }}
        style={[styles.includeButton, busy && styles.disabled]}
        accessibilityLabel={`Confirm I Own ${domain.name} And Include It In My Portfolio`}
      >
        <CheckCircle2 {...elementProps(`hosted-domain-include-icon`, domainId)} size={15} color={palette.accent} />
        <Text {...elementProps(`hosted-domain-include-text`, domainId)} style={styles.includeText}>
          {including ? `Confirming…` : `Include My Domain`}
        </Text>
      </Pressable>
    </View>
  );
};

const AccountConnections = ({ scope = `profile-connections`, embedded = false, providers, onBusyChange }: AccountConnectionsProps) => {
  const state = useAccountConnections({ providers });
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = state.busy || state.loading || state.syncing;
  const fields = connectionFields.filter(field => !providers || providers.includes(field.id));
  useEffect(() => { onBusyChange?.(disabled); }, [disabled, onBusyChange]);
  useEffect(() => () => { onBusyChange?.(false); }, [onBusyChange]);
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
    <View {...elementProps(`account-connections`, scope)} style={[styles.panel, embedded && styles.embedded]}>
      <View {...elementProps(`connections-heading`, scope)} style={styles.row}>
        <Text {...elementProps(`connections-title`, scope)} style={styles.title}>{`Registrar Connections`}</Text>
      </View>
      <Text {...elementProps(`connections-description`, scope)} style={styles.copy}>
        {`Connect a registrar to sync its domains. Add separate GoDaddy, Hostinger, or Vercel accounts as needed. Saved connections are checked on sign-in and refresh after 2 hours and 24 minutes. Review external domains found through hosting before including them.`}
      </Text>
      {state.syncing && (
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
      {fields.map(field => {
        const accounts = state.accounts.filter(account => account.provider === field.id);
        const providerScope = `${scope}-${field.id}`;
        return (
          <View key={field.id} {...elementProps(`connection-provider`, providerScope)} style={styles.provider}>
            <View {...elementProps(`connection-provider-heading`, providerScope)} style={styles.row}>
              <Text {...elementProps(`connection-provider-label`, providerScope)} style={styles.title}>{field.label}</Text>
              {(field.id === `godaddy` || field.id === `hostinger` || field.id === `vercel`) && (
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
            {state.loading && <View {...elementProps(`connection-skeleton`, providerScope)} style={styles.skeleton} />}
            {accounts.map((account, index) => {
              const accountScope = `${scope}-${account.id}`;
              const status = state.accountStatuses[account.id];
              const discovered = state.discoveredDomains(account);
              return (
                <View key={account.id} {...elementProps(`connection-field`, accountScope)} style={styles.account}>
                  <View {...elementProps(`connection-account-heading`, accountScope)} style={styles.row}>
                    <Text {...elementProps(`connection-account-title`, accountScope)} style={styles.label}>{`${field.label} Connection ${index + 1}`}</Text>
                  </View>
                  <Text {...elementProps(`connection-label`, accountScope)} style={styles.label}>{`API Credentials`}</Text>
                  <ConnectionInput
                    styles={styles}
                    palette={palette}
                    busy={disabled}
                    label={field.label}
                    loading={state.loading}
                    fieldId={accountScope}
                    placeholder={field.placeholder}
                    value={state.inputValue(account)}
                    revealed={state.isVisible(account)}
                    onToggle={() => state.toggleVisibility(account)}
                    onChange={value => state.change(account.id, value)}
                  />
                  <Text {...elementProps(`connection-hint`, accountScope)} style={styles.copy}>{field.hint}</Text>
                  {field.id === `vercel` && (
                    <Link asChild target={`_blank`} rel={`noopener noreferrer`} href={`https://vercel.com/account/settings/tokens`}>
                      <Pressable
                        {...elementProps(`connection-token-link`, accountScope)}
                        style={styles.button}
                        accessibilityRole={`link`}
                        accessibilityLabel={`Open Vercel Access Tokens`}
                      >
                        <Globe2 {...elementProps(`connection-token-icon`, accountScope)} size={15} color={palette.accent} />
                        <Text {...elementProps(`connection-token-text`, accountScope)} style={styles.buttonText}>{`API Tokens`}</Text>
                      </Pressable>
                    </Link>
                  )}
                  {field.id === `godaddy` && (
                    <View {...elementProps(`connection-account-field`, accountScope)} style={styles.field}>
                      <Text {...elementProps(`connection-label`, `${accountScope}-godaddy-account-id`)} style={styles.label}>
                        {`Customer UUID or Shopper ID`}
                      </Text>
                      <ConnectionInput
                        multiline={false}
                        styles={styles}
                        palette={palette}
                        busy={disabled}
                        loading={state.loading}
                        fieldId={`${accountScope}-godaddy-account-id`}
                        value={state.inputValue(account, `godaddyAccountId`)}
                        label={`GoDaddy Customer UUID or Shopper ID`}
                        placeholder={`Customer UUID or numeric shopper ID`}
                        revealed={state.isVisible(account, `godaddyAccountId`)}
                        onToggle={() => state.toggleVisibility(account, `godaddyAccountId`)}
                        onChange={value => state.changeGodaddyAccountId(account.id, value)}
                      />
                      <Text {...elementProps(`connection-hint`, `${accountScope}-godaddy-account-id`)} style={styles.copy}>
                        {`Optional: customer UUID or numeric shopper ID for this account's renewal estimates. Leave blank for automatic lookup.`}
                      </Text>
                    </View>
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
                      <Text {...elementProps(`connection-save-text`, accountScope)} style={[styles.buttonText, styles.primaryText]}>{account.number ? `Save & Sync` : `Connect & Sync`}</Text>
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
                  {field.id === `hostinger` && discovered.length > 0 && (
                    <View {...elementProps(`hosted-domain-review`, accountScope)} style={styles.reviewSection}>
                      <View {...elementProps(`hosted-domain-review-heading`, accountScope)} style={styles.reviewHeading}>
                        <ShieldCheck {...elementProps(`hosted-domain-review-icon`, accountScope)} size={16} color={palette.accent} />
                        <Text {...elementProps(`hosted-domain-review-title`, accountScope)} style={styles.label}>
                          {`Review Hosted Domains (${discovered.length})`}
                        </Text>
                      </View>
                      <Text {...elementProps(`hosted-domain-review-description`, accountScope)} style={styles.copy}>
                        {`These names use this account's Hostinger hosting and may belong to clients or other people. Choose Include My Domain for names you own.`}
                      </Text>
                      {discovered.map(domain => (
                        <HostedDomainCandidate
                          key={domain.name}
                          domain={domain}
                          styles={styles}
                          palette={palette}
                          busy={disabled}
                          scope={accountScope}
                          including={state.includingKey === `${account.id}:${domain.name}`}
                          onInclude={() => void state.includeDomain(account.id, domain.name)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
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
