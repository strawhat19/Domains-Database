import { useMemo } from 'react';
import StatePanel from '../StatePanel';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import FeatureLoadingSkeleton from '../FeatureLoadingSkeleton';
import { View, Text, Platform, Pressable } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ArrowUpRight, LogIn, RefreshCw } from 'lucide-react-native';
import { useStarterPlanGate, type StarterPlanGateProps } from './useStarterPlanGate';

const decorativeIconProps = Platform.OS === `web` ? { 'aria-hidden': true as const } : { accessible: false };

const StarterPlanGate = ({ feature, children }: StarterPlanGateProps) => {
  const state = useStarterPlanGate(feature);
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  if (state.loading) return <FeatureLoadingSkeleton feature={feature} />;
  if (!state.error && state.allowed) return <>{children}</>;

  return <View {...elementProps(`starter-plan-gate`, feature)} style={styles.page}>
    <StatePanel
      alert={!!state.error}
      icon={state.error ? `error` : feature}
      id={`starter-plan-gate-content-${feature}`}
      eyebrow={state.error ? `Account Access` : `Starter & Above`}
      badge={!state.error && routes[feature].beta ? `Beta` : undefined}
      title={state.error ? `Plan Access Unavailable` : `Unlock ${state.title}`}
      detail={!state.error && !state.signedIn ? `Already on Starter or higher? Sign in to unlock access.` : undefined}
      description={state.error ? `We couldn’t confirm your access. Try again to check your account and plan.` : state.description}
    >
      {state.error ? <Pressable {...elementProps(`starter-plan-gate-action`, `${feature}-retry`)} style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={state.refresh} accessibilityRole={`button`} accessibilityLabel={`Check Plan Access Again`}>
        <RefreshCw {...elementProps(`starter-plan-gate-action-icon`, `${feature}-retry`)} {...decorativeIconProps} size={15} color={palette.contrast} />
        <Text {...elementProps(`starter-plan-gate-action-label`, `${feature}-retry`)} style={styles.buttonText}>{`Try Again`}</Text>
      </Pressable> : <>
        <Pressable {...elementProps(`starter-plan-gate-action`, `${feature}-pricing`)} style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={state.viewPlans} accessibilityRole={`link`} accessibilityLabel={state.signedIn ? `Upgrade Plan To Unlock ${state.title}` : `Choose A Plan To Unlock ${state.title}`}>
          <Text {...elementProps(`starter-plan-gate-action-label`, `${feature}-pricing`)} style={styles.buttonText}>{state.signedIn ? `Upgrade Plan` : `Choose A Plan`}</Text>
          <ArrowUpRight {...elementProps(`starter-plan-gate-action-icon`, `${feature}-pricing`)} {...decorativeIconProps} size={15} color={palette.contrast} />
        </Pressable>
        {!state.signedIn && <Pressable {...elementProps(`starter-plan-gate-action`, `${feature}-signin`)} style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]} onPress={state.signIn} accessibilityRole={`link`} accessibilityLabel={`Sign In To Access ${state.title}`}>
          <LogIn {...elementProps(`starter-plan-gate-action-icon`, `${feature}-signin`)} {...decorativeIconProps} size={15} color={palette.ink} />
          <Text {...elementProps(`starter-plan-gate-action-label`, `${feature}-signin`)} style={[styles.buttonText, styles.secondaryText]}>{`Sign In`}</Text>
        </Pressable>}
      </>}
    </StatePanel>
  </View>;
};

export default StarterPlanGate;
