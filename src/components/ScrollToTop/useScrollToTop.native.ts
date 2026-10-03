import { Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const useScrollToTop = (visible: boolean) => {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, { duration: 240, useNativeDriver: true, toValue: visible ? 1 : 0 });
    animation.start();
    return () => animation.stop();
  }, [visible, progress, reduceMotion]);

  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
};
