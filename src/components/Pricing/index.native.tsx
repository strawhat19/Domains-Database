import { useMemo } from 'react';
import { Link } from 'expo-router';
import { usePricing } from './usePricing';
import { routes } from '../../shared/routes';
import PricingFeature from '../PricingFeature';
import PricingPlanCard from '../PricingPlanCard';
import { createStyles } from './styles.native';
import PricingSkeleton from '../PricingSkeleton';
import PricingPlanPrice from '../PricingPlanPrice';
import PricingPlanVotes from '../PricingPlanVotes';
import { pricingDescription } from './presentation';
import { getPricingPlanVisual } from './planIcons';
import { elementProps } from '../../shared/elementProps';
import { usePricingInterest } from './usePricingInterest';
import PricingInterestPrompt from '../PricingInterestPrompt';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import { getPricingFeatures } from '../../shared/plans/pricingFeatures';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { Gem, Zap, Check, Globe2, Puzzle, Compass, Layers3, ThumbsUp, RefreshCw, Building2, UsersRound, ArrowUpRight } from 'lucide-react-native';

const planIcons = { Gem, Zap, Globe2, Puzzle, Compass, Layers3, Building2, UsersRound };

const Pricing = () => {
  const state = usePricing();
  const brand = useAppBrand();
  const { flags, ready } = useFeatureFlags();
  const contactEnabled = ready && flags.contact;
  const pricingEnabled = ready && flags.pricingTable;
  const interestEnabled = ready && !flags.pricingTable;
  const interest = usePricingInterest(state.plans, interestEnabled);
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const columns = width >= 1200 ? 4 : width >= 700 ? 2 : 1;
  const cardWidth = (Math.max(0, Math.min(width - (compact ? 40 : 64), 1056)) - (columns - 1) * 14) / columns;
  return <View {...elementProps(`landing-pricing`)} style={[styles.section, compact && styles.compactSection]}>
    <View {...elementProps(`landing-pricing-inner`)} style={styles.inner}>
      <View {...elementProps(`landing-pricing-heading`)} style={[styles.heading, styles.pricingHeading]}>
        <Text {...elementProps(`landing-pricing-eyebrow`)} style={styles.eyebrow}>{`ROOM TO GROW`}</Text>
        <Text {...elementProps(`landing-pricing-title`)} style={styles.title} accessibilityRole={`header`}>{`Plans for your next idea.`}</Text>
        <Text {...elementProps(`landing-pricing-description`)} style={[styles.description, styles.pricingDescription]}>{interestEnabled ? `Tell us which plans interest you. Sign in to share your interest or vote without creating an account.` : contactEnabled ? pricingDescription : `Explore the plans and features for your next idea.`}</Text>
        {interestEnabled && interest.local ? <Text {...elementProps(`landing-pricing-interest-source`)} style={styles.interestNote}>{`Feedback Is Saved On This Device`}</Text> : null}
      </View>
      {state.loading ? <PricingSkeleton cardWidth={cardWidth} expanded={state.showFeaturePreview} /> : state.error ? <View {...elementProps(`pricing-error`)} style={styles.feedback}>
        <Text {...elementProps(`pricing-error-description`)} style={[styles.description, { color: palette.danger }]} accessibilityRole={`alert`}>{state.error}</Text>
        <Pressable {...elementProps(`pricing-retry`)} style={styles.button} accessibilityRole={`button`} onPress={state.refresh}><RefreshCw {...elementProps(`pricing-retry-icon`)} color={palette.contrast} size={15} /><Text {...elementProps(`pricing-retry-label`)} style={styles.buttonText}>{`Try Again`}</Text></Pressable>
      </View> : state.plans.length ? <View {...elementProps(`landing-pricing-grid`)} style={styles.grid}>
        {state.plans.map(plan => {
          const visual = getPricingPlanVisual(plan);
          const PlanIcon = planIcons[visual.icon];
          const planInterest = interest.getState(plan.id);
          return <PricingPlanCard key={plan.id} id={`landing-pricing-plan-${plan.id}`} width={cardWidth}>{hovered => <>
          <View {...elementProps(`landing-pricing-plan-heading`, plan.id)} style={styles.cardTop}><View {...elementProps(`landing-pricing-plan-title`, plan.id)} style={styles.planTitle}><PlanIcon size={28} strokeWidth={1.8} color={palette[visual.tone]} accessible={false} {...elementProps(`landing-pricing-plan-name-icon`, plan.id)} /><Text {...elementProps(`landing-pricing-plan-name`, plan.id)} style={styles.planName} accessibilityRole={`header`}>{brand.formatText(plan.name)}</Text></View></View>
          <Text {...elementProps(`landing-pricing-plan-description`, plan.id)} style={styles.cardDescription}>{brand.formatText(plan.description)}</Text>
          <PricingPlanPrice plan={plan} id={`landing-pricing-plan-price-${plan.id}`} color={palette[visual.tone]} />
          <View {...elementProps(`landing-pricing-features`, plan.id)} style={styles.features}>
            {state.showFeaturePreview ? getPricingFeatures(plan).map(feature => <PricingFeature
              key={feature.id}
              feature={feature}
              id={`${plan.id}-${feature.id}`}
            />) : plan.features.map((feature, index) => <View
              key={`${plan.id}-${index}`}
              style={styles.feature}
              {...elementProps(`landing-pricing-feature`, `${plan.id}-${index}`)}
            >
              <Check size={14} color={palette.accent} {...elementProps(`landing-pricing-feature-icon`, `${plan.id}-${index}`)} />
              <Text style={styles.featureText} {...elementProps(`landing-pricing-feature-text`, `${plan.id}-${index}`)}>{brand.formatText(feature)}</Text>
            </View>)}
          </View>
          {pricingEnabled && (contactEnabled || (plan.priceCents === 0 && plan.slug === `free`)) && <Link asChild href={plan.priceCents === 0 && plan.slug === `free` ? routes.domains.href : routes.contact.href}><Pressable {...elementProps(`landing-pricing-plan-link`, plan.id)} accessibilityRole={`link`} style={[styles.button, !hovered && styles.secondaryButton]}><Text {...elementProps(`landing-pricing-plan-link-label`, plan.id)} style={[styles.buttonText, !hovered && styles.secondaryButtonText]}>{plan.priceCents === 0 && plan.slug === `free` ? `Open Your Portfolio` : `Ask About ${brand.formatText(plan.name)}`}</Text><ArrowUpRight {...elementProps(`landing-pricing-plan-link-icon`, plan.id)} size={15} color={hovered ? palette.contrast : palette.accent} /></Pressable></Link>}
          {interestEnabled ? <View {...elementProps(`landing-plan-interest`, plan.id)} style={styles.interest}>
            <Pressable
              accessibilityRole={`button`}
              {...elementProps(`landing-plan-interest-action`, plan.id)}
              onPress={() => { void interest.register(plan.id); }}
              disabled={planInterest.pending || planInterest.interested || (interest.signedIn && !planInterest.ready)}
              style={[styles.button, !hovered && styles.secondaryButton, (planInterest.pending || planInterest.interested || (interest.signedIn && !planInterest.ready)) && styles.disabled]}
              accessibilityState={{ busy: planInterest.pending, disabled: planInterest.pending || planInterest.interested || (interest.signedIn && !planInterest.ready) }}
            >{planInterest.interested ? <Check {...elementProps(`landing-plan-interest-icon`, plan.id)} size={15} color={hovered ? palette.contrast : palette.accent} /> : <ThumbsUp {...elementProps(`landing-plan-interest-icon`, plan.id)} size={15} color={hovered ? palette.contrast : palette.accent} />}<Text {...elementProps(`landing-plan-interest-label`, plan.id)} style={[styles.buttonText, !hovered && styles.secondaryButtonText]}>{planInterest.pending ? `Saving…` : planInterest.interested ? `Interest Saved` : `I'm Interested`}</Text></Pressable>
            <Text {...elementProps(`landing-plan-votes-label`, plan.id)} style={styles.interestNote}>{interest.signedIn ? `Upvote This Plan` : `Upvote Without Signup`}</Text>
            <PricingPlanVotes id={`landing-plan-votes-${plan.id}`} name={brand.formatText(plan.name)} state={planInterest} onVote={() => { void interest.vote(plan.id); }} />
            {planInterest.loading ? <Text {...elementProps(`landing-plan-interest-loading`, plan.id)} style={styles.interestNote} accessibilityLiveRegion={`polite`}>{`Loading Your Feedback…`}</Text> : null}
            {planInterest.notice ? <Text {...elementProps(`landing-plan-interest-notice`, plan.id)} style={[styles.interestNote, { color: palette.success }]} accessibilityLiveRegion={`polite`}>{planInterest.notice}</Text> : null}
            {planInterest.error ? <View {...elementProps(`landing-plan-interest-feedback`, plan.id)} style={styles.interest}><Text {...elementProps(`landing-plan-interest-error`, plan.id)} style={[styles.interestNote, { color: palette.danger }]} accessibilityRole={`alert`}>{planInterest.error}</Text>{!planInterest.ready ? <Pressable {...elementProps(`landing-plan-interest-retry`, plan.id)} style={[styles.button, styles.secondaryButton]} accessibilityRole={`button`} onPress={interest.refresh}><RefreshCw {...elementProps(`landing-plan-interest-retry-icon`, plan.id)} size={14} color={palette.accent} /><Text {...elementProps(`landing-plan-interest-retry-label`, plan.id)} style={[styles.buttonText, styles.secondaryButtonText]}>{`Try Again`}</Text></Pressable> : null}</View> : null}
          </View> : null}
        </>}</PricingPlanCard>; })}
      </View> : <View {...elementProps(`pricing-empty`)} style={styles.feedback}>
        <Text {...elementProps(`pricing-empty-description`)} style={styles.description}>{`Plan details will be available here soon. You can start organizing your domains today.`}</Text>
        <Link asChild href={routes.domains.href}><Pressable {...elementProps(`pricing-empty-action`)} style={styles.button} accessibilityRole={`link`}><ArrowUpRight {...elementProps(`pricing-empty-action-icon`)} size={15} color={palette.contrast} /><Text {...elementProps(`pricing-empty-action-label`)} style={styles.buttonText}>{`Explore Domains`}</Text></Pressable></Link>
      </View>}
    </View>
    {interest.prompt ? <PricingInterestPrompt
      key={interest.prompt.id}
      plan={interest.prompt}
      local={interest.local}
      signedIn={interest.signedIn}
      onClose={interest.closePrompt}
      onRefresh={interest.refresh}
      onAuth={interest.authenticate}
      state={interest.getState(interest.prompt.id)}
      onConfirm={() => { if (interest.prompt) void interest.register(interest.prompt.id); }}
      onVote={() => { if (interest.prompt) void interest.vote(interest.prompt.id); }}
    /> : null}
  </View>;
};

export default Pricing;
