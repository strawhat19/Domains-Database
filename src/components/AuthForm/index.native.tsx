import Toast from '../Toast';
import { useMemo, useContext } from 'react';
import { createStyles } from './styles.native';
import AuthOnboarding from '../AuthOnboarding';
import GoogleAuthButton from '../GoogleAuthButton';
import { useLocalStorage } from '../../shared/config';
import { elementProps } from '../../shared/elementProps';
import { useAuthForm, type AuthMode } from './useAuthForm';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Eye, Mail, EyeOff, LogIn, UserRound, ArrowRight, HardDrive, RotateCcw, LockKeyhole } from 'lucide-react-native';

const AuthForm = ({ mode }: { mode: AuthMode }) => {
  const state = useAuthForm(mode);
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight;
  const { palette } = useTheme();
  const availableHeight = pageContentHeight ?? Math.max(0, height - 200);
  const compact = width <= 900 || availableHeight < 260;
  const condensed = availableHeight < 520;
  const landscape = width >= 620 && availableHeight < 260;
  const styles = useMemo(() => createStyles(palette, compact, condensed, availableHeight, width), [palette, compact, condensed, availableHeight, width]);

  return (
    <View {...elementProps(`auth-form-page`, mode)} style={[styles.page, state.canReactivate && styles.reactivationPage]}>
      {!landscape && <AuthOnboarding mode={mode} />}
      <View {...elementProps(`auth-form-panel`, mode)} style={styles.panel}>
        {!state.auth.user && (
          <View {...elementProps(`auth-form-modes`, mode)} style={styles.modes}>
            <Pressable
              disabled={state.disabled}
              accessibilityRole={`link`}
              accessibilityLabel={`Sign In`}
              {...elementProps(`auth-form-mode`, `${mode}-signin`)}
              accessibilityState={{ selected: !state.signingUp, disabled: state.disabled }}
              onPress={() => { if (state.signingUp) state.navigate(`/signin`); }}
              style={[styles.mode, !state.signingUp && styles.modeSelected]}
            >
              <LogIn {...elementProps(`auth-form-mode-icon`, `${mode}-signin`)} size={16} color={!state.signingUp ? palette.ink : palette.muted} />
              <Text {...elementProps(`auth-form-mode-text`, `${mode}-signin`)} style={[styles.modeText, !state.signingUp && styles.modeTextSelected]}>
                {`Sign In`}
              </Text>
            </Pressable>
            <Pressable
              disabled={state.disabled}
              accessibilityRole={`link`}
              accessibilityLabel={`Create Account`}
              {...elementProps(`auth-form-mode`, `${mode}-signup`)}
              accessibilityState={{ selected: state.signingUp, disabled: state.disabled }}
              onPress={() => { if (!state.signingUp) state.navigate(`/signup`); }}
              style={[styles.mode, state.signingUp && styles.modeSelected]}
            >
              <UserRound {...elementProps(`auth-form-mode-icon`, `${mode}-signup`)} size={16} color={state.signingUp ? palette.ink : palette.muted} />
              <Text {...elementProps(`auth-form-mode-text`, `${mode}-signup`)} style={[styles.modeText, state.signingUp && styles.modeTextSelected]}>
                {`Create Account`}
              </Text>
            </Pressable>
          </View>
        )}
        {state.auth.loading ? (
          <View {...elementProps(`auth-form-loading`, mode)} style={styles.loading} accessibilityLabel={`Loading Your Account`} accessibilityState={{ busy: true }}>
            <View {...elementProps(`auth-form-skeleton-title`, mode)} style={styles.skeletonTitle} />
            <View {...elementProps(`auth-form-skeleton-copy`, mode)} style={styles.skeletonCopy} />
            <View {...elementProps(`auth-form-skeleton-google`, mode)} style={styles.skeletonField} />
            {[`email`, `password`].map(field => (
              <View key={field} {...elementProps(`auth-form-skeleton-field`, `${mode}-${field}`)} style={styles.skeletonField} />
            ))}
            <View {...elementProps(`auth-form-skeleton-submit`, mode)} style={styles.skeletonField} />
          </View>
        ) : state.auth.user ? (
          <View {...elementProps(`auth-form-signed-in`, mode)} style={styles.signedIn}>
            <View {...elementProps(`auth-form-heading`, mode)} style={styles.heading}>
              {!condensed && (
                <Text {...elementProps(`auth-form-eyebrow`, mode)} style={styles.eyebrow}>
                  {`YOUR DOMAIN COLLECTION`}
                </Text>
              )}
              <Text {...elementProps(`auth-form-title`, mode)} style={styles.title} accessibilityRole={`header`}>
                {`You're already signed in.`}
              </Text>
              <Text {...elementProps(`auth-form-description`, mode)} style={styles.description}>
                {state.auth.user.email}
              </Text>
            </View>
            <Pressable
              style={[styles.submit, state.disabled && styles.disabled]}
              disabled={state.disabled}
              accessibilityRole={`link`}
              accessibilityLabel={`View Your Profile`}
              {...elementProps(`auth-form-profile`, mode)}
              onPress={() => state.navigate(`/profile`)}
            >
              <UserRound {...elementProps(`auth-form-profile-icon`, mode)} size={18} color={palette.contrast} />
              <Text {...elementProps(`auth-form-profile-text`, mode)} style={styles.submitText}>
                {`View Profile`}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {!landscape && (
              <View {...elementProps(`auth-form-heading`, mode)} style={styles.heading}>
                {!condensed && (
                  <Text {...elementProps(`auth-form-eyebrow`, mode)} style={styles.eyebrow}>
                    {`YOUR DOMAIN COLLECTION`}
                  </Text>
                )}
                <Text {...elementProps(`auth-form-title`, mode)} style={styles.title} accessibilityRole={`header`}>
                  {state.signingUp ? compact ? `Create account.` : `Make room for your ideas.` : `Welcome back.`}
                </Text>
                {!condensed && (
                  <Text {...elementProps(`auth-form-description`, mode)} style={styles.description}>
                    {state.signingUp ? `Bring your domains together.` : `Pick up where you left off.`}
                  </Text>
                )}
              </View>
            )}
            <View {...elementProps(`auth-form-google`, mode)} style={styles.google}>
              <GoogleAuthButton mode={mode} disabled={state.disabled} />
              <View {...elementProps(`auth-form-email-divider`, mode)} style={styles.emailDivider}>
                <View {...elementProps(`auth-form-email-divider-line`, `${mode}-start`)} style={styles.dividerLine} />
                <Text {...elementProps(`auth-form-email-divider-label`, mode)} style={styles.dividerLabel}>{`or continue with email`}</Text>
                <View {...elementProps(`auth-form-email-divider-line`, `${mode}-end`)} style={styles.dividerLine} />
              </View>
            </View>
            <View {...elementProps(`auth-form-fields`, mode)} style={styles.form}>
              <View {...elementProps(`auth-form-field`, `${mode}-email`)} style={styles.field}>
                <Text {...elementProps(`auth-form-label`, `${mode}-email`)} style={styles.label}>
                  {`Email`}
                </Text>
                <View {...elementProps(`auth-form-input-frame`, `${mode}-email`)} style={styles.inputFrame}>
                  <Mail {...elementProps(`auth-form-input-icon`, `${mode}-email`)} size={18} color={palette.muted} />
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
                  <LockKeyhole {...elementProps(`auth-form-input-icon`, `${mode}-password`)} size={18} color={palette.muted} />
                  <TextInput
                    style={styles.input}
                    autoCorrect={false}
                    autoCapitalize={`none`}
                    editable={!state.disabled}
                    value={state.fields.password}
                    accessibilityLabel={`Password`}
                    secureTextEntry={!state.showPassword}
                    placeholderTextColor={palette.placeholder}
                    {...elementProps(`auth-form-input`, `${mode}-password`)}
                    onChangeText={value => state.updateField(`password`, value)}
                    textContentType={state.signingUp ? `newPassword` : `password`}
                    autoComplete={state.signingUp ? `new-password` : `current-password`}
                    placeholder={`Enter your password`}
                    onSubmitEditing={() => void state.submit()}
                  />
                  <Pressable
                    style={styles.toggle}
                    disabled={state.disabled}
                    accessibilityRole={`button`}
                    {...elementProps(`auth-form-password-toggle`, mode)}
                    onPress={() => state.setShowPassword(value => !value)}
                    accessibilityLabel={state.showPassword ? `Hide Password` : `Show Password`}
                  >
                    {state.showPassword
                      ? <EyeOff {...elementProps(`auth-form-password-toggle-icon`, mode)} size={18} color={palette.muted} />
                      : <Eye {...elementProps(`auth-form-password-toggle-icon`, mode)} size={18} color={palette.muted} />}
                  </Pressable>
                </View>
              </View>
              {Boolean(state.error) && <Toast id={`auth-form-${mode}`} message={state.error || ``} onDismiss={state.clearFeedback} />}
              {Boolean(state.auth.notice) && !state.error && (
                <Toast id={`auth-form-notice-${mode}`} kind={`success`} message={state.auth.notice || ``} onDismiss={state.auth.clearNotice} />
              )}
              <Pressable
                disabled={state.disabled}
                accessibilityRole={`button`}
                onPress={() => void state.submit()}
                {...elementProps(`auth-form-submit`, mode)}
                style={[styles.submit, state.disabled && styles.disabled]}
                accessibilityLabel={state.signingUp ? `Create Account` : `Sign In`}
              >
                <Text {...elementProps(`auth-form-submit-text`, mode)} style={styles.submitText}>
                  {state.auth.busy ? `Please Wait…` : state.signingUp ? `Create Account` : `Sign In`}
                </Text>
                <ArrowRight {...elementProps(`auth-form-submit-icon`, mode)} size={18} color={palette.contrast} />
              </Pressable>
            </View>
            {state.canReactivate && (
              <View {...elementProps(`auth-form-reactivation`, mode)} style={styles.reactivation} accessibilityLiveRegion={`polite`}>
                <Text {...elementProps(`auth-form-reactivation-title`, mode)} style={styles.label}>{`Account Deactivated`}</Text>
                <Text {...elementProps(`auth-form-reactivation-copy`, mode)} style={styles.description}>
                  {`Your saved account data is retained. Reactivate your account to sign in again.`}
                </Text>
                <Pressable
                  disabled={state.disabled}
                  accessibilityRole={`button`}
                  accessibilityLabel={`Reactivate Account`}
                  onPress={() => void state.reactivate()}
                  {...elementProps(`auth-form-reactivate`, mode)}
                  style={[styles.submit, state.disabled && styles.disabled]}
                  accessibilityHint={`Reactivate Your Account And Sign In With Your Retained Data`}
                >
                  <RotateCcw {...elementProps(`auth-form-reactivate-icon`, mode)} size={18} color={palette.contrast} />
                  <Text {...elementProps(`auth-form-reactivate-text`, mode)} style={styles.submitText}>
                    {state.auth.busy ? `Please Wait…` : `Reactivate Account`}
                  </Text>
                </Pressable>
              </View>
            )}
            {!condensed && (
              <View {...elementProps(`auth-form-local-note`, mode)} style={styles.localNote}>
                <HardDrive {...elementProps(`auth-form-local-note-icon`, mode)} size={16} color={palette.muted} />
                <Text {...elementProps(`auth-form-local-note-copy`, mode)} style={styles.localCopy}>
                  {useLocalStorage ? `Manage your portfolio with your account.` : `Accounts are available once the service is connected.`}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AuthForm;
