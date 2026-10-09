import Toast from '../Toast';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Save, Lock, Globe2 } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useProfileSettings } from './useProfileSettings';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';

const ProfileSettings = () => {
  const state = useProfileSettings();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const options = [
    { value: `private`, label: `Private`, Icon: Lock, copy: `Only you can see your profile and posts` },
    { value: `public`, label: `Public`, Icon: Globe2, copy: `Your name, bio, and public posts appear in Community` },
  ] as const;
  return (
    <View {...elementProps(`profile-settings`)} style={styles.panel}>
      <Text {...elementProps(`profile-settings-title`)} style={styles.title}>{`Profile & privacy`}</Text>
      <View {...elementProps(`profile-name-field`)} style={styles.field}>
        <Text {...elementProps(`profile-name-label`)} style={styles.label}>{`Display name`}</Text>
        <TextInput
          {...elementProps(`profile-name-input`)}
          maxLength={100}
          value={state.name}
          style={styles.input}
          editable={!state.busy}
          onChangeText={state.setName}
          accessibilityLabel={`Display Name`}
          placeholderTextColor={palette.placeholder}
        />
      </View>
      <View {...elementProps(`profile-email-field`)} style={styles.field}>
        <Text {...elementProps(`profile-email-label`)} style={styles.label}>{`Email`}</Text>
        <TextInput
          readOnly
          aria-disabled={true}
          value={state.email}
          autoComplete={`email`}
          autoCapitalize={`none`}
          keyboardType={`email-address`}
          accessibilityLabel={`Email Address`}
          {...elementProps(`profile-email-input`)}
          style={[styles.input, styles.disabledInput]}
        />
      </View>
      <View {...elementProps(`profile-bio-field`)} style={styles.field}>
        <Text {...elementProps(`profile-bio-label`)} style={styles.label}>{`Bio`}</Text>
        <TextInput
          {...elementProps(`profile-bio-input`)}
          multiline
          maxLength={2000}
          editable={!state.busy}
          value={state.description}
          accessibilityLabel={`Profile Bio`}
          placeholder={`A little about you`}
          onChangeText={state.setDescription}
          style={[styles.input, styles.bio]}
          placeholderTextColor={palette.placeholder}
        />
      </View>
      <View {...elementProps(`profile-privacy-options`)} style={styles.field}>
        <Text {...elementProps(`profile-privacy-label`)} style={styles.label}>{`Who can see your profile?`}</Text>
        {options.map(({ value, label, copy, Icon }) => (
          <Pressable
            key={value}
            disabled={state.busy}
            accessibilityRole={`radio`}
            accessibilityLabel={`${label} Profile`}
            {...elementProps(`profile-privacy-option`, value)}
            onPress={() => state.changePrivacy(value)}
            accessibilityState={{ checked: state.privacy === value }}
            style={[styles.option, state.privacy === value && styles.selected]}
          >
            <Icon {...elementProps(`profile-privacy-icon`, value)} size={18} color={state.privacy === value ? palette.accent : palette.muted} />
            <View {...elementProps(`profile-privacy-text`, value)} style={styles.optionText}>
              <Text {...elementProps(`profile-privacy-title`, value)} style={styles.label}>{label}</Text>
              <Text {...elementProps(`profile-privacy-copy`, value)} style={styles.copy}>{copy}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View {...elementProps(`profile-domains-sharing`)} style={styles.option}>
        <View {...elementProps(`profile-domains-sharing-text`)} style={styles.optionText}>
          <Text {...elementProps(`profile-domains-sharing-title`)} style={styles.label}>{`Share domain names`}</Text>
          <Text {...elementProps(`profile-domains-sharing-copy`)} style={styles.copy}>{`Show domain names and registrars with your public profile. Owner details, notes, prices, and connection values stay private.`}</Text>
        </View>
        <Switch
          {...elementProps(`profile-domains-sharing-switch`)}
          accessibilityLabel={`Share Domain Names`}
          onValueChange={state.setPublicDomains}
          disabled={state.busy || state.privacy !== `public`}
          value={state.privacy === `public` && state.publicDomains}
          trackColor={{ false: palette.line, true: palette.accent }}
        />
      </View>
      <Text {...elementProps(`profile-sharing-note`)} style={styles.copy}>{`Profiles start private. Followers can see follower-only posts while your profile is public. Community is shared between local accounts on this device; it does not publish to the internet.`}</Text>
      <Pressable {...elementProps(`profile-settings-save`)} style={styles.button} disabled={state.busy} onPress={() => void state.save()}>
        <Save {...elementProps(`profile-settings-save-icon`)} size={16} color={palette.contrast} />
        <Text {...elementProps(`profile-settings-save-text`)} style={styles.buttonText}>{state.busy ? `Saving…` : `Save profile`}</Text>
      </Pressable>
      <Toast id={`profile-feedback`} message={state.error || state.notice} kind={state.error ? `error` : `success`} onDismiss={state.dismiss} />
    </View>
  );
};

export default ProfileSettings;
