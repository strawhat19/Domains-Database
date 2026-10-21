import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { overviewTitle, overviewDescription } from './content';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, useWindowDimensions } from 'react-native';
import { useAppBrand } from '../../shared/branding/useAppBrand';
import LandingOverviewCarousel from '../LandingOverviewCarousel';

const LandingOverview = () => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { formatText } = useAppBrand();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 600;
  const wide = width >= 1040;

  return (
    <View {...elementProps(`landing-overview`)} style={[styles.section, compact && styles.compactSection]}>
      <View {...elementProps(`landing-overview-inner`)} style={styles.inner}>
        <View {...elementProps(`landing-overview-intro`)} style={[styles.intro, wide && styles.wideIntro]}>
          <View {...elementProps(`landing-overview-copy`)} style={[styles.copy, wide && styles.wideCopy]}>
            <Text {...elementProps(`landing-overview-eyebrow`)} style={styles.eyebrow}>{`From Scattered Names To Clear Plans`}</Text>
            <Text {...elementProps(`landing-overview-title`)} style={styles.title} accessibilityRole={`header`}>{formatText(overviewTitle)}</Text>
            <Text {...elementProps(`landing-overview-description`)} style={styles.description}>{overviewDescription}</Text>
            <Text {...elementProps(`landing-overview-summary`)} style={styles.summary}>{`Know what you own, what it costs, and what you want to build next.`}</Text>
          </View>
          <View {...elementProps(`landing-overview-carousel-column`)} style={[styles.carousel, wide && styles.wideCarousel]}>
            <LandingOverviewCarousel />
          </View>
        </View>
      </View>
    </View>
  );
};

export default LandingOverview;
