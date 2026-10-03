import { Image } from 'expo-image';
import { Text, View, Animated } from 'react-native';
import { useLoadingScreen } from './useLoadingScreen';
import { elementProps } from '../../shared/elementProps';

type LoadingScreenProps = { label?: string; suffix?: string; compact?: boolean };

const LoadingScreen = ({ compact = false, suffix = `page`, label = `Loading your page…` }: LoadingScreenProps) => {
  const { isDark, styles, logoMotion, skeletonMotion } = useLoadingScreen();

  return (
    <View
      {...elementProps(`app-loading-screen`, suffix)}
      accessible
      accessibilityRole={`progressbar`}
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={[styles.screen, compact && styles.compactScreen]}
    >
      <View {...elementProps(`app-loading-card`, suffix)} style={[styles.card, compact && styles.compactCard]}>
        <View {...elementProps(`app-loading-heading`, suffix)} style={styles.heading}>
          <Animated.View {...elementProps(`app-loading-brand`, suffix)} style={[styles.brand, logoMotion]}>
            <Image
              {...elementProps(`app-loading-logo`, suffix)}
              style={styles.logo}
              contentFit={`contain`}
              accessibilityLabel={`Domains Database`}
              source={isDark
                ? require('../../../assets/icons/brand-logo-dark.svg')
                : require('../../../assets/concepts/logos/v8/02-domain-record-stack-fill.svg')}
            />
          </Animated.View>
          <View {...elementProps(`app-loading-record-dots`, suffix)} style={styles.dots} accessibilityElementsHidden>
            {[0, 1, 2].map(index => (
              <Animated.View
                key={index}
                {...elementProps(`app-loading-record-dot`, `${suffix}-${index}`)}
                style={[styles.dot, skeletonMotion]}
              />
            ))}
          </View>
        </View>
        <View {...elementProps(`app-loading-status`, suffix)} accessibilityLiveRegion={`polite`}>
          <Text {...elementProps(`app-loading-label`, suffix)} style={styles.label}>
            {label}
          </Text>
        </View>
        <Animated.View
          {...elementProps(`app-loading-preview`, suffix)}
          style={[styles.preview, skeletonMotion]}
          accessibilityElementsHidden
          importantForAccessibility={`no-hide-descendants`}
        >
          <View {...elementProps(`app-loading-preview-heading`, suffix)} style={styles.previewHeading}>
            <View {...elementProps(`app-loading-preview-title`, suffix)} style={[styles.bar, styles.headingBar]} />
            <View {...elementProps(`app-loading-preview-action`, suffix)} style={[styles.bar, styles.actionBar]} />
          </View>
          {compact ? (
            <View {...elementProps(`app-loading-preview-lines`, suffix)} style={styles.lines}>
              {[0, 1].map(index => (
                <View
                  key={index}
                  {...elementProps(`app-loading-preview-line`, `${suffix}-${index}`)}
                  style={[styles.bar, index ? styles.shortBar : styles.longBar]}
                />
              ))}
            </View>
          ) : (
            <View {...elementProps(`app-loading-preview-cards`, suffix)} style={styles.previewCards}>
              {[0, 1, 2].map(index => (
                <View key={index} {...elementProps(`app-loading-preview-card`, `${suffix}-${index}`)} style={styles.previewCard}>
                  <View {...elementProps(`app-loading-preview-card-marker`, `${suffix}-${index}`)} style={[styles.bar, styles.markerBar]} />
                  <View {...elementProps(`app-loading-preview-card-title`, `${suffix}-${index}`)} style={[styles.bar, styles.titleBar]} />
                  <View {...elementProps(`app-loading-preview-card-line`, `${suffix}-${index}`)} style={[styles.bar, styles.shortBar]} />
                  <View {...elementProps(`app-loading-preview-card-footer`, `${suffix}-${index}`)} style={[styles.bar, styles.longBar]} />
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

export default LoadingScreen;
