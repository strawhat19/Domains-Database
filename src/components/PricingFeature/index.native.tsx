import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Check, List, Clock3, Layers } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getPricingFeatureBadges } from '../../shared/plans/pricingFeatures';
import type { PricingFeature as Feature } from '../../shared/plans/pricingFeatures';

const PricingFeature = ({ id, feature }: { id: string; feature: Feature }) => {
  const { palette } = useTheme();
  const badges = getPricingFeatureBadges(feature);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const Icon = feature.status === `current` ? Check : feature.status === `proposed` ? Clock3 : feature.status === `included` ? Layers : List;
  const color = feature.status === `current` ? palette.success : feature.status === `proposed` ? palette.warning : palette.muted;
  const badgeColors = {
    catalog: { color: palette.muted, backgroundColor: palette.input },
    included: { color: palette.muted, backgroundColor: palette.input },
    highlight: { color: palette.accent, backgroundColor: palette.subtle },
    competitor: { color: palette.ink, backgroundColor: palette.subtle },
    current: { color: palette.success, backgroundColor: palette.successBackground },
    proposed: { color: palette.warning, backgroundColor: palette.warningBackground },
  };

  return <View
    accessible
    style={styles.feature}
    {...elementProps(`pricing-feature`, id)}
    accessibilityLabel={`${feature.label}. ${badges.map(badge => `${badge.label}: ${badge.description}`).join(`. `)}`}
  >
    <Icon size={14} color={color} style={styles.icon} {...elementProps(`pricing-feature-icon`, id)} />
    <View {...elementProps(`pricing-feature-content`, id)} style={styles.content}>
      <Text {...elementProps(`pricing-feature-label`, id)} style={styles.label}>{feature.label}</Text>
      <View {...elementProps(`pricing-feature-badges`, id)} style={styles.badges}>
        {badges.map(badge => <Text
          key={badge.id}
          {...elementProps(`pricing-feature-badge`, `${id}-${badge.id}`)}
          style={[styles.badge, badgeColors[badge.id]]}
        >{badge.label}</Text>)}
      </View>
    </View>
  </View>;
};

export default PricingFeature;
