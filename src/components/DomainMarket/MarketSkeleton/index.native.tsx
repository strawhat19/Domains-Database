import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { MarketSkeletonProps } from './types';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

const MarketSkeleton = ({ kind, label }: MarketSkeletonProps) => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const styles = useMemo(() => createStyles(palette, wide), [palette, wide]);
  const block = (id: string, style: StyleProp<ViewStyle>) => <View {...elementProps(`market-skeleton-placeholder`, `${kind}-${id}`)} style={[styles.placeholder, style]} />;
  const actions = <View {...elementProps(`market-skeleton-actions`, kind)} style={styles.actions}>
    {block(`primary`, styles.buttonShape)}
    {block(`secondary`, styles.buttonShape)}
  </View>;

  const renderContent = () => {
    switch (kind) {
      case `browse`: return <View {...elementProps(`market-skeleton-listings`)} style={styles.listGrid}>
        {(wide ? [0, 1, 2, 3] : [0, 1, 2]).map(index => <View key={index} {...elementProps(`market-skeleton-listing`, `${index}`)} style={[styles.panel, styles.listCard]}>
          <View style={styles.listingHeadline}>
            {block(`${index}-icon`, styles.icon)}
            <View style={styles.copyStack}>{block(`${index}-domain`, styles.title)}{block(`${index}-price`, [styles.line, styles.short])}</View>
          </View>
          {block(`${index}-description`, styles.line)}
          <View style={styles.headingRow}>{block(`${index}-seller-avatar`, styles.avatar)}{block(`${index}-seller-name`, [styles.line, styles.short])}</View>
        </View>)}
      </View>;
      case `sell`: return <>
        {block(`profile`, styles.buttonShape)}
        <View {...elementProps(`market-skeleton-seller-editor`)} style={styles.panel}>
          {block(`title`, styles.title)}
          {block(`domain-label`, [styles.line, styles.short])}{block(`domain-field`, styles.field)}
          {block(`price-label`, [styles.line, styles.short])}{block(`price-field`, styles.field)}
          {block(`description`, styles.textArea)}
          {block(`submit`, styles.buttonShape)}
        </View>
      </>;
      case `listing`: return <>
        <View {...elementProps(`market-skeleton-listing-detail`)} style={styles.panel}>
          <View style={styles.headingRow}>
            {block(`icon`, styles.icon)}
            <View style={styles.copyStack}>{block(`title`, styles.title)}{block(`price`, [styles.line, styles.short])}</View>
          </View>
          {block(`description`, styles.line)}
          {block(`description-end`, [styles.line, styles.medium])}
          <View style={styles.headingRow}>{block(`seller-avatar`, styles.avatar)}{block(`seller-name`, [styles.line, styles.short])}</View>
        </View>
        {actions}
      </>;
      case `inbox`: return <>
        {[0, 1, 2].map(index => <View key={index} {...elementProps(`market-skeleton-thread`, `${index}`)} style={styles.thread}>
          <View style={styles.copyStack}>
            {block(`${index}-domain`, [styles.line, styles.medium])}
            <View style={styles.headingRow}>{block(`${index}-avatar`, styles.avatar)}{block(`${index}-name`, [styles.line, styles.short])}</View>
          </View>
        </View>)}
      </>;
      case `orders`: return <>
        {[0, 1].map(index => <View key={index} {...elementProps(`market-skeleton-order`, `${index}`)} style={styles.panel}>
          <View style={styles.headingRow}>
            <View style={styles.grow}>{block(`${index}-domain`, styles.title)}</View>
            {block(`${index}-status`, styles.chip)}
          </View>
          {block(`${index}-amount`, [styles.line, styles.short])}
          {block(`${index}-date`, [styles.line, styles.medium])}
        </View>)}
      </>;
      case `messages`: return <>
        {[0, 1, 2].map(index => <View key={index} {...elementProps(`market-skeleton-message`, `${index}`)} style={[styles.messageShape, index === 1 && styles.replyShape]}>
          {block(`${index}-sender`, [styles.line, styles.short])}
          {block(`${index}-body`, styles.line)}
        </View>)}
      </>;
      case `actions`: return actions;
      case `payouts`: return block(`status`, styles.status);
    }
  };

  return <View
    accessible
    pointerEvents={`none`}
    accessibilityLabel={label}
    accessibilityRole={`progressbar`}
    accessibilityLiveRegion={`polite`}
    accessibilityState={{ busy: true }}
    {...elementProps(`market-skeleton`, kind)}
    style={styles.root}
  >
    <View accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`} style={styles.section}>
      {renderContent()}
    </View>
  </View>;
};

export default MarketSkeleton;
