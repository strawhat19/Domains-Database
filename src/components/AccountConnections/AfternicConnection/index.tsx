import { useMemo } from 'react';
import { Link } from 'expo-router';
import { routes } from '../../../shared/routes';
import { createStyles } from '../styles.native';
import ConnectionInput from '../ConnectionInput';
import { useAfternicConnection } from './useAfternicConnection';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { elementProps, decorativeIconProps } from '../../../shared/elementProps';
import { Save, Store, RotateCw, RotateCcw, ShieldCheck } from 'lucide-react-native';

const sellHref = { pathname: routes.market.href, params: { marketplaceView: `sell` } };
const actionTarget = { minHeight: 44 };
const maskedCredential = `••••••••••••`;
const credentialFields = [
  { id: `key`, label: `API Key`, placeholder: `Your Afternic API key`, example: `AFTERNIC_API_KEY=your_afternic_key` },
  { id: `secret`, label: `API Secret`, placeholder: `Your Afternic API secret`, example: `AFTERNIC_API_SECRET=your_afternic_secret` },
] as const;

const AfternicConnection = ({ scope }: { scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useAfternicConnection();
  const { error, saving, canCheck, checking, localMode, configured, canConfigure, refresh } = state;
  const busy = checking || saving;
  const failure = error || state.saveError;
  const descriptionId = `connection-hint-${scope}`;
  const status = localMode ? `Unavailable In Local Mode`
    : saving ? `Verifying Afternic Credentials`
      : checking ? `Checking Afternic Status`
        : failure ? (error ? `Status Check Failed` : `Connection Failed`)
          : configured === true ? `Configured`
            : configured === false ? `Not Configured` : `Unavailable For This Account`;
  const color = failure ? palette.danger : configured ? palette.success : palette.muted;
  const description = localMode ? `Afternic requires a connected Marketplace account.`
    : configured ? `Listing status, prices, and available estimates sync to your private Domains portfolio. Manage listings in Market → Sell.`
      : canConfigure ? `Paste each credential or its matching .env line. The server verifies the key and secret before saving.`
        : `Afternic setup is available to the assigned Marketplace seller.`;

  return (
    <View
      style={styles.provider}
      {...elementProps(`connection-provider`, scope)}
      {...(Platform.OS === `web` ? { role: `tabpanel` as const, tabIndex: 0 as const, 'aria-labelledby': `connection-tab-${scope}` } : {})}
    >
      <View {...elementProps(`connection-provider-heading`, scope)} style={styles.row}>
        <Text {...elementProps(`connection-provider-label`, scope)} style={styles.title} accessibilityRole={`header`}>{`Afternic`}</Text>
        {canCheck && <View {...elementProps(`connection-provider-actions`, scope)} style={styles.providerActions}>
          <Pressable
            disabled={busy}
            onPress={refresh}
            accessibilityRole={`button`}
            accessibilityState={{ disabled: busy }}
            {...elementProps(`connection-afternic-refresh`, scope)}
            style={[styles.button, actionTarget, busy && styles.disabled]}
          >
            <RotateCw size={15} color={palette.accent} {...decorativeIconProps} />
            <Text {...elementProps(`connection-afternic-refresh-label`, scope)} style={styles.buttonText}>{error ? `Try Again` : `Refresh Status`}</Text>
          </Pressable>
        </View>}
      </View>
      <View
        style={styles.accounts}
        {...elementProps(`connection-accounts`, scope)}
        {...(Platform.OS === `web` ? { dataSet: { class: `connection-accounts`, count: `1` } } : {})}
      >
        <View {...elementProps(`connection-field`, scope)} style={styles.account}>
          <View {...elementProps(`connection-account-heading`, scope)} style={styles.row}>
            <Text {...elementProps(`connection-account-title`, scope)} style={styles.label}>{`Afternic Connection`}</Text>
          </View>
          {(checking || canConfigure || configured) && (
            <View
              style={styles.inputSection}
              {...elementProps(`connection-input-section`, scope)}
              {...(Platform.OS === `web` ? { dataSet: { class: `connection-input-section`, 'key-count': `2` } } : {})}
            >
              {credentialFields.map(({ id, label, example, placeholder }) => {
                const inputScope = `${scope}-${id}`;
                const reveal = state.revealed[id];
                return (
                  <View key={id} {...elementProps(`connection-key-field`, inputScope)} style={styles.keyField}>
                    <View {...elementProps(`connection-input-column`, inputScope)} style={styles.inputColumn}>
                      <Text {...elementProps(`connection-label`, inputScope)} style={styles.label}>{label}</Text>
                      <ConnectionInput
                        editMasked
                        maxLength={544}
                        styles={styles}
                        palette={palette}
                        loading={checking}
                        fieldId={inputScope}
                        description={description}
                        label={`Afternic ${label}`}
                        busy={busy || Boolean(reveal?.pending)}
                        readOnly={Boolean(configured)}
                        descriptionIds={descriptionId}
                        placeholder={placeholder}
                        value={configured ? reveal?.value ?? maskedCredential : state.credentials[id]}
                        revealed={configured ? Boolean(reveal?.value) : canConfigure && !saving && state.credentials.revealed[id]}
                        onChange={value => state.changeCredential(id, value)}
                        onToggle={canConfigure || configured ? () => state.toggleVisibility(id) : undefined}
                        onSubmitEditing={canConfigure && id === `secret` ? () => void state.save() : undefined}
                      />
                    </View>
                    {canConfigure && <View {...elementProps(`connection-format-help`, inputScope)} style={styles.formatHelp}>
                      <Text {...elementProps(`connection-env-example`, inputScope)} style={styles.example}>{`.env Example (Fake): ${example}`}</Text>
                    </View>}
                  </View>
                );
              })}
            </View>
          )}
          {!checking && <Text {...elementProps(`connection-hint`, scope)} style={styles.copy}>{description}</Text>}
          <View {...elementProps(`actionsCell`, scope)} style={styles.actionsCell}>
            <View {...elementProps(`rowStatus`, scope)} style={styles.rowStatus}>
              <View {...elementProps(`statusDotWrap`, scope)} style={styles.statusDotWrap} {...decorativeIconProps}>
                <View {...elementProps(`statusDot`, scope)} style={[styles.statusDot, { backgroundColor: color }]} />
              </View>
              <Text {...elementProps(`statusText`, scope)} style={styles.statusText} accessibilityLiveRegion={`polite`}>{status}</Text>
            </View>
            {failure && <Text {...elementProps(`connection-afternic-error`, scope)} style={[styles.copy, { color: palette.danger }]} accessibilityRole={`alert`}>{failure}</Text>}
            {state.revealError && <Text {...elementProps(`connection-afternic-reveal-error`, scope)} style={[styles.copy, { color: palette.danger }]} accessibilityRole={`alert`}>{state.revealError}</Text>}
          </View>
          {(canConfigure || configured) && <View {...elementProps(`connection-account-actions`, scope)} style={[styles.row, styles.actionRow]}>
            {canConfigure && <>
              <Pressable
                disabled={!state.canClear}
                onPress={state.clearForm}
                accessibilityRole={`button`}
                accessibilityState={{ disabled: !state.canClear }}
                {...elementProps(`connection-reset`, scope)}
                style={[styles.button, actionTarget, styles.resetButton, !state.canClear && styles.disabled]}
              >
                <RotateCcw size={16} color={palette.muted} {...decorativeIconProps} />
                <Text style={[styles.buttonText, styles.resetText]}>{`Clear Form`}</Text>
              </Pressable>
              <Pressable
                disabled={!state.canSave}
                accessibilityRole={`button`}
                onPress={() => void state.save()}
                {...elementProps(`connection-afternic-save`, scope)}
                accessibilityState={{ busy: saving, disabled: !state.canSave }}
                style={[styles.button, actionTarget, styles.primary, !state.canSave && styles.disabled]}
              >
                <Save size={16} color={palette.contrast} {...decorativeIconProps} />
                <Text style={[styles.buttonText, styles.primaryText]}>{saving ? `Verifying…` : `Connect Afternic`}</Text>
              </Pressable>
            </>}
            {configured && <Link href={sellHref} asChild>
              <Pressable {...elementProps(`connection-afternic-market`, scope)} accessibilityRole={`link`} style={StyleSheet.flatten([styles.button, actionTarget, styles.primary])}>
                <Store size={15} color={palette.contrast} {...decorativeIconProps} />
                <Text {...elementProps(`connection-afternic-market-label`, scope)} style={[styles.buttonText, styles.primaryText]}>{`Open Market → Sell`}</Text>
              </Pressable>
            </Link>}
          </View>}
        </View>
      </View>
      <View {...elementProps(`connections-private-note`, scope)} style={styles.note}>
        <ShieldCheck size={16} color={palette.accent} {...decorativeIconProps} />
        <Text {...elementProps(`connections-private-copy`, scope)} style={styles.noteText}>{`Afternic credentials are saved on the server and used to manage the assigned seller’s portfolio.`}</Text>
      </View>
    </View>
  );
};

export default AfternicConnection;
