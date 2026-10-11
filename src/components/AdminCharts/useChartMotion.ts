import { Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const useChartMotion = (revision: string) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) { opacity.setValue(1); return; }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity, revision, reducedMotion]);
  return { opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] };
};
