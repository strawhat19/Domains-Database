import { Image } from 'expo-image';
import { useLoadingScreen } from './useLoadingScreen';
import { elementProps } from '../../shared/elementProps';
import { ActivityIndicator, Text, View } from 'react-native';

const LoadingScreen = () => {
  const { height, styles, isDark, palette, reducedMotion } = useLoadingScreen();
  return (
    <View
      {...elementProps(`app-loading-screen`)}
      accessibilityState={{ busy: true }}
      style={[styles.screen, { minHeight: height }]}
    >
      <View {...elementProps(`app-loading-card`)} style={styles.card}>
        <Image
          {...elementProps(`app-loading-logo`)}
          style={styles.logo}
          contentFit={`contain`}
          accessibilityLabel={`Domains Database`}
          source={isDark
            ? require('../../../assets/icons/brand-logo-dark.svg')
            : require('../../../assets/concepts/logos/v8/02-domain-record-stack-fill.svg')}
        />
        <View {...elementProps(`app-loading-copy`)} style={styles.copy}>
          <Text {...elementProps(`app-loading-title`)} style={styles.title}>
            {`Your domains, together.`}
          </Text>
          <Text {...elementProps(`app-loading-description`)} style={styles.description}>
            {`One clear view of every name you own.`}
          </Text>
        </View>
        <View {...elementProps(`app-loading-status`)} style={styles.status} accessibilityLiveRegion={`polite`}>
          {reducedMotion ? (
            <View {...elementProps(`app-loading-status-dot`)} style={styles.dot} />
          ) : (
            <ActivityIndicator {...elementProps(`app-loading-spinner`)} color={palette.accent} size={`small`} />
          )}
          <Text {...elementProps(`app-loading-label`)} style={styles.label}>
            {`Opening your registry…`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LoadingScreen;
