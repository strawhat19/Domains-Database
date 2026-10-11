import { useMemo } from 'react';
import { Link } from 'expo-router';
import { usePricing } from './usePricing';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Check, ArrowUpRight, RefreshCw } from 'lucide-react-native';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { getPricingAmount, getPricingPeriod, pricingNote, pricingDescription } from './presentation';

const Pricing = () => {
  const state = usePricing();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const columns = width >= 900 ? 3 : 1;
  const cardWidth = (Math.max(0, Math.min(width - (compact ? 40 : 64), 1056)) - (columns - 1) * 14) / columns;
  const renderCardShape = (id: string, highlighted: boolean) => <>
    <View {...elementProps(`landing-card-backing`, id)} style={styles.cardBacking} pointerEvents={`none`} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}><StackPillShape id={`${id}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} /></View>
    <View {...elementProps(`landing-card-foreground`, id)} style={styles.cardForeground} pointerEvents={`none`} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}><StackPillShape id={`${id}-foreground`} fill={highlighted ? palette.subtle : palette.input} stroke={highlighted ? palette.accent : palette.line} /></View>
  </>;
  return <View {...elementProps(`landing-pricing`)} style={[styles.section, compact && styles.compactSection]}>
    <View {...elementProps(`landing-pricing-inner`)} style={styles.inner}>
      <View {...elementProps(`landing-pricing-heading`)} style={styles.heading}>
        <Text {...elementProps(`landing-pricing-eyebrow`)} style={styles.eyebrow}>{`ROOM TO GROW`}</Text>
        <Text {...elementProps(`landing-pricing-title`)} style={styles.title} accessibilityRole={`header`}>{`Plans for your next idea.`}</Text>
        <Text {...elementProps(`landing-pricing-description`)} style={styles.description}>{pricingDescription}</Text>
      </View>
      {state.loading ? <View {...elementProps(`pricing-loading`)} style={styles.feedback}><Text {...elementProps(`pricing-loading-label`)} style={styles.description} accessibilityRole={`alert`}>{`Loading Plans…`}</Text></View> : state.error ? <View {...elementProps(`pricing-error`)} style={styles.feedback}>
        <Text {...elementProps(`pricing-error-description`)} style={[styles.description, { color: palette.danger }]} accessibilityRole={`alert`}>{`Plans Could Not Be Loaded — Please Try Again`}</Text>
        <Pressable {...elementProps(`pricing-retry`)} style={styles.button} accessibilityRole={`button`} onPress={state.refresh}><RefreshCw {...elementProps(`pricing-retry-icon`)} color={palette.contrast} size={15} /><Text {...elementProps(`pricing-retry-label`)} style={styles.buttonText}>{`Try Again`}</Text></Pressable>
      </View> : state.plans.length ? <View {...elementProps(`landing-pricing-grid`)} style={styles.grid}>
        {state.plans.map(plan => <View key={plan.id} {...elementProps(`landing-pricing-plan`, plan.id)} style={[styles.plan, { width: cardWidth }]}>
          {renderCardShape(`landing-plan-${plan.id}`, plan.highlighted)}
          <View {...elementProps(`landing-pricing-plan-heading`, plan.id)} style={styles.cardTop}><Text {...elementProps(`landing-pricing-plan-name`, plan.id)} style={styles.cardTitle} accessibilityRole={`header`}>{plan.name}</Text>{plan.highlighted ? <Text {...elementProps(`landing-pricing-plan-status`, plan.id)} style={styles.planStatus}>{`Featured Plan`}</Text> : null}</View>
          <Text {...elementProps(`landing-pricing-plan-description`, plan.id)} style={styles.cardDescription}>{plan.description}</Text>
          <Text {...elementProps(`landing-pricing-plan-price`, plan.id)} style={styles.price}>{getPricingAmount(plan)}<Text {...elementProps(`landing-pricing-plan-period`, plan.id)} style={styles.period}>{getPricingPeriod(plan)}</Text></Text>
          <View {...elementProps(`landing-pricing-features`, plan.id)} style={styles.features}>{plan.features.map((feature, index) => <View key={`${plan.id}-${index}`} {...elementProps(`landing-pricing-feature`, `${plan.id}-${index}`)} style={styles.feature}><Check {...elementProps(`landing-pricing-feature-icon`, `${plan.id}-${index}`)} size={14} color={palette.accent} /><Text {...elementProps(`landing-pricing-feature-text`, `${plan.id}-${index}`)} style={styles.featureText}>{feature}</Text></View>)}</View>
          <Link asChild href={plan.priceCents === 0 && plan.slug === `free` ? routes.domains.href : routes.contact.href}><Pressable {...elementProps(`landing-pricing-plan-link`, plan.id)} accessibilityRole={`link`} style={[styles.button, !plan.highlighted && styles.secondaryButton]}><Text {...elementProps(`landing-pricing-plan-link-label`, plan.id)} style={[styles.buttonText, !plan.highlighted && styles.secondaryButtonText]}>{plan.priceCents === 0 && plan.slug === `free` ? `Open Your Portfolio` : `Ask About ${plan.name}`}</Text><ArrowUpRight {...elementProps(`landing-pricing-plan-link-icon`, plan.id)} size={15} color={plan.highlighted ? palette.contrast : palette.accent} /></Pressable></Link>
        </View>)}
      </View> : <View {...elementProps(`pricing-empty`)} style={styles.feedback}>
        <Text {...elementProps(`pricing-empty-description`)} style={styles.description}>{`Plan details will be available here soon. You can start organizing your domains today.`}</Text>
        <Link asChild href={routes.domains.href}><Pressable {...elementProps(`pricing-empty-action`)} style={styles.button} accessibilityRole={`link`}><ArrowUpRight {...elementProps(`pricing-empty-action-icon`)} size={15} color={palette.contrast} /><Text {...elementProps(`pricing-empty-action-label`)} style={styles.buttonText}>{`Explore Domains`}</Text></Pressable></Link>
      </View>}
      <Text {...elementProps(`landing-pricing-note`)} style={styles.note}>{pricingNote}</Text>
    </View>
  </View>;
};

export default Pricing;
