import { Link } from 'expo-router';
import { routes } from '../../shared/routes';
import { createStyles } from './styles.native';
import { useMemo, useEffect, useContext } from 'react';
import PricingPlanPrice from '../PricingPlanPrice';
import { elementProps } from '../../shared/elementProps';
import { getPricingPlanVisual } from '../Pricing/planIcons';
import { useSubscriptionFlow } from './useSubscriptionFlow';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Gem, Zap, Check, Clock3, LogIn, Globe2, Puzzle, Compass, Layers3, RefreshCw, UserPlus, Building2, CreditCard, UsersRound, ArrowUpRight } from 'lucide-react-native';

const planIcons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };
const steps = [`Account`, `Review`, `Payment`] as const;

const SubscriptionFlow = () => {
  const state = useSubscriptionFlow();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const setHeroBottom = useContext(ScrollContext)?.setHeroBottom;
  const compact = width < 700;
  const styles = useMemo(() => createStyles(palette, compact), [palette, compact]);
  const visual = state.plan ? getPricingPlanVisual(state.plan) : null;
  const PlanIcon = visual ? planIcons[visual.icon] : Gem;
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return <View {...elementProps(`subscription-page`)} style={styles.page}>
    <View {...elementProps(`subscription-heading`)} style={styles.heading} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
      <Link asChild href={routes.pricing.href}><Pressable {...elementProps(`subscription-back`)} style={styles.back} accessibilityRole={`link`}><ArrowUpRight size={14} color={palette.muted} accessible={false} {...elementProps(`subscription-back-icon`)} style={{ transform: [{ rotate: `-135deg` }] }} /><Text {...elementProps(`subscription-back-label`)} style={styles.backLabel}>{`All Plans`}</Text></Pressable></Link>
      <Text {...elementProps(`subscription-eyebrow`)} style={styles.eyebrow}>{`YOUR NEXT STEP`}</Text>
      <Text {...elementProps(`subscription-title`)} style={styles.title} accessibilityRole={`header`}>{`A little more room to grow.`}</Text>
      <Text {...elementProps(`subscription-description`)} style={styles.copy}>{`Create an account or sign in, then review your subscription request.`}</Text>
    </View>
    <View {...elementProps(`subscription-steps`)} style={styles.steps} accessibilityLabel={`Subscription Progress`}>
      {steps.map((label, index) => <View key={label} {...elementProps(`subscription-step`, `${index}`)} style={styles.step} accessible accessibilityLabel={`${label}: ${state.activeStep > index ? `Complete` : state.activeStep === index ? `Current Step` : `Upcoming`}${index === 2 ? `, Coming Soon` : ``}`}>
        <View {...elementProps(`subscription-step-number`, `${index}`)} style={[styles.stepNumber, state.activeStep >= index && styles.stepActive]}>{state.activeStep > index ? <Check size={13} color={palette.contrast} accessible={false} {...elementProps(`subscription-step-icon`, `${index}`)} /> : <Text {...elementProps(`subscription-step-number-label`, `${index}`)} style={[styles.stepNumberLabel, state.activeStep >= index && styles.stepActiveLabel]}>{index + 1}</Text>}</View>
        <View {...elementProps(`subscription-step-copy`, `${index}`)} style={styles.stepCopy}><Text {...elementProps(`subscription-step-label`, `${index}`)} style={[styles.stepLabel, state.activeStep === index && styles.stepCurrentLabel]}>{label}</Text>{index === 2 ? <Text {...elementProps(`subscription-payment-step-note`)} style={styles.stepNote}>{`Coming Soon`}</Text> : null}</View>
      </View>)}
    </View>
    {!state.validPlan ? <View {...elementProps(`subscription-invalid`)} style={styles.feedback}>
      <Text {...elementProps(`subscription-invalid-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Choose A Plan`}</Text>
      <Text {...elementProps(`subscription-invalid-copy`)} style={styles.copy}>{`Open a published plan to start your subscription request.`}</Text>
      <Link asChild href={routes.pricing.href}><Pressable {...elementProps(`subscription-choose-plan`)} style={styles.button} accessibilityRole={`link`}><Gem size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-choose-plan-icon`)} /><Text {...elementProps(`subscription-choose-plan-label`)} style={styles.buttonLabel}>{`View Plans`}</Text></Pressable></Link>
    </View> : state.planLoading ? <View {...elementProps(`subscription-loading`)} style={styles.feedback}><Text {...elementProps(`subscription-loading-copy`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Loading Plan…`}</Text></View> : state.planError || !state.plan ? <View {...elementProps(`subscription-plan-error`)} style={styles.feedback}>
      <Text {...elementProps(`subscription-plan-error-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{state.planError ? `Plan Could Not Be Loaded` : `Plan Is Unavailable`}</Text>
      <Text {...elementProps(`subscription-plan-error-copy`)} style={styles.copy} accessibilityRole={state.planError ? `alert` : undefined}>{state.planError || `This plan is not currently published. Please choose an available plan.`}</Text>
      <Pressable {...elementProps(`subscription-plan-retry`)} style={styles.button} accessibilityRole={`button`} onPress={state.refresh}><RefreshCw size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-plan-retry-icon`)} /><Text {...elementProps(`subscription-plan-retry-label`)} style={styles.buttonLabel}>{`Try Again`}</Text></Pressable>
    </View> : <View {...elementProps(`subscription-content`)} style={styles.content}>
      <View {...elementProps(`subscription-plan`)} style={styles.plan}>
        <Text {...elementProps(`subscription-plan-label`)} style={styles.eyebrow}>{`SELECTED PLAN`}</Text>
        <View {...elementProps(`subscription-plan-heading`)} style={styles.planHeading}><PlanIcon size={26} color={palette[visual?.tone ?? `accent`]} accessible={false} {...elementProps(`subscription-plan-icon`)} /><Text {...elementProps(`subscription-plan-title`)} style={styles.planTitle} accessibilityRole={`header`}>{state.brand.formatText(state.plan.name)}</Text></View>
        <Text {...elementProps(`subscription-plan-description`)} style={styles.copy}>{state.brand.formatText(state.plan.description)}</Text>
        <PricingPlanPrice plan={state.plan} id={`subscription-plan-price`} color={palette[visual?.tone ?? `accent`]} />
        <View {...elementProps(`subscription-plan-features`)} style={styles.features}>{state.features.map(feature => {
          const FeatureIcon = feature.planned ? Clock3 : Check;
          return <View key={feature.id} {...elementProps(`subscription-feature`, feature.id)} style={styles.feature} accessible accessibilityLabel={`${feature.planned ? `Planned` : `Included`}: ${state.brand.formatText(feature.label)}`}><FeatureIcon size={15} color={feature.planned ? palette.warning : palette.accent} accessible={false} {...elementProps(`subscription-feature-icon`, feature.id)} style={styles.featureIcon} /><Text {...elementProps(`subscription-feature-label`, feature.id)} style={styles.featureLabel}>{state.brand.formatText(feature.label)}{feature.planned ? <Text {...elementProps(`subscription-feature-status`, feature.id)} style={styles.featureStatus}>{`  Planned`}</Text> : null}</Text></View>;
        })}</View>
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
        </> : state.access.loading ? <Text {...elementProps(`subscription-access-loading`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Confirming Your Current Plan…`}</Text> : state.access.error ? <>
          <Text {...elementProps(`subscription-account-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{`Current Plan Unavailable`}</Text>
          <Text {...elementProps(`subscription-access-error`)} style={styles.error} accessibilityRole={`alert`}>{state.access.error}</Text>
          <Pressable {...elementProps(`subscription-access-retry`)} style={styles.button} accessibilityRole={`button`} onPress={state.access.refresh}><RefreshCw size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-access-retry-icon`)} /><Text {...elementProps(`subscription-access-retry-label`)} style={styles.buttonLabel}>{`Try Again`}</Text></Pressable>
        </> : state.existingAccess ? <>
          <Text {...elementProps(`subscription-account-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{state.owner ? `Your Owner Account Has Access` : `Your Account Already Has Access`}</Text>
          <Text {...elementProps(`subscription-current-account`)} style={styles.email}>{state.auth.user?.email}</Text>
          <Text {...elementProps(`subscription-current-plan`)} style={styles.copy}>{state.owner ? `You can manage and use this plan's features with your Owner account.` : `Your current plan already includes this tier. You can continue to your portfolio.`}</Text>
          <Link asChild href={routes.domains.href}><Pressable {...elementProps(`subscription-current-portfolio`)} style={styles.button} accessibilityRole={`link`}><Globe2 size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-current-portfolio-icon`)} /><Text {...elementProps(`subscription-current-portfolio-label`)} style={styles.buttonLabel}>{`Open Your Portfolio`}</Text></Pressable></Link>
        </> : <>
          <Text {...elementProps(`subscription-account-title`)} style={styles.sectionTitle} accessibilityRole={`header`}>{state.saved ? `Subscription Request Saved` : state.changedOffer ? `Review Updated Plan` : `Review Your Request`}</Text>
          <Text {...elementProps(`subscription-account-email`)} style={styles.email}>{state.auth.user?.email}</Text>
          {state.local ? <Text {...elementProps(`subscription-storage-note`)} style={styles.note}>{`This demo saves subscription requests on this device only.`}</Text> : null}
          {state.changedOffer ? <Text {...elementProps(`subscription-offer-changed`)} style={styles.copy}>{`This plan has changed since your saved request. Review the current price and billing period, then confirm your updated request.`}</Text> : null}
          {state.requestLoading ? <Text {...elementProps(`subscription-request-loading`)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Loading Your Subscription Request…`}</Text> : state.saved ? <View {...elementProps(`subscription-saved`)} style={styles.saved} accessibilityLiveRegion={`polite`}>
            <View {...elementProps(`subscription-saved-status`)} style={styles.savedStatus}><Clock3 size={17} color={palette.warning} accessible={false} {...elementProps(`subscription-saved-status-icon`)} /><Text {...elementProps(`subscription-saved-status-label`)} style={styles.savedStatusLabel}>{`Awaiting Payment Setup`}</Text></View>
            <Text {...elementProps(`subscription-saved-copy`)} style={styles.copy}>{`Your request is saved to your account. Complete payment once it becomes available to activate your subscription.`}</Text>
            <Text {...elementProps(`subscription-saved-date`)} style={styles.note}>{`Requested ${state.requestedDate}`}</Text>
          </View> : null}
          <View {...elementProps(`subscription-payment-note`)} style={styles.paymentNote}><CreditCard size={19} color={palette.muted} accessible={false} {...elementProps(`subscription-payment-icon`)} style={styles.paymentIcon} /><Text {...elementProps(`subscription-payment-copy`)} style={[styles.copy, styles.paymentCopy]}>{state.paymentNotice}</Text></View>
          {state.error ? <View {...elementProps(`subscription-request-feedback`)} style={styles.requestFeedback}><Text {...elementProps(`subscription-request-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text><Pressable {...elementProps(`subscription-request-retry`)} style={styles.textButton} accessibilityRole={`button`} onPress={state.refresh}><RefreshCw size={14} color={palette.accent} accessible={false} {...elementProps(`subscription-request-retry-icon`)} /><Text {...elementProps(`subscription-request-retry-label`)} style={styles.textButtonLabel}>{`Reload Request`}</Text></Pressable></View> : null}
          {!state.saved ? <Pressable {...elementProps(`subscription-confirm`)} style={[styles.button, !state.canConfirm && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ busy: state.saving, disabled: !state.canConfirm }} disabled={!state.canConfirm} onPress={() => { void state.confirm(); }}><Check size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-confirm-icon`)} /><Text {...elementProps(`subscription-confirm-label`)} style={styles.buttonLabel}>{state.saving ? `Saving Request…` : `Save Subscription Request`}</Text></Pressable> : <Link asChild href={routes.domains.href}><Pressable {...elementProps(`subscription-saved-portfolio`)} style={styles.button} accessibilityRole={`link`}><Globe2 size={16} color={palette.contrast} accessible={false} {...elementProps(`subscription-saved-portfolio-icon`)} /><Text {...elementProps(`subscription-saved-portfolio-label`)} style={styles.buttonLabel}>{`Continue With Free`}</Text></Pressable></Link>}
          <View {...elementProps(`subscription-review-terms`)} style={styles.terms}><Text {...elementProps(`subscription-terms-prefix`)} style={styles.note}>{`Review our`}</Text><Link href={routes.terms.href} {...elementProps(`subscription-terms-link`)} style={styles.inlineLink}>{`Terms`}</Link><Text {...elementProps(`subscription-terms-join`)} style={styles.note}>{`and`}</Text><Link href={routes.privacy.href} {...elementProps(`subscription-privacy-link`)} style={styles.inlineLink}>{`Privacy Policy`}</Link></View>
        </>}
      </View>
    </View>}
  </View>;
};

export default SubscriptionFlow;
