import BackdropArt from './BackdropArt';
import { styles } from './styles.native';
import type { DiscoveryBackdropProps } from './types';
import { Animated, Platform, View } from 'react-native';
import { useDiscoveryBackdrop } from './useDiscoveryBackdrop';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const DiscoveryBackdrop = ({ suffix, variant = `search` }: DiscoveryBackdropProps) => {
  const { isDark, palette } = useTheme();
  const motion = useDiscoveryBackdrop();

  return (
    <View
      aria-hidden
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`discovery-backdrop`, suffix)}
      style={[styles.outer, isDark ? styles.dark : styles.light, { pointerEvents: `none` }]}
      {...(Platform.OS === `web` ? { dataSet: { class: `discovery-backdrop`, variant, motion: motion.paused ? `paused` : `running` } } : {})}
    >
      <Animated.View {...elementProps(`discovery-backdrop-art`, suffix)} style={[styles.art, motion.nativeStyle]}>
        <BackdropArt suffix={suffix} isDark={isDark} palette={palette} variant={variant} />
      </Animated.View>
    </View>
  );
};

export type { DiscoveryBackdropProps, DiscoveryBackdropVariant } from './types';
export default DiscoveryBackdrop;
