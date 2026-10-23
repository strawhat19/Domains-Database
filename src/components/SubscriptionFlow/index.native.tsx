import { Link } from 'expo-router';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import PricingPlanPrice from '../PricingPlanPrice';
import { useMemo, useEffect, useContext } from 'react';
import { elementProps } from '../../shared/elementProps';
import { getPricingPlanVisual } from '../Pricing/planIcons';
import { useSubscriptionFlow } from './useSubscriptionFlow';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Gem, Zap, Check, Clock3, LogIn, Globe2, Puzzle, Compass, Layers3, RefreshCw, UserPlus, Building2, CreditCard, UsersRound, ArrowUpRight } from 'lucide-react-native';

const planIcons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };
const subscriptionSteps = [`Account`, `Review`, `Payment`] as const;

const SubscriptionFlow = () => {
  const state = useSubscriptionFlow();
  const steps = state.owner ? [`Account`, `Owner Access`] : subscriptionSteps;
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const compact = width < 700;
  const styles = useMemo(() => createStyles(palette, compact), [palette, compact]);
  const visual = state.plan ? getPricingPlanVisual(state.plan) : null;
  const PlanIcon = visual ? planIcons[visual.icon] : Gem;
  const StatusIcon = state.existingAccess ? Check : state.paymentProcessing ? Clock3 : CreditCard;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return <View {...elementProps(`subscription-page`)} style={styles.page}>
    <View {...elementProps(`subscription-heading`)} style={styles.heading} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
      <Link asChild href={routes.pricing.href}><Pressable {...elementProps(`subscription-back`)} style={styles.back} accessibilityRole={`link`}><ArrowUpRight size={14} color={palette.muted} accessible={false} {...elementProps(`subscription-back-icon`)} style={{ transform: [{ rotate: `-135deg` }] }} /><Text {...elementProps(`subscription-back-label`)} style={styles.backLabel}>{`All Plans`}</Text></Pressable></Link>
      <Text {...elementProps(`subscription-eyebrow`)} style={styles.eyebrow}>{`YOUR NEXT STEP`}</Text>
      <Text {...elementProps(`subscription-title`)} style={styles.title} accessibilityRole={`header`}>{`A little more room to grow.`}</Text>
      <Text {...elementProps(`subscription-description`)} style={styles.copy}>{`Create an account or sign in, then review your plan and continue to secure payment.`}</Text>
    </View>
    <View {...elementProps(`subscription-steps`)} style={styles.steps} accessibilityLabel={`Subscription Progress`}>
      {steps.map((label, index) => <View key={label} {...elementProps(`subscription-step`, `${index}`)} style={styles.step} accessible accessibilityLabel={`${label}: ${state.activeStep > index ? `Complete` : state.activeStep === index ? `Current Step` : `Upcoming`}`}>
        <View {...elementProps(`subscription-step-number`, `${index}`)} style={[styles.stepNumber, state.activeStep >= index && styles.stepActive]}>{state.activeStep > index ? <Check size={13} color={palette.contrast} accessible={false} {...elementProps(`subscription-step-icon`, `${index}`)} /> : <Text {...elementProps(`subscription-step-number-label`, `${index}`)} style={[styles.stepNumberLabel, state.activeStep >= index && styles.stepActiveLabel]}>{index + 1}</Text>}</View>
        <Text {...elementProps(`subscription-step-label`, `${index}`)} style={[styles.stepLabel, state.activeStep === index && styles.stepCurrentLabel]}>{label}</Text>
      </View>)}
    </View>
    {!state.validPlan ? <View {...elementProps(`subscription-invalid`)} style={styles.feedback}>
      <Text {...elementProps(`subscription-invalid-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Choose A Plan`}</Text>
      <Text {...elementProps(`subscription-invalid-copy`)} style={styles.copy}>{`Open a published plan to review its subscription.`}</Text>
      <Link asChild href={routes.pricing.href}><Pressable {...elementProps(`subscription-choose-plan`)} style={styles.button} accessibilityRole={`link`}><Gem size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-choose-plan-icon`)} /><Text {...elementProps(`subscription-choose-plan-label`)} style={styles.buttonLabel}>{`View Plans`}</Text></Pressable></Link>
    </View> : <View {...elementProps(`subscription-content`)} style={styles.content}>
      <View {...elementProps(`subscription-plan`)} style={styles.plan}>
        {state.planLoading ? <Text {...elementProps(`subscription-loading-copy`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Loading Plan…`}</Text> : state.planError || !state.plan ? <>
          <Text {...elementProps(`subscription-plan-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{state.planError ? `Plan Could Not Be Loaded` : `Plan Is Unavailable`}</Text>
          <Text {...elementProps(`subscription-plan-error-copy`)} style={styles.copy} accessibilityRole={state.planError ? `alert` : undefined}>{state.planError || `Starter is not currently published. You can still manage an existing subscription.`}</Text>
          <Pressable {...elementProps(`subscription-plan-retry`)} style={styles.button} accessibilityRole={`button`} disabled={state.saving} onPress={state.refresh}><RefreshCw size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-plan-retry-icon`)} /><Text {...elementProps(`subscription-plan-retry-label`)} style={styles.buttonLabel}>{`Try Again`}</Text></Pressable>
        </> : <>
          <Text {...elementProps(`subscription-plan-label`)} style={styles.eyebrow}>{`SELECTED PLAN`}</Text>
          <View {...elementProps(`subscription-plan-heading`)} style={styles.planHeading}><PlanIcon size={26} color={palette[visual?.tone ?? `accent`]} accessible={false} {...elementProps(`subscription-plan-icon`)} /><Text {...elementProps(`subscription-plan-title`)} style={styles.planTitle} accessibilityRole={`header`}>{state.brand.formatText(state.plan.name)}</Text></View>
          <Text {...elementProps(`subscription-plan-description`)} style={styles.copy}>{state.brand.formatText(state.plan.description)}</Text>
          <PricingPlanPrice plan={state.plan} id={`subscription-plan-price`} color={palette[visual?.tone ?? `accent`]} />
          <View {...elementProps(`subscription-plan-features`)} style={styles.features}>{state.features.map(feature => {
            const FeatureIcon = feature.planned ? Clock3 : Check;
            return <View key={feature.id} {...elementProps(`subscription-feature`, feature.id)} style={styles.feature} accessible accessibilityLabel={`${feature.planned ? `Planned` : `Included`}: ${state.brand.formatText(feature.label)}`}><FeatureIcon size={15} color={feature.planned ? palette.warning : palette.accent} accessible={false} {...elementProps(`subscription-feature-icon`, feature.id)} style={styles.featureIcon} /><Text {...elementProps(`subscription-feature-label`, feature.id)} style={styles.featureLabel}>{state.brand.formatText(feature.label)}{feature.planned ? <Text {...elementProps(`subscription-feature-status`, feature.id)} style={styles.featureStatus}>{`  Planned`}</Text> : null}</Text></View>;
          })}</View>
        </>}
      </View>
      <View {...elementProps(`subscription-account`)} style={styles.account}>
        {state.auth.loading ? <Text {...elementProps(`subscription-auth-loading`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Loading Your Account…`}</Text> : !state.signedIn ? <>
          <Text {...elementProps(`subscription-account-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Start With Your Account`}</Text>
          <Text {...elementProps(`subscription-account-copy`)} style={styles.copy}>{`Your plan selection will stay with you when you create an account or sign in.`}</Text>
          {state.auth.error ? <Text {...elementProps(`subscription-auth-error`)} style={styles.error} accessibilityRole={`alert`}>{state.auth.error}</Text> : null}
          <View {...elementProps(`subscription-auth-actions`)} style={styles.actions}>
            <Link asChild href={state.signUpHref}><Pressable {...elementProps(`subscription-signup`)} style={styles.button} accessibilityRole={`link`}><UserPlus size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-signup-icon`)} /><Text {...elementProps(`subscription-signup-label`)} style={styles.buttonLabel}>{`Create Account`}</Text></Pressable></Link>
            <Link asChild href={state.signInHref}><Pressable {...elementProps(`subscription-signin`)} style={[styles.button, styles.secondaryButton]} accessibilityRole={`link`}><LogIn size={16} color={palette.accent} accessible={false} {...elementProps(`subscription-signin-icon`)} /><Text {...elementProps(`subscription-signin-label`)} style={[styles.buttonLabel, styles.secondaryButtonLabel]}>{`Sign In`}</Text></Pressable></Link>
          </View>
          <Text {...elementProps(`subscription-guest-payment-note`)} style={styles.note}>{state.paymentNotice}</Text>
        </> : <>
          <Text {...elementProps(`subscription-account-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{state.owner ? `Your Owner Account Has Access` : state.existingAccess ? `Your Subscription` : `Review Your Subscription`}</Text>
          <Text {...elementProps(`subscription-account-email`)} style={styles.email}>{state.auth.user?.email}</Text>
          {state.notice ? <Text {...elementProps(`subscription-return-notice`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{state.notice}</Text> : null}
          {state.billingLoading && !state.owner ? <Text {...elementProps(`subscription-billing-loading`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Confirming Your Subscription With Stripe…`}</Text> : <>
            {state.status || state.owner ? <View {...elementProps(`subscription-billing-status`)} style={styles.saved} accessibilityLiveRegion={`polite`}>
              <View {...elementProps(`subscription-billing-status-heading`)} style={styles.savedStatus}><StatusIcon size={17} color={state.existingAccess ? palette.success : palette.warning} accessible={false} {...elementProps(`subscription-billing-status-icon`)} /><Text {...elementProps(`subscription-billing-status-label`)} style={[styles.savedStatusLabel, state.existingAccess && { color: palette.success }]}>{state.billingLabel}</Text></View>
              <Text {...elementProps(`subscription-billing-status-copy`)} style={styles.copy}>{state.billingCopy}</Text>
              {state.accessSyncing ? <Text {...elementProps(`subscription-access-syncing`)} style={styles.note}>{state.access.error || `Syncing Your Feature Access…`}</Text> : null}
            </View> : null}
            {state.portalAvailable ? <Pressable {...elementProps(`subscription-manage-billing`)} style={[styles.button, state.existingAccess && styles.secondaryButton, (state.saving || state.auth.busy) && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.action === `portal`, disabled: state.saving || state.auth.busy }} disabled={state.saving || state.auth.busy} onPress={() => { void state.manageBilling(); }}><CreditCard size={16} color={state.existingAccess ? palette.accent : palette.contrast} accessible={false} {...elementProps(`subscription-manage-billing-icon`)} /><Text {...elementProps(`subscription-manage-billing-label`)} style={[styles.buttonLabel, state.existingAccess && styles.secondaryButtonLabel]}>{state.action === `portal` ? `Opening Billing…` : `Manage Billing`}</Text></Pressable> : null}
            {state.existingAccess ? <Link asChild href={routes.domains.href}><Pressable {...elementProps(`subscription-current-portfolio`)} style={styles.button} accessibilityRole={`link`}><Globe2 size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-current-portfolio-icon`)} /><Text {...elementProps(`subscription-current-portfolio-label`)} style={styles.buttonLabel}>{`Open Your Portfolio`}</Text></Pressable></Link> : state.showCheckout ? <>
              <View {...elementProps(`subscription-payment-note`)} style={styles.paymentNote}><CreditCard size={19} color={palette.muted} accessible={false} {...elementProps(`subscription-payment-icon`)} style={styles.paymentIcon} /><Text {...elementProps(`subscription-payment-copy`)} style={[styles.copy, styles.paymentCopy]}>{state.paymentNotice}</Text></View>
              {state.status && !state.status.checkoutAvailable ? <Text {...elementProps(`subscription-checkout-unavailable`)} style={styles.note} accessibilityLiveRegion={`polite`}>{`Checkout is currently unavailable. Please try again later.`}</Text> : null}
              <Pressable {...elementProps(`subscription-confirm`)} style={[styles.button, !state.canConfirm && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.action === `checkout`, disabled: !state.canConfirm }} disabled={!state.canConfirm} onPress={() => { void state.confirm(); }}><CreditCard size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-confirm-icon`)} /><Text {...elementProps(`subscription-confirm-label`)} style={styles.buttonLabel}>{state.action === `checkout` ? `Opening Secure Checkout…` : state.checkoutLabel}</Text></Pressable>
              <View {...elementProps(`subscription-review-terms`)} style={styles.terms}><Text {...elementProps(`subscription-terms-prefix`)} style={styles.note}>{`Review our`}</Text><Link href={routes.terms.href} {...elementProps(`subscription-terms-link`)} style={styles.inlineLink}>{`Terms`}</Link><Text {...elementProps(`subscription-terms-join`)} style={styles.note}>{`and`}</Text><Link href={routes.privacy.href} {...elementProps(`subscription-privacy-link`)} style={styles.inlineLink}>{`Privacy Policy`}</Link><Text {...elementProps(`subscription-terms-suffix`)} style={styles.note}>{`before subscribing.`}</Text></View>
            </> : null}
            {state.paymentProcessing || (!state.portalAvailable && !!state.status?.subscription && !state.existingAccess && !state.showCheckout) ? <Pressable {...elementProps(`subscription-payment-refresh`)} style={styles.textButton} accessibilityRole={`button`} disabled={state.saving} onPress={state.refresh}><RefreshCw size={14} color={palette.accent} accessible={false} {...elementProps(`subscription-payment-refresh-icon`)} /><Text {...elementProps(`subscription-payment-refresh-label`)} style={styles.textButtonLabel}>{`Refresh Billing Status`}</Text></Pressable> : null}
          </>}
          {state.error ? <View {...elementProps(`subscription-billing-feedback`)} style={styles.requestFeedback}><Text {...elementProps(`subscription-billing-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text><Pressable {...elementProps(`subscription-billing-retry`)} style={styles.textButton} accessibilityRole={`button`} disabled={state.saving} onPress={state.refresh}><RefreshCw size={14} color={palette.accent} accessible={false} {...elementProps(`subscription-billing-retry-icon`)} /><Text {...elementProps(`subscription-billing-retry-label`)} style={styles.textButtonLabel}>{`Reload Billing Status`}</Text></Pressable></View> : null}
        </>}
      </View>
    </View>}
  </View>;
};

export default SubscriptionFlow;
