import Toast from '../Toast';
import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAccountConnections } from './useAccountConnections';
import { connectionFields } from '../../shared/connections/types';
import type { RegistrarDomain } from '../../shared/registrarSync/types';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { Eye, Save, EyeOff, Trash2, Globe2, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

interface HostedDomainCandidateProps {
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

const HostedDomainCandidate = ({ busy, domain, styles, palette, including, onInclude }: HostedDomainCandidateProps) => {
  const registrarName = typeof domain.meta?.registrarName === `string` ? domain.meta.registrarName : ``;
  const registrar = domain.registrar || registrarName || `Registrar Not Identified`;
  const source = typeof domain.meta?.registrarSource === `string` ? domain.meta.registrarSource : ``;
  return (
    <View {...elementProps(`hosted-domain-candidate`, domain.name)} style={styles.candidateRow}>
      <View {...elementProps(`hosted-domain-copy`, domain.name)} style={styles.candidateCopy}>
        <Text {...elementProps(`hosted-domain-name`, domain.name)} style={styles.candidateName}>
          {domain.name}
        </Text>
        <Text {...elementProps(`hosted-domain-details`, domain.name)} style={styles.candidateDetails}>
          {`Hostinger hosting · ${registrar === `Registrar Not Identified` ? registrar : `Registered with ${registrar}`}`}
        </Text>
        {!!source && (
          <Text {...elementProps(`hosted-domain-source`, domain.name)} style={styles.candidateSource}>
            {source}
          </Text>
        )}
      </View>
      <Pressable
        {...elementProps(`hosted-domain-include`, domain.name)}
        disabled={busy}
        onPress={onInclude}
        accessibilityRole={`button`}
        accessibilityState={{ disabled: busy, busy: including }}
        style={[styles.includeButton, busy && styles.disabled]}
        accessibilityLabel={`Confirm I Own ${domain.name} And Include It In My Portfolio`}
      >
        <CheckCircle2 {...elementProps(`hosted-domain-include-icon`, domain.name)} size={15} color={palette.accent} />
        <Text {...elementProps(`hosted-domain-include-text`, domain.name)} style={styles.includeText}>
          {including ? `Confirming…` : `Include My Domain`}
        </Text>
      </Pressable>
    </View>
  );
};

const AccountConnections = () => {
  const state = useAccountConnections();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`account-connections`)} style={styles.panel}>
      <View {...elementProps(`connections-heading`)} style={styles.row}>
        <Text {...elementProps(`connections-title`)} style={styles.title}>{`Registrar values`}</Text>
      </View>
      <Text {...elementProps(`connections-description`)} style={styles.copy}>
        {`Save your registrar values to check each connection and import its domains. Sign-in and refresh check saved connections when the last successful sync is at least 2 hours and 24 minutes old. External names found through hosting need your ownership confirmation; unavailable provider fields appear as —.`}
      </Text>
      {state.syncing && (
        <View
          accessible
          {...elementProps(`connections-sync-status`)}
          style={styles.syncStatus}
          accessibilityRole={`progressbar`}
          accessibilityLiveRegion={`polite`}
          accessibilityState={{ busy: true }}
          accessibilityLabel={`Syncing Domains…`}
        >
          <ActivityIndicator {...elementProps(`connections-sync-spinner`)} size={`small`} color={palette.accent} />
          <Text {...elementProps(`connections-sync-text`)} style={styles.copy}>{`Syncing Domains…`}</Text>
        </View>
      )}
      {connectionFields.map(field => (
        <View key={field.id} {...elementProps(`connection-field`, field.id)} style={styles.field}>
          <Text {...elementProps(`connection-label`, field.id)} style={styles.label}>{field.label}</Text>
          <ConnectionInput
            fieldId={field.id}
            styles={styles}
            palette={palette}
            busy={state.busy}
            label={field.label}
            loading={state.loading}
            placeholder={field.placeholder}
            value={state.inputValues[field.id]}
            revealed={state.isVisible(field.id)}
            onToggle={() => state.toggleVisibility(field.id)}
            onChange={value => state.change(field.id, value)}
          />
          <Text {...elementProps(`connection-hint`, field.id)} style={styles.copy}>{field.hint}</Text>
          {field.id === `godaddy` && (
            <View {...elementProps(`connection-account-field`, field.id)} style={styles.field}>
              <Text {...elementProps(`connection-label`, `godaddyAccountId`)} style={styles.label}>
                {`Customer UUID or Shopper ID`}
              </Text>
              <ConnectionInput
                multiline={false}
                styles={styles}
                palette={palette}
                busy={state.busy}
                loading={state.loading}
                fieldId={`godaddyAccountId`}
                onChange={state.changeGodaddyAccountId}
                value={state.godaddyAccountId}
                label={`GoDaddy Customer UUID or Shopper ID`}
                placeholder={`Customer UUID or numeric shopper ID`}
                revealed={state.isVisible(`godaddyAccountId`)}
                onToggle={() => state.toggleVisibility(`godaddyAccountId`)}
              />
              <Text {...elementProps(`connection-hint`, `godaddyAccountId`)} style={styles.copy}>
                {`Optional: customer UUID or numeric shopper ID for renewal estimates. Leave blank for automatic lookup.`}
              </Text>
            </View>
          )}
          <View {...elementProps(`actionsCell`, `connection-${field.id}`)} style={styles.actionsCell}>
            <View {...elementProps(`rowStatus`, `connection-${field.id}`)} style={styles.rowStatus}>
              <View {...elementProps(`statusDotWrap`, `connection-${field.id}`)} style={styles.statusDotWrap}>
                <View
                  {...elementProps(`statusDot`, `connection-${field.id}`)}
                  style={[styles.statusDot, { backgroundColor: state.connectionStatuses[field.id].state === `connected`
                    ? palette.success : state.connectionStatuses[field.id].state === `error` ? palette.danger : palette.muted }]}
                />
              </View>
              <Text {...elementProps(`statusText`, `connection-${field.id}`)} style={styles.statusText} accessibilityLiveRegion={`polite`}>
                {state.connectionStatuses[field.id].message}
              </Text>
            </View>
          </View>
          {field.id === `hostinger` && state.discoveredDomains.length > 0 && (
            <View {...elementProps(`hosted-domain-review`)} style={styles.reviewSection}>
              <View {...elementProps(`hosted-domain-review-heading`)} style={styles.reviewHeading}>
                <ShieldCheck {...elementProps(`hosted-domain-review-icon`)} size={16} color={palette.accent} />
                <Text {...elementProps(`hosted-domain-review-title`)} style={styles.label}>
                  {`Review Hosted Domains (${state.discoveredDomains.length})`}
                </Text>
              </View>
              <Text {...elementProps(`hosted-domain-review-description`)} style={styles.copy}>
                {`These names use Hostinger hosting and may belong to clients or other people. Choose Include My Domain only for names you own. Your confirmation adds the name to your private Hostinger settings and checks it again.`}
              </Text>
              {state.discoveredDomains.map(domain => (
                <HostedDomainCandidate
                  key={domain.name}
                  domain={domain}
                  styles={styles}
                  palette={palette}
                  busy={state.busy || state.loading || state.syncing}
                  including={state.includingName === domain.name}
                  onInclude={() => void state.includeDomain(domain.name)}
                />
              ))}
            </View>
          )}
        </View>
      ))}
      <View {...elementProps(`connections-actions`)} style={styles.row}>
        <Pressable {...elementProps(`connections-save`)} style={[styles.button, styles.primary]} disabled={state.busy || state.loading} onPress={() => void state.save()}>
          {state.busy
            ? <ActivityIndicator {...elementProps(`connections-save-spinner`)} size={`small`} color={palette.contrast} />
            : <Save {...elementProps(`connections-save-icon`)} size={16} color={palette.contrast} />}
          <Text {...elementProps(`connections-save-text`)} style={[styles.buttonText, styles.primaryText]}>{state.busy ? state.syncing ? `Checking Domains…` : `Saving…` : `Save connections`}</Text>
        </Pressable>
        <Pressable {...elementProps(`connections-clear`)} style={styles.button} disabled={state.busy || state.loading} onPress={() => void state.clear()}>
          <Trash2 {...elementProps(`connections-clear-icon`)} size={16} color={palette.danger} />
          <Text {...elementProps(`connections-clear-text`)} style={styles.buttonText}>{`Remove saved values`}</Text>
        </Pressable>
      </View>
      <View {...elementProps(`connections-private-note`)} style={styles.note}>
        <ShieldCheck {...elementProps(`connections-private-icon`)} size={16} color={palette.accent} />
        <Text {...elementProps(`connections-private-copy`)} style={styles.noteText}>{`Values stay in your private account settings and are sent through the app's server to the selected registrar for read-only domain checks. They never appear in public profiles, Community, or exports. Local storage is readable by someone with access to this device.`}</Text>
      </View>
      <Toast
        id={`connections-feedback`}
        onDismiss={state.dismiss}
        message={state.error || state.notice}
        kind={state.error ? `error` : `success`}
        action={state.showDomainsLink ? (
          <Link asChild href={routes.domains.href}>
            <Pressable
              {...elementProps(`connections-view-domains`)}
              style={styles.viewDomainsButton}
              accessibilityRole={`link`}
              accessibilityLabel={`View Synced Domains`}
            >
              <Globe2 {...elementProps(`connections-view-domains-icon`)} size={16} color={palette.success} />
              <Text {...elementProps(`connections-view-domains-text`)} style={styles.viewDomainsText}>
                {`View Domains`}
              </Text>
            </Pressable>
          </Link>
        ) : undefined}
      />
    </View>
  );
};

export default AccountConnections;
