import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import type { PricingPlanPriceProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getPricingPeriod, getPricingPriceLabel, getPricingAmountParts } from '../Pricing/presentation';

const PricingPlanPrice = ({ id, plan, color }: PricingPlanPriceProps) => {
  const { palette } = useTheme();
  const period = getPricingPeriod(plan);
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View accessible nativeID={id} testID={id} style={styles.price} accessibilityLabel={getPricingPriceLabel(plan)}>
    <Text {...elementProps(`pricing-plan-price-amount`, id)} style={styles.amount} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
      {getPricingAmountParts(plan).map((part, index) => <Text
        key={index}
        {...elementProps(`pricing-plan-price-part`, `${id}-${index}`)}
        style={part.type === `currency` ? [styles.currency, color ? { color } : undefined] : part.type === `literal` ? styles.literal : undefined}
      >{part.value}</Text>)}
    </Text>
    {period ? <Text {...elementProps(`pricing-plan-price-period`, id)} style={styles.period} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>{period}</Text> : null}
  </View>;
};

export default PricingPlanPrice;
