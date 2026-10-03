import { useMemo } from 'react';
import { Roles } from '../../types/types';
import type { PropsWithChildren } from 'react';
import LoadingScreen from '../LoadingScreen';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { useProtectedRoute } from './useProtectedRoute';
import { elementProps } from '../../shared/elementProps';
import { LockKeyhole, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

type ProtectedRouteProps = PropsWithChildren<{ minRole?: Roles }>;

const ProtectedRoute = ({ children, minRole = Roles.Subscriber }: ProtectedRouteProps) => {
  const state = useProtectedRoute(minRole);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (state.auth.loading) return (
    <View {...elementProps(`protected-route-loading`)} style={styles.page} accessibilityLabel={`Loading Your Account`}>
      <LoadingScreen compact suffix={`protected-route`} label={`Loading your account…`} />
    </View>
  );
  if (state.allowed) return <>{children}</>;

  return (
    <View {...elementProps(`protected-route-page`)} style={styles.page}>
      <View {...elementProps(`protected-route-panel`)} style={styles.panel}>
        <View {...elementProps(`protected-route-mark`)} style={styles.mark}>
          <LockKeyhole {...elementProps(`protected-route-icon`)} size={19} color={palette.accent} />
        </View>
        <Text {...elementProps(`protected-route-title`)} style={styles.title} accessibilityRole={`header`}>
          {state.auth.user ? `More access is needed` : `Sign in to view this`}
        </Text>
        <Text {...elementProps(`protected-route-description`)} style={styles.copy}>
          {state.auth.user ? `This page requires the ${minRole} role or higher. You can review your current account in your profile.` : `Sign in or create an account to manage your profile and private account settings on this device.`}
        </Text>
        <View {...elementProps(`protected-route-actions`)} style={styles.actions}>
          <Pressable {...elementProps(`protected-route-primary-link`)} disabled={state.auth.busy} accessibilityRole={`link`} accessibilityLabel={state.auth.user ? `View Profile` : `Sign In`} style={[styles.button, state.auth.busy && styles.disabled]} onPress={() => state.navigate(state.auth.user ? `/profile` : `/signin`)}>
            <Text {...elementProps(`protected-route-primary-text`)} style={styles.buttonText}>
              {state.auth.user ? `View Profile` : `Sign In`}
            </Text>
            <ArrowRight {...elementProps(`protected-route-primary-icon`)} size={14} color={palette.contrast} />
          </Pressable>
          {!state.auth.user && (
            <Pressable {...elementProps(`protected-route-signup-link`)} disabled={state.auth.busy} accessibilityRole={`link`} accessibilityLabel={`Create Account`} style={[styles.button, styles.secondary, state.auth.busy && styles.disabled]} onPress={() => state.navigate(`/signup`)}>
              <Text {...elementProps(`protected-route-signup-text`)} style={[styles.buttonText, styles.secondaryText]}>
                {`Create Account`}
              </Text>
              <ArrowRight {...elementProps(`protected-route-signup-icon`)} size={14} color={palette.ink} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default ProtectedRoute;
