import { createStyles } from './styles.native';
import { useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../../shared/config';
import { elementProps } from '../../shared/elementProps';
import { useProfileSettings } from './useProfileSettings';
import { useTheme } from '../../shared/themeContext/useTheme';
import { firebaseEnabled } from '../../shared/firebase/config';
import { Save, Lock, Globe2, RotateCcw } from 'lucide-react-native';
import { Image, Pressable, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';

const googleLogo = require('../../../assets/icons/google-g.png');
const options = [{ value: `private`, label: `Private`, Icon: Lock }, { value: `public`, label: `Public`, Icon: Globe2 }] as const;

const ProfileSettings = () => {
  const state = useProfileSettings();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const sharingNote = useLocalStorage ? `Community is shared between local accounts on this device; it does not publish to the internet.` : firebaseEnabled ? `` : `Connect a backend to save your profile preferences.`;
  const row = (id: string, label: string, value: ReactNode, input = false) => <View {...elementProps(`profile-record-row`, id)} style={[styles.row, id !== `name` && styles.separatedRow]}>
    <Text {...elementProps(`profile-label`, id)} style={[styles.label, width <= 480 && styles.compactLabel, input && styles.inputLabel]}>{label}</Text>
    <View {...elementProps(`profile-value`, id)} style={styles.value}>{value}</View>
  </View>;
  return <View {...elementProps(`profile-settings`)} style={styles.record}>
    {row(`name`, `Name`, <View {...elementProps(`profile-name-form`)} style={styles.nameForm}>
      <TextInput {...elementProps(`profile-name-input`)} maxLength={100} value={state.name} editable={!state.busy} autoComplete={`name`} style={[styles.input, styles.nameInput]} onChangeText={state.setName} accessibilityLabel={`Name`} placeholder={`Your name or username`} placeholderTextColor={palette.placeholder} />
      <View {...elementProps(`profile-name-actions`)} style={styles.actions}>
        <Pressable {...elementProps(`profile-settings-save`)} style={[styles.button, (state.busy || !state.dirty) && styles.disabled]} disabled={state.busy || !state.dirty} onPress={() => void state.save()} accessibilityRole={`button`} accessibilityLabel={`Save Profile`}>
          <Save {...elementProps(`profile-settings-save-icon`)} size={14} color={palette.contrast} />
          <Text {...elementProps(`profile-settings-save-text`)} style={styles.buttonText}>{state.busy ? `Saving Profile` : `Save Profile`}</Text>
        </Pressable>
        <Pressable {...elementProps(`profile-settings-cancel`)} style={[styles.cancel, (state.busy || !state.dirty) && styles.disabled]} disabled={state.busy || !state.dirty} onPress={state.cancel} accessibilityRole={`button`} accessibilityLabel={`Cancel Profile Changes`}>
          <RotateCcw {...elementProps(`profile-settings-cancel-icon`)} size={14} color={palette.accent} />
          <Text {...elementProps(`profile-settings-cancel-text`)} style={styles.cancelText}>{`Cancel`}</Text>
        </Pressable>
      </View>
      {!!(state.error || state.notice) && <Text {...elementProps(`profile-settings-feedback`)} style={[styles.feedback, { color: state.error ? palette.danger : palette.success }]} accessibilityRole={state.error ? `alert` : undefined} accessibilityLiveRegion={`polite`}>{state.error || state.notice}</Text>}
    </View>, true)}
    {row(`email`, `Email`, <View {...elementProps(`profile-email-field`)} style={styles.emailField}>
      {state.isGoogle && <Image {...elementProps(`profile-email-provider-icon`)} source={googleLogo} style={styles.providerIcon} accessibilityLabel={`Google Account`} />}
      <TextInput {...elementProps(`profile-email-input`)} readOnly editable={false} value={state.email} autoComplete={`email`} autoCapitalize={`none`} keyboardType={`email-address`} accessibilityLabel={`Email Address`} style={[styles.input, styles.disabledInput, styles.emailInput]} />
    </View>, true)}
    {row(`bio`, `Bio`, <TextInput {...elementProps(`profile-bio-input`)} multiline maxLength={2000} editable={!state.busy} value={state.description} accessibilityLabel={`Profile Bio`} placeholder={`A little about you`} onChangeText={state.setDescription} style={[styles.input, styles.bio]} placeholderTextColor={palette.placeholder} />, true)}
    {row(`privacy`, `Visibility`, <>
      <View {...elementProps(`profile-privacy-options`)} style={styles.options} accessibilityRole={`radiogroup`} accessibilityLabel={`Profile Visibility`}>
        {options.map(({ value, label, Icon }) => <Pressable key={value} {...elementProps(`profile-privacy-option`, value)} disabled={state.busy} accessibilityRole={`radio`} accessibilityLabel={`${label} Profile`} onPress={() => state.changePrivacy(value)} accessibilityState={{ checked: state.privacy === value }} style={[styles.option, state.privacy === value && styles.selected]}>
          <Icon {...elementProps(`profile-privacy-icon`, value)} size={16} color={state.privacy === value ? palette.accent : palette.muted} />
          <Text {...elementProps(`profile-privacy-label`, value)} style={[styles.optionLabel, state.privacy === value && styles.selectedLabel]}>{label}</Text>
        </Pressable>)}
      </View>
    </>)}
    {row(`sharing`, `Portfolio`, <>
      <View {...elementProps(`profile-domains-sharing`)} style={styles.sharing}>
        <Switch {...elementProps(`profile-domains-sharing-switch`)} accessibilityLabel={`Share Domain Names`} onValueChange={state.setPublicDomains} disabled={state.busy || state.privacy !== `public`} value={state.privacy === `public` && state.publicDomains} trackColor={{ false: palette.line, true: palette.accent }} />
        <Text {...elementProps(`profile-domains-sharing-text`)} style={styles.sharingText}>{`Share Domain Names`}</Text>
      </View>
      {!!sharingNote && <Text {...elementProps(`profile-sharing-note`)} style={styles.copy}>{sharingNote}</Text>}
    </>)}
  </View>;
};

export default ProfileSettings;
