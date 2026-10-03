import { createStyles } from './styles';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Easing, Animated, Platform, AccessibilityInfo } from 'react-native';

export const useLoadingScreen = () => {
  const { isDark, palette } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    let active = true;
    const change = (enabled: boolean) => { if (active) setReducedMotion(enabled); };
    void AccessibilityInfo.isReduceMotionEnabled().then(change).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, change);
    return () => { active = false; subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion || Platform.OS === `web`) {
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true, isInteraction: false, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true, isInteraction: false, easing: Easing.inOut(Easing.ease) }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  const animated = !reducedMotion && Platform.OS !== `web`;
  const skeletonMotion = animated ? { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.5, 1] }) } : {};
  const logoMotion = animated ? {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.8, 1] }),
    transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
  } : {};

  return { isDark, styles, logoMotion, skeletonMotion };
};
