import { useMemo } from 'react';
import { Roles } from '../../types/types';
import type { PropsWithChildren } from 'react';
import { createStyles } from './styles.native';
import { useProtectedRoute } from './useProtectedRoute';
import { elementProps } from '../../shared/elementProps';
import { LockKeyhole, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import AccountLoadingSkeleton from '../AccountLoadingSkeleton';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

type ProtectedRouteProps = PropsWithChildren<{ minRole?: Roles }>;

const ProtectedRoute = ({ children, minRole = Roles.Subscriber }: ProtectedRouteProps) => {
  const state = useProtectedRoute(minRole);
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width <= 600 && height <= 620;
  const landscape = width > 600 && height <= 500;

  if (state.auth.loading) return <AccountLoadingSkeleton />;
  if (state.allowed) return <>{children}</>;

  return (
    <View {...elementProps(`protected-route-page`)} style={[styles.page, compact && styles.compactPage, landscape && styles.landscapePage]}>
      <View {...elementProps(`protected-route-panel`)} style={[styles.panel, compact && styles.compactPanel, landscape && styles.landscapePanel]}>
        <View {...elementProps(`protected-route-mark`)} style={styles.mark}>
          <LockKeyhole {...elementProps(`protected-route-icon`)} size={19} color={palette.accent} />
        </View>
        <Text {...elementProps(`protected-route-title`)} style={[styles.title, compact && styles.compactTitle, landscape && styles.landscapeTitle]} accessibilityRole={`header`}>
          {state.auth.user ? `More access is needed` : `Sign in to view this`}
        </Text>
        <Text {...elementProps(`protected-route-description`)} style={[styles.copy, (compact || landscape) && styles.compactCopy, landscape && styles.landscapeCopy]}>
          {state.auth.user ? `This page requires the ${minRole} role or higher. You can review your current account in your profile.` : `Sign in or create an account to manage your profile and account settings.`}
        </Text>
        <View {...elementProps(`protected-route-actions`)} style={[styles.actions, compact && styles.compactActions, landscape && styles.landscapeActions]}>
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
