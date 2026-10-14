import { Animated, Easing, type LayoutChangeEvent } from 'react-native';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export interface NativeCollapseState { closed: boolean; interactive: boolean; }

export const useNativeCollapse = (collapsed: boolean, onStateChange?: (state: NativeCollapseState) => void) => {
  const reducedMotion = useReducedMotion();
  const [interactive, setInteractive] = useState(!collapsed);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const initialized = useRef(false);
  const animating = useRef(false);
  const state = useRef<NativeCollapseState>({ closed: collapsed, interactive: !collapsed });
  const previous = useRef(collapsed);
  const generation = useRef(0);
  const latest = useRef({ collapsed, onStateChange });
  latest.current = { collapsed, onStateChange };
  const publishState = useCallback((value: NativeCollapseState) => {
    if (state.current.closed === value.closed && state.current.interactive === value.interactive) return;
    state.current = value;
    setInteractive(value.interactive);
    latest.current.onStateChange?.(value);
  }, []);
  const onContentLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const next = Math.max(0, nativeEvent.layout.height);
    setMeasuredHeight(current => current === next ? current : next);
  }, []);

  useLayoutEffect(() => {
    const version = ++generation.current;
    const wasAnimating = animating.current;
    const toggled = previous.current !== collapsed;
    previous.current = collapsed;
    animation.current?.stop();
    animation.current = null;
    const target = collapsed ? 0 : measuredHeight ?? 0;
    const shouldAnimate = initialized.current && measuredHeight !== null && !reducedMotion && (toggled || wasAnimating);
    initialized.current = measuredHeight !== null;
    if (!shouldAnimate) {
      animating.current = false;
      height.setValue(target);
      opacity.setValue(collapsed ? 0 : 1);
      publishState({ closed: collapsed, interactive: !collapsed });
      return;
    }
    animating.current = true;
    publishState({ closed: false, interactive: false });
    const transition = Animated.parallel([
      Animated.timing(height, { toValue: target, duration: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(opacity, { toValue: collapsed ? 0 : 1, duration: 240, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]);
    animation.current = transition;
    transition.start(({ finished }) => {
      if (!finished || version !== generation.current) return;
      animating.current = false;
      animation.current = null;
      publishState({ closed: latest.current.collapsed, interactive: !latest.current.collapsed });
    });
  }, [collapsed, measuredHeight, reducedMotion, height, opacity, publishState]);

  useEffect(() => () => { ++generation.current; animation.current?.stop(); }, []);
  return { height, opacity, interactive, measuredHeight, onContentLayout };
};
