import { Animated, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import StackPillShape from '../StackPillShape';
import type { PricingSkeletonProps } from './skeleton';
import { usePricingSkeleton } from './usePricingSkeleton';
import { elementProps } from '../../shared/elementProps';
import { pricingSkeletonCards, getPricingSkeletonRows } from './skeleton';

const Placeholder = ({ id, style }: { id: string; style: StyleProp<ViewStyle> }) => <View
  style={style}
  {...elementProps(`pricing-loading-placeholder`, id)}
/>;

const PricingSkeleton = ({ cardWidth, expanded = false }: PricingSkeletonProps) => {
  const { styles, palette, motion } = usePricingSkeleton();
  const rows = getPricingSkeletonRows(expanded);

  return <View
    accessible
    style={styles.root}
    accessibilityRole={`progressbar`}
    accessibilityLabel={`Loading Plans`}
    accessibilityState={{ busy: true }}
    {...elementProps(`pricing-loading-skeleton`)}
  >
    <View
      accessible={false}
      style={styles.grid}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`pricing-loading-grid`)}
    >
      {pricingSkeletonCards.map(index => <View
        key={index}
        {...elementProps(`pricing-loading-card`, `${index}`)}
        style={[styles.plan, cardWidth === undefined ? styles.fullCard : { width: cardWidth }]}
      >
        <View {...elementProps(`pricing-loading-card-backing`, `${index}`)} style={styles.cardBacking} pointerEvents={`none`}>
          <StackPillShape id={`pricing-loading-card-${index}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} />
        </View>
        <View {...elementProps(`pricing-loading-card-foreground`, `${index}`)} style={styles.cardForeground} pointerEvents={`none`}>
          <StackPillShape id={`pricing-loading-card-${index}-foreground`} fill={palette.input} stroke={palette.line} />
        </View>
        <Animated.View {...elementProps(`pricing-loading-card-content`, `${index}`)} style={[styles.content, motion]}>
          <Placeholder id={`${index}-title`} style={[styles.placeholder, styles.title]} />
          <View {...elementProps(`pricing-loading-description`, `${index}`)} style={styles.description}>
            <Placeholder id={`${index}-description-0`} style={[styles.placeholder, styles.longLine]} />
            <Placeholder id={`${index}-description-1`} style={[styles.placeholder, styles.longLine, styles.shortLine]} />
          </View>
          <Placeholder id={`${index}-price`} style={[styles.placeholder, styles.price]} />
          <View {...elementProps(`pricing-loading-features`, `${index}`)} style={styles.features}>
            {rows.map(row => <View key={row} {...elementProps(`pricing-loading-feature`, `${index}-${row}`)} style={styles.feature}>
              <Placeholder id={`${index}-${row}-icon`} style={[styles.placeholder, styles.icon]} />
              <View {...elementProps(`pricing-loading-feature-copy`, `${index}-${row}`)} style={styles.featureCopy}>
                <Placeholder id={`${index}-${row}-label`} style={[styles.placeholder, styles.label, row % 2 ? styles.shortLabel : undefined]} />
                {expanded && <View {...elementProps(`pricing-loading-feature-badges`, `${index}-${row}`)} style={styles.badges}>
                  <Placeholder id={`${index}-${row}-badge-0`} style={[styles.placeholder, styles.badge]} />
                  <Placeholder id={`${index}-${row}-badge-1`} style={[styles.placeholder, styles.badge, styles.wideBadge]} />
                </View>}
              </View>
            </View>)}
          </View>
          <Placeholder id={`${index}-action`} style={[styles.placeholder, styles.action]} />
        </Animated.View>
      </View>)}
    </View>
  </View>;
};

export default PricingSkeleton;
