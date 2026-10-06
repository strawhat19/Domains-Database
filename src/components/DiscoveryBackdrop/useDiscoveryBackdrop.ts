import { useRef, useState, useEffect } from 'react';
import { Easing, Animated, AppState, Platform } from 'react-native';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const useDiscoveryBackdrop = () => {
  const reducedMotion = useReducedMotion();
  const phase = useRef(new Animated.Value(.5)).current;
  const [active, setActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, state => setActive(state !== `background` && state !== `inactive`));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === `web`) return;
    if (reducedMotion) { phase.setValue(.5); return; }
    if (!active) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(phase, { toValue: 1, duration: 16000, isInteraction: false, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(phase, { toValue: 0, duration: 16000, isInteraction: false, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]), { resetBeforeIteration: false });
    animation.start();
    return () => animation.stop();
  }, [active, phase, reducedMotion]);

  return {
    paused: reducedMotion || !active,
    nativeStyle: Platform.OS === `web` ? undefined : {
      opacity: phase.interpolate({ inputRange: [0, 1], outputRange: [.82, 1] }),
      transform: [
        { translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) },
        { translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) },
      ],
    },
  };
};
