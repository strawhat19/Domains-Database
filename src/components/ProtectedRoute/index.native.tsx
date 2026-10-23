import { useMemo } from 'react';
import StatePanel from '../StatePanel';
import { Roles } from '../../types/types';
import type { PropsWithChildren } from 'react';
import { ArrowRight } from 'lucide-react-native';
import { createStyles } from './styles.native';
import { useProtectedRoute } from './useProtectedRoute';
import { elementProps } from '../../shared/elementProps';
import { Pressable, Text, View, Platform } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import AccountLoadingSkeleton from '../AccountLoadingSkeleton';
import type { AdminSection } from '../../shared/admin/permissions';

type ProtectedRouteProps = PropsWithChildren<{ minRole?: Roles; adminSection?: AdminSection }>;
const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

const ProtectedRoute = ({ children, minRole = Roles.Subscriber, adminSection }: ProtectedRouteProps) => {
  const state = useProtectedRoute(minRole, adminSection);
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  if (state.auth.loading) return <AccountLoadingSkeleton />;
  if (state.allowed) return <>{children}</>;

  return (
    <View {...elementProps(`protected-route-page`)} style={styles.page}>
      <StatePanel
        icon={`lock`}
        id={`protected-route-panel`}
        eyebrow={`Your Account`}
        title={state.auth.user ? `This page needs permission` : `Sign in to view this`}
        description={state.auth.user ? adminSection ? `Your role does not have access to this admin section. Review your account in your profile or contact an owner.` : `This page requires an active account with the ${minRole} role or higher. You can review your current account in your profile.` : `Keep your domains, connections, and account settings together. Sign in or create an account to continue.`}
      >
        <Pressable {...elementProps(`protected-route-primary-link`)} disabled={state.auth.busy} accessibilityRole={`link`} accessibilityLabel={state.auth.user ? `View Profile` : `Sign In`} style={({ pressed }) => [styles.button, pressed && styles.pressed, state.auth.busy && styles.disabled]} onPress={() => state.navigate(state.auth.user ? `/profile` : `/signin`)}>
          <Text {...elementProps(`protected-route-primary-text`)} style={styles.buttonText}>
            {state.auth.user ? `View Profile` : `Sign In`}
          </Text>
          <ArrowRight {...elementProps(`protected-route-primary-icon`)} {...decorativeIconProps} size={14} color={palette.contrast} />
        </Pressable>
        {!state.auth.user && (
          <Pressable {...elementProps(`protected-route-signup-link`)} disabled={state.auth.busy} accessibilityRole={`link`} accessibilityLabel={`Create Account`} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed, state.auth.busy && styles.disabled]} onPress={() => state.navigate(`/signup`)}>
            <Text {...elementProps(`protected-route-signup-text`)} style={[styles.buttonText, styles.secondaryText]}>
              {`Create Account`}
            </Text>
            <ArrowRight {...elementProps(`protected-route-signup-icon`)} {...decorativeIconProps} size={14} color={palette.ink} />
          </Pressable>
        )}
      </StatePanel>
    </View>
  );
};

export default ProtectedRoute;
