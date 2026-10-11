import { useRef, useMemo, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { createStyles } from './styles.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const usePricingSkeleton = () => {
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    if (reducedMotion) {
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

  return { styles, palette, motion: reducedMotion ? {} : { opacity: pulse } };
};
