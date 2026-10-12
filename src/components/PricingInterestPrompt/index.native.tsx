import { useMemo } from 'react';
import { createStyles } from './styles.native';
import PricingPlanVotes from '../PricingPlanVotes';
import { elementProps } from '../../shared/elementProps';
import type { PricingInterestPromptProps } from './types';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { X, Check, LogIn, UserPlus, ThumbsUp, RefreshCw } from 'lucide-react-native';
import { Modal, Pressable, Text, View, ScrollView, useWindowDimensions } from 'react-native';

const PricingInterestPrompt = ({ plan, local, state, signedIn, onClose, onConfirm, onRefresh, onVote, onAuth }: PricingInterestPromptProps) => {
  const insets = useSafeAreaInsets();
  const brand = useAppBrand();
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const name = brand.formatText(plan.name);
  const id = `pricing-interest-${plan.id}`;
  const dismiss = () => { if (!state.pending) onClose(); };
  return <Modal transparent visible animationType={reducedMotion ? `none` : `fade`} onRequestClose={dismiss} {...elementProps(`pricing-interest-modal`, plan.id)}>
    <View {...elementProps(`pricing-interest-overlay`, plan.id)} style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Pressable {...elementProps(`pricing-interest-backdrop`, plan.id)} style={styles.backdrop} onPress={dismiss} disabled={state.pending} accessibilityRole={`button`} accessibilityLabel={`Close Plan Interest`} />
      <View {...elementProps(`pricing-interest-panel`, plan.id)} style={[styles.panel, { maxHeight: height - insets.top - insets.bottom - 48 }]} accessibilityViewIsModal onAccessibilityEscape={dismiss}>
        <ScrollView {...elementProps(`pricing-interest-content`, plan.id)} style={styles.scroll} contentContainerStyle={styles.body}>
          <View {...elementProps(`pricing-interest-heading`, plan.id)} style={styles.heading}>
            <ThumbsUp {...elementProps(`pricing-interest-heading-icon`, plan.id)} size={20} color={palette.accent} />
            <Text {...elementProps(`pricing-interest-title`, plan.id)} style={styles.title} accessibilityRole={`header`}>{state.interested ? `Interest Saved` : `Interested In ${name}?`}</Text>
            <Pressable {...elementProps(`pricing-interest-close`, plan.id)} style={styles.close} onPress={dismiss} disabled={state.pending} accessibilityRole={`button`} accessibilityLabel={`Close Plan Interest`}><X {...elementProps(`pricing-interest-close-icon`, plan.id)} size={18} color={palette.muted} /></Pressable>
          </View>
          <Text {...elementProps(`pricing-interest-description`, plan.id)} style={styles.description}>{state.interested ? `Your interest in ${name} has been saved.` : signedIn ? `Let the dev team know you are interested in ${name}.` : `Sign in or create an account to let the dev team know you are interested in ${name}.`}</Text>
          {!state.interested && <View {...elementProps(`pricing-interest-actions`, plan.id)} style={styles.actions}>
            {signedIn ? <Pressable {...elementProps(`pricing-interest-confirm`, plan.id)} accessibilityRole={`button`} disabled={!state.ready || state.pending} style={[styles.button, (!state.ready || state.pending) && styles.disabled]} onPress={onConfirm}><Check {...elementProps(`pricing-interest-confirm-icon`, plan.id)} size={15} color={palette.contrast} /><Text {...elementProps(`pricing-interest-confirm-label`, plan.id)} style={styles.label}>{state.pending ? `Saving…` : `Save My Interest`}</Text></Pressable> : ([`signin`, `signup`] as const).map(mode => {
              const Icon = mode === `signin` ? LogIn : UserPlus;
              return <Pressable key={mode} {...elementProps(`pricing-interest-auth`, `${plan.id}-${mode}`)} accessibilityRole={`button`} disabled={state.pending} accessibilityState={{ disabled: state.pending }} style={[styles.button, mode === `signup` && styles.secondary, state.pending && styles.disabled]} onPress={() => onAuth(mode)}><Icon {...elementProps(`pricing-interest-auth-icon`, `${plan.id}-${mode}`)} size={15} color={mode === `signin` ? palette.contrast : palette.accent} /><Text {...elementProps(`pricing-interest-auth-label`, `${plan.id}-${mode}`)} style={[styles.label, mode === `signup` && styles.secondaryText]}>{mode === `signin` ? `Sign In` : `Create Account`}</Text></Pressable>;
            })}
          </View>}
          {!signedIn && <View {...elementProps(`pricing-interest-guest`, plan.id)} style={styles.guest}><Text {...elementProps(`pricing-interest-guest-description`, plan.id)} style={styles.description}>{`Prefer to skip signup? Upvote without an account.`}</Text><PricingPlanVotes id={`${id}-votes`} name={name} state={state} onVote={onVote} />{!local ? <Text {...elementProps(`pricing-interest-guest-account-note`, plan.id)} style={styles.note}>{`Guest votes stay separate from account feedback.`}</Text> : null}</View>}
          {local ? <Text {...elementProps(`pricing-interest-source`, plan.id)} style={styles.note}>{`Saved On This Device`}</Text> : null}
          {state.loading ? <Text {...elementProps(`pricing-interest-loading`, plan.id)} style={styles.note} accessibilityLiveRegion={`polite`}>{`Loading Your Feedback…`}</Text> : null}
          {state.notice ? <Text {...elementProps(`pricing-interest-notice`, plan.id)} style={[styles.note, styles.success]} accessibilityLiveRegion={`polite`}>{state.notice}</Text> : null}
          {state.error ? <><Text {...elementProps(`pricing-interest-error`, plan.id)} style={[styles.note, styles.error]} accessibilityRole={`alert`}>{state.error}</Text>{!state.ready ? <Pressable {...elementProps(`pricing-interest-retry`, plan.id)} accessibilityRole={`button`} style={[styles.button, styles.secondary]} onPress={onRefresh}><RefreshCw {...elementProps(`pricing-interest-retry-icon`, plan.id)} size={14} color={palette.accent} /><Text {...elementProps(`pricing-interest-retry-label`, plan.id)} style={[styles.label, styles.secondaryText]}>{`Try Again`}</Text></Pressable> : null}</> : null}
        </ScrollView>
      </View>
    </View>
  </Modal>;
};

export default PricingInterestPrompt;
