import { useMemo } from 'react';
import { Image } from 'expo-image';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { blogImages } from '../../shared/blog/images.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, useWindowDimensions } from 'react-native';
import { Globe2, Search, Layers3, CalendarDays } from 'lucide-react-native';
import { overviewNote, overviewTitle, overviewFeatures, overviewDescription } from './content';

const featureIcons = { inventory: Globe2, renewals: CalendarDays, projects: Layers3, discovery: Search };
const illustrationLabel = `Illustration of a portfolio dashboard with sample domain rows labeled Renew, Review, and Keep`;

const LandingOverview = () => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const wide = width >= 900;
  const columns = compact ? 1 : 2;
  const contentWidth = Math.max(0, Math.min(width - (compact ? 40 : 64), 1056));
  const featureWidth = (contentWidth - (columns - 1) * 14) / columns;
  const illustrationWidth = wide ? (contentWidth - 36) / 2 : contentWidth;

  const renderShape = (id: string, fill = palette.input) => (
    <>
      <View
        accessible={false}
        pointerEvents={`none`}
        style={styles.cardBacking}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-overview-backing`, id)}
      >
        <StackPillShape id={`${id}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} />
      </View>
      <View
        accessible={false}
        pointerEvents={`none`}
        style={styles.cardForeground}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-overview-foreground`, id)}
      >
        <StackPillShape id={`${id}-foreground`} fill={fill} stroke={palette.line} />
      </View>
    </>
  );

  return (
    <View {...elementProps(`landing-overview`)} style={[styles.section, compact && styles.compactSection]}>
      <View {...elementProps(`landing-overview-inner`)} style={styles.inner}>
        <View {...elementProps(`landing-overview-intro`)} style={[styles.intro, wide && styles.wideIntro]}>
          <View {...elementProps(`landing-overview-copy`)} style={[styles.copy, wide && styles.wideCopy]}>
            <Text {...elementProps(`landing-overview-eyebrow`)} style={styles.eyebrow}>{`PLAN IT. MANAGE IT.`}</Text>
            <Text {...elementProps(`landing-overview-title`)} adjustsFontSizeToFit numberOfLines={1} style={styles.title} accessibilityRole={`header`}>{overviewTitle}</Text>
            <Text {...elementProps(`landing-overview-description`)} style={styles.description}>{overviewDescription}</Text>
          </View>
          <View {...elementProps(`landing-overview-illustration-frame`)} style={[styles.illustrationFrame, { width: illustrationWidth }]}>
            {renderShape(`landing-overview-portfolio`, palette.paper)}
            <Image
              accessible
              alt={illustrationLabel}
              contentFit={`contain`}
              style={styles.illustration}
              accessibilityLabel={illustrationLabel}
              source={blogImages[`domain-portfolio-management`]}
              {...elementProps(`landing-overview-portfolio-illustration`)}
            />
            <Text {...elementProps(`landing-overview-illustration-caption`)} style={styles.caption}>
              {`A portfolio illustration, with a next step for every name`}
            </Text>
          </View>
        </View>
        <View {...elementProps(`landing-overview-features`)} style={styles.grid}>
          {overviewFeatures.map(feature => {
            const Icon = featureIcons[feature.id as keyof typeof featureIcons] ?? Globe2;
            return (
              <View key={feature.id} {...elementProps(`landing-overview-feature`, feature.id)} style={[styles.featureCard, { width: featureWidth }]}>
                {renderShape(`landing-overview-${feature.id}`)}
                <View {...elementProps(`landing-overview-feature-heading`, feature.id)} style={styles.featureHeading}>
                  <Text {...elementProps(`landing-overview-feature-title`, feature.id)} style={styles.featureTitle} accessibilityRole={`header`}>{feature.title}</Text>
                  <Icon {...elementProps(`landing-overview-feature-icon`, feature.id)} size={20} color={palette.accent} accessible={false} />
                </View>
                <Text {...elementProps(`landing-overview-feature-description`, feature.id)} style={styles.featureDescription}>{feature.description}</Text>
              </View>
            );
          })}
        </View>
        <Text {...elementProps(`landing-overview-note`)} style={styles.note}>{overviewNote}</Text>
      </View>
    </View>
  );
};

export default LandingOverview;
