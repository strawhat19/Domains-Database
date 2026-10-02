import Toast from '../Toast';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAccountConnections } from './useAccountConnections';
import { connectionFields } from '../../shared/connections/types';
import { Save, Trash2, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';

const AccountConnections = () => {
  const state = useAccountConnections();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const RevealIcon = state.visible ? EyeOff : Eye;
  return (
    <View {...elementProps(`account-connections`)} style={styles.panel}>
      <View {...elementProps(`connections-heading`)} style={styles.row}>
        <Text {...elementProps(`connections-title`)} style={styles.title}>{`Registrar values`}</Text>
        <Pressable {...elementProps(`connections-reveal`)} style={styles.button} onPress={() => state.setVisible(current => !current)}>
          <RevealIcon {...elementProps(`connections-reveal-icon`)} size={16} color={palette.ink} />
          <Text {...elementProps(`connections-reveal-text`)} style={styles.buttonText}>{state.visible ? `Hide values` : `Show values`}</Text>
        </Pressable>
      </View>
      <Text {...elementProps(`connections-description`)} style={styles.copy}>
        {`Paste .env-style values into the three fields below. They are saved privately for your account on this device. Saving prepares your connections; automatic registrar sync is not connected yet.`}
      </Text>
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
        </View>
      ))}
      {!state.visible && <Text {...elementProps(`connections-edit-hint`)} style={styles.copy}>{`Choose Show values to edit your saved connections`}</Text>}
      <View {...elementProps(`connections-actions`)} style={styles.row}>
        <Pressable {...elementProps(`connections-save`)} style={[styles.button, styles.primary]} disabled={state.busy || state.loading} onPress={() => void state.save()}>
          <Save {...elementProps(`connections-save-icon`)} size={16} color={palette.contrast} />
          <Text {...elementProps(`connections-save-text`)} style={[styles.buttonText, styles.primaryText]}>{state.busy ? `Saving…` : `Save connections`}</Text>
        </Pressable>
        <Pressable {...elementProps(`connections-clear`)} style={styles.button} disabled={state.busy || state.loading} onPress={() => void state.clear()}>
          <Trash2 {...elementProps(`connections-clear-icon`)} size={16} color={palette.danger} />
          <Text {...elementProps(`connections-clear-text`)} style={styles.buttonText}>{`Remove saved values`}</Text>
        </Pressable>
      </View>
      <View {...elementProps(`connections-private-note`)} style={styles.note}>
        <ShieldCheck {...elementProps(`connections-private-icon`)} size={16} color={palette.accent} />
        <Text {...elementProps(`connections-private-copy`)} style={styles.noteText}>{`These values never appear in your public profile or Community. Local storage can be read by someone with access to this device; use a private backend for production credentials.`}</Text>
      </View>
      <Toast id={`connections-feedback`} message={state.error || state.notice} kind={state.error ? `error` : `success`} onDismiss={state.dismiss} />
    </View>
  );
};

export default AccountConnections;
