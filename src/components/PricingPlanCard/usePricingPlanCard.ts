import { useRef, useState, useEffect } from 'react';
import { Easing, Animated, AccessibilityInfo, type PointerEvent } from 'react-native';

export const usePricingPlanCard = () => {
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const hoverOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const change = (enabled: boolean) => { if (active) setReducedMotion(enabled); };
    void AccessibilityInfo.isReduceMotionEnabled().then(change).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, change);
    return () => { active = false; subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      hoverOpacity.setValue(hovered ? 1 : 0);
      return;
    }
    const animation = Animated.timing(hoverOpacity, {
      duration: 220,
      isInteraction: false,
      useNativeDriver: true,
      toValue: hovered ? 1 : 0,
      easing: Easing.inOut(Easing.ease),
    });
    animation.start();
    return () => animation.stop();
  }, [hovered, hoverOpacity, reducedMotion]);

  const onPointerEnter = (event: PointerEvent) => {
    if (event.nativeEvent.pointerType === `mouse` || event.nativeEvent.pointerType === `pen`) setHovered(true);
  };
  const onPointerLeave = () => setHovered(false);

  return { hovered, hoverOpacity, onPointerEnter, onPointerLeave };
};
