import { styles } from './styles.native';
import { View, Animated } from 'react-native';
import StackPillShape from '../StackPillShape';
import type { PricingPlanCardProps } from './types';
import { usePricingPlanCard } from './usePricingPlanCard';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const PricingPlanCard = ({ id, width, children }: PricingPlanCardProps) => {
  const state = usePricingPlanCard();
  const { palette } = useTheme();
  return <View
    testID={id}
    nativeID={id}
    accessible={false}
    style={[styles.card, { width }]}
    onPointerEnter={state.onPointerEnter}
    onPointerLeave={state.onPointerLeave}
    onPointerCancel={state.onPointerLeave}
  >
    <View
      accessible={false}
      style={styles.backing}
      pointerEvents={`none`}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`pricing-plan-card-backing`, id)}
    ><StackPillShape id={`${id}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} /></View>
    <View
      accessible={false}
      pointerEvents={`none`}
      style={styles.foreground}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`pricing-plan-card-foreground`, id)}
    ><StackPillShape id={`${id}-foreground`} fill={palette.input} stroke={palette.line} /></View>
    <Animated.View
      accessible={false}
      pointerEvents={`none`}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`pricing-plan-card-hover`, id)}
      style={[styles.foreground, { opacity: state.hoverOpacity }]}
    ><StackPillShape id={`${id}-hover`} fill={palette.subtle} stroke={palette.accent} /></Animated.View>
    {typeof children === `function` ? children(state.hovered) : children}
  </View>;
};

export default PricingPlanCard;
