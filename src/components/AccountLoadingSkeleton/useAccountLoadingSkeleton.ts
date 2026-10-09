import { createStyles } from './styles.native';
import { useRef, useMemo, useEffect } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { Easing, Animated, Platform, useWindowDimensions } from 'react-native';

export const useAccountLoadingSkeleton = () => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const roomy = width >= 1100;
  const compact = width < 760;
  const styles = useMemo(() => createStyles(palette, roomy, compact), [palette, roomy, compact]);

  useEffect(() => {
    if (reducedMotion || Platform.OS === `web`) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: .55, duration: 1200, useNativeDriver: true, isInteraction: false, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true, isInteraction: false, easing: Easing.inOut(Easing.ease) }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  const motion = Platform.OS !== `web` && !reducedMotion ? { opacity: pulse } : {};
  return { styles, motion, palette, compact };
};
