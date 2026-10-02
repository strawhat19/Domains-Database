import Toast from '../Toast';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useAuthForm, type AuthMode } from './useAuthForm';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff, Mail, UserRound, ArrowRight, LockKeyhole, HardDrive } from 'lucide-react-native';

const AuthForm = ({ mode }: { mode: AuthMode }) => {
  const state = useAuthForm(mode);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (state.auth.loading) return (
    <View {...elementProps(`auth-form-page`, mode)} style={styles.page}>
      <View {...elementProps(`auth-form-loading`, mode)} style={styles.panel} accessibilityLabel={`Loading Your Account`}>
        <View {...elementProps(`auth-form-skeleton-title`, mode)} style={styles.skeletonTitle} />
        <View {...elementProps(`auth-form-skeleton-copy`, mode)} style={styles.skeletonCopy} />
        <View {...elementProps(`auth-form-skeleton-field`, `${mode}-email`)} style={styles.skeletonField} />
        <View {...elementProps(`auth-form-skeleton-field`, `${mode}-password`)} style={styles.skeletonField} />
      </View>
    </View>
  );

  if (state.auth.user) return (
    <View {...elementProps(`auth-form-page`, mode)} style={styles.page}>
      <View {...elementProps(`auth-form-signed-in`, mode)} style={styles.panel}>
        <Text {...elementProps(`auth-form-title`, mode)} style={styles.title} accessibilityRole={`header`}>
          {`You're already signed in`}
        </Text>
        <Text {...elementProps(`auth-form-description`, mode)} style={styles.description}>
          {state.auth.user.email}
        </Text>
        <Pressable {...elementProps(`auth-form-profile`, mode)} style={[styles.submit, state.disabled && styles.disabled]} disabled={state.disabled} accessibilityRole={`link`} accessibilityLabel={`View Your Profile`} onPress={() => state.navigate(`/profile`)}>
          <UserRound {...elementProps(`auth-form-profile-icon`, mode)} size={16} color={palette.contrast} />
          <Text {...elementProps(`auth-form-profile-text`, mode)} style={styles.submitText}>
            {`View Profile`}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View {...elementProps(`auth-form-page`, mode)} style={styles.page}>
      <View {...elementProps(`auth-form-panel`, mode)} style={styles.panel}>
        <View {...elementProps(`auth-form-heading`, mode)} style={styles.heading}>
          <Text {...elementProps(`auth-form-eyebrow`, mode)} style={styles.eyebrow}>
            {`YOUR DOMAIN COLLECTION`}
          </Text>
          <Text {...elementProps(`auth-form-title`, mode)} style={styles.title} accessibilityRole={`header`}>
            {state.signingUp ? `A place for your names.` : `Welcome back.`}
          </Text>
          <Text {...elementProps(`auth-form-description`, mode)} style={styles.description}>
            {state.signingUp ? `Create an account to keep your domains together on this device.` : `Sign in to pick up where you left off.`}
          </Text>
        </View>
        <View {...elementProps(`auth-form-fields`, mode)} style={styles.form}>
          {state.signingUp && (
            <View {...elementProps(`auth-form-field`, `${mode}-name`)} style={styles.field}>
              <Text {...elementProps(`auth-form-label`, `${mode}-name`)} style={styles.label}>
                {`Name`}
              </Text>
              <View {...elementProps(`auth-form-input-frame`, `${mode}-name`)} style={styles.inputFrame}>
                <UserRound {...elementProps(`auth-form-input-icon`, `${mode}-name`)} size={16} color={palette.muted} />
                <TextInput
                  style={styles.input}
                  autoComplete={`name`}
                  value={state.fields.name}
                  textContentType={`name`}
                  editable={!state.disabled}
                  placeholder={`Alex Morgan`}
                  accessibilityLabel={`Your Name`}
                  placeholderTextColor={palette.placeholder}
                  {...elementProps(`auth-form-input`, `${mode}-name`)}
                  onChangeText={value => state.updateField(`name`, value)}
                />
              </View>
            </View>
          )}
          <View {...elementProps(`auth-form-field`, `${mode}-email`)} style={styles.field}>
            <Text {...elementProps(`auth-form-label`, `${mode}-email`)} style={styles.label}>
              {`Email`}
            </Text>
            <View {...elementProps(`auth-form-input-frame`, `${mode}-email`)} style={styles.inputFrame}>
              <Mail {...elementProps(`auth-form-input-icon`, `${mode}-email`)} size={16} color={palette.muted} />
              <TextInput
                style={styles.input}
                autoCorrect={false}
                autoComplete={`email`}
                autoCapitalize={`none`}
                value={state.fields.email}
                editable={!state.disabled}
                textContentType={`emailAddress`}
                keyboardType={`email-address`}
                placeholder={`you@example.com`}
                accessibilityLabel={`Email Address`}
                placeholderTextColor={palette.placeholder}
                {...elementProps(`auth-form-input`, `${mode}-email`)}
                onChangeText={value => state.updateField(`email`, value)}
              />
            </View>
          </View>
          <View {...elementProps(`auth-form-field`, `${mode}-password`)} style={styles.field}>
            <Text {...elementProps(`auth-form-label`, `${mode}-password`)} style={styles.label}>
              {`Password`}
            </Text>
            <View {...elementProps(`auth-form-input-frame`, `${mode}-password`)} style={styles.inputFrame}>
              <LockKeyhole {...elementProps(`auth-form-input-icon`, `${mode}-password`)} size={16} color={palette.muted} />
              <TextInput
                style={styles.input}
                autoCorrect={false}
                autoCapitalize={`none`}
                editable={!state.disabled}
                value={state.fields.password}
                accessibilityLabel={`Password`}
                placeholder={`At least 8 characters`}
                secureTextEntry={!state.showPassword}
                placeholderTextColor={palette.placeholder}
                {...elementProps(`auth-form-input`, `${mode}-password`)}
                onChangeText={value => state.updateField(`password`, value)}
                textContentType={state.signingUp ? `newPassword` : `password`}
                autoComplete={state.signingUp ? `new-password` : `current-password`}
                onSubmitEditing={() => { if (!state.signingUp) void state.submit(); }}
              />
              <Pressable {...elementProps(`auth-form-password-toggle`, mode)} disabled={state.disabled} style={styles.toggle} accessibilityRole={`button`} accessibilityLabel={state.showPassword ? `Hide Password` : `Show Password`} onPress={() => state.setShowPassword(value => !value)}>
                {state.showPassword ? <EyeOff {...elementProps(`auth-form-password-toggle-icon`, mode)} size={16} color={palette.muted} /> : <Eye {...elementProps(`auth-form-password-toggle-icon`, mode)} size={16} color={palette.muted} />}
              </Pressable>
            </View>
          </View>
          {state.signingUp && (
            <View {...elementProps(`auth-form-field`, `${mode}-confirmation`)} style={styles.field}>
              <Text {...elementProps(`auth-form-label`, `${mode}-confirmation`)} style={styles.label}>
                {`Confirm Password`}
              </Text>
              <View {...elementProps(`auth-form-input-frame`, `${mode}-confirmation`)} style={styles.inputFrame}>
                <LockKeyhole {...elementProps(`auth-form-input-icon`, `${mode}-confirmation`)} size={16} color={palette.muted} />
                <TextInput
                  style={styles.input}
                  autoCorrect={false}
                  autoCapitalize={`none`}
                  editable={!state.disabled}
                  autoComplete={`new-password`}
                  textContentType={`newPassword`}
                  value={state.fields.confirmation}
                  placeholder={`Repeat your password`}
                  onSubmitEditing={() => void state.submit()}
                  secureTextEntry={!state.showPassword}
                  accessibilityLabel={`Confirm Password`}
                  placeholderTextColor={palette.placeholder}
                  {...elementProps(`auth-form-input`, `${mode}-confirmation`)}
                  onChangeText={value => state.updateField(`confirmation`, value)}
                />
              </View>
            </View>
          )}
          {Boolean(state.error) && <Toast id={`auth-form-${mode}`} message={state.error || ``} onDismiss={state.clearFeedback} />}
          {Boolean(state.auth.notice) && !state.error && (
            <View {...elementProps(`auth-form-notice`, mode)} style={styles.notice} accessibilityLiveRegion={`polite`}>
              <Text {...elementProps(`auth-form-notice-text`, mode)} style={styles.noticeText}>
                {state.auth.notice}
              </Text>
            </View>
          )}
          <Pressable {...elementProps(`auth-form-submit`, mode)} disabled={state.disabled} accessibilityRole={`button`} accessibilityLabel={state.signingUp ? `Create Account` : `Sign In`} style={[styles.submit, state.disabled && styles.disabled]} onPress={() => void state.submit()}>
            <Text {...elementProps(`auth-form-submit-text`, mode)} style={styles.submitText}>
              {state.auth.busy ? `Please Wait…` : state.signingUp ? `Create Account` : `Sign In`}
            </Text>
            <ArrowRight {...elementProps(`auth-form-submit-icon`, mode)} size={16} color={palette.contrast} />
          </Pressable>
        </View>
        <View {...elementProps(`auth-form-switch`, mode)} style={styles.switchRow}>
          <Text {...elementProps(`auth-form-switch-copy`, mode)} style={styles.switchCopy}>
            {state.signingUp ? `Already have an account?` : `New here?`}
          </Text>
          <Pressable {...elementProps(`auth-form-switch-link`, mode)} disabled={state.disabled} accessibilityRole={`link`} style={[styles.switchLink, state.disabled && styles.disabled]} onPress={() => state.navigate(state.signingUp ? `/signin` : `/signup`)}>
            <Text {...elementProps(`auth-form-switch-text`, mode)} style={styles.switchText}>
              {state.signingUp ? `Sign In` : `Create An Account`}
            </Text>
            <ArrowRight {...elementProps(`auth-form-switch-icon`, mode)} size={13} color={palette.accent} />
          </Pressable>
        </View>
        <View {...elementProps(`auth-form-local-note`, mode)} style={styles.localNote}>
          <HardDrive {...elementProps(`auth-form-local-note-icon`, mode)} size={15} color={palette.muted} />
          <Text {...elementProps(`auth-form-local-note-copy`, mode)} style={styles.localCopy}>
            {`This account and its portfolio stay on this device. Registrar accounts aren't connected yet.`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AuthForm;
