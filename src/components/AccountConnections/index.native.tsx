import Toast from '../Toast';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAccountConnections } from './useAccountConnections';
import { connectionFields } from '../../shared/connections/types';
import type { RegistrarDomain } from '../../shared/registrarSync/types';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { Save, Trash2, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

interface HostedDomainCandidateProps {
  busy: boolean;
  including: boolean;
  palette: ThemePalette;
  domain: RegistrarDomain;
  onInclude: () => void;
  styles: ReturnType<typeof createStyles>;
}

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
  const RevealIcon = state.visible ? EyeOff : Eye;
  return (
    <View {...elementProps(`account-connections`)} style={styles.panel}>
      <View {...elementProps(`connections-heading`)} style={styles.row}>
        <Text {...elementProps(`connections-title`)} style={styles.title}>{`Registrar values`}</Text>
        <Pressable
          {...elementProps(`connections-reveal`)}
          style={styles.button}
          accessibilityRole={`button`}
          onPress={() => state.setVisible(current => !current)}
          accessibilityLabel={state.visible ? `Hide Connection Values` : `Show Connection Values`}
        >
          <RevealIcon {...elementProps(`connections-reveal-icon`)} size={16} color={palette.ink} />
          <Text {...elementProps(`connections-reveal-text`)} style={styles.buttonText}>{state.visible ? `Hide values` : `Show values`}</Text>
        </Pressable>
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
          {state.loading ? <View {...elementProps(`connection-skeleton`, field.id)} style={styles.skeleton} /> : (
            <TextInput
              {...elementProps(`connection-input`, field.id)}
              style={styles.input}
              autoCorrect={false}
              autoComplete={`off`}
              autoCapitalize={`none`}
              multiline={state.visible}
              editable={!state.busy && state.visible}
              value={state.values[field.id]}
              secureTextEntry={!state.visible}
              placeholder={field.placeholder}
              accessibilityLabel={`${field.label} Connection Values`}
              placeholderTextColor={palette.placeholder}
              onChangeText={value => state.change(field.id, value)}
            />
          )}
          <Text {...elementProps(`connection-hint`, field.id)} style={styles.copy}>{field.hint}</Text>
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
      {!state.visible && <Text {...elementProps(`connections-edit-hint`)} style={styles.copy}>{`Choose Show values to edit your saved connections`}</Text>}
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
      <Toast id={`connections-feedback`} message={state.error || state.notice} kind={state.error ? `error` : `success`} onDismiss={state.dismiss} />
    </View>
  );
};

export default AccountConnections;
