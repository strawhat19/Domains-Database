import { useMemo } from 'react';
import { createStyles } from './styles.native';
import DiscoveryBackdrop from '../../DiscoveryBackdrop';
import { Tag, type LucideIcon } from 'lucide-react-native';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

type MarketHeroProps = {
  title: string;
  icon: LucideIcon;
  compact?: boolean;
  onSell?: () => void;
  description: string;
};

const MarketHero = ({ title, icon: Icon, compact = false, onSell, description }: MarketHeroProps) => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const styles = useMemo(() => createStyles(palette, wide), [palette, wide]);

  return (
    <View {...elementProps(`market-hero`)} style={[styles.hero, compact && styles.compactHero]}>
      {!compact && (
        <View {...elementProps(`market-hero-art`)} style={styles.art}>
          <DiscoveryBackdrop suffix={`market-hero`} />
        </View>
      )}
      <View {...elementProps(`market-hero-content`)} style={styles.content}>
        {!compact && (
          <View {...elementProps(`market-hero-eyebrow`)} style={styles.eyebrow}>
            <Icon size={15} color={palette.accent} accessible={false} {...elementProps(`market-hero-eyebrow-icon`)} />
            <Text {...elementProps(`market-hero-eyebrow-text`)} style={styles.eyebrowText}>{`DOMAIN MARKETPLACE`}</Text>
          </View>
        )}
        <Text
          accessibilityRole={`header`}
          {...elementProps(`market-heading`)}
          style={[styles.title, compact && styles.compactTitle]}
        >
          {compact ? `Domain Marketplace` : title}
        </Text>
        {!compact && (
          <>
            <Text {...elementProps(`market-hero-description`)} style={styles.description}>
              {description}
            </Text>
            {onSell && (
              <Pressable
                onPress={onSell}
                accessibilityRole={`button`}
                {...elementProps(`market-hero-sell`)}
                style={({ pressed }) => [styles.sell, pressed && styles.pressed]}
              >
                <Tag size={15} color={palette.contrast} accessible={false} {...elementProps(`market-hero-sell-icon`)} />
                <Text {...elementProps(`market-hero-sell-label`)} style={styles.sellText}>{`List a Domain`}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default MarketHero;
