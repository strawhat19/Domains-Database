import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { AppState, Easing, Animated, Platform, type LayoutChangeEvent } from 'react-native';

export const useConnectionsInputGuide = (count: number) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [selection, setSelection] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const [pageVisible, setPageVisible] = useState(typeof document === `undefined` || !document.hidden);
  const playing = count > 1 && viewportWidth > 0 && !paused && !hovered && !focused && !reducedMotion && appActive && pageVisible;

  const select = useCallback((nextIndex: number) => {
    setIndex(Math.max(0, Math.min(count - 1, nextIndex)));
    setSelection(current => current + 1);
  }, [count]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (Number.isFinite(width) && width > 0) setViewportWidth(current => current === width ? current : width);
  }, []);

  useEffect(() => {
    translateX.stopAnimation();
    const toValue = -index * viewportWidth;
    if (reducedMotion || viewportWidth === 0) {
      translateX.setValue(toValue);
      return;
    }
    const animation = Animated.timing(translateX, {
      toValue,
      duration: 340,
      isInteraction: false,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== `web`,
    });
    animation.start();
    return () => animation.stop();
  }, [index, translateX, reducedMotion, viewportWidth]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setIndex(current => (current + 1) % count), 7000);
    return () => clearTimeout(timer);
  }, [count, index, playing, selection]);

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, state => setAppActive(state !== `background` && state !== `inactive`));
    if (Platform.OS !== `web` || typeof document === `undefined`) return () => subscription.remove();
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener(`visibilitychange`, updateVisibility);
    return () => {
      subscription.remove();
      document.removeEventListener(`visibilitychange`, updateVisibility);
    };
  }, []);

  return {
    index,
    paused,
    select,
    playing,
    onLayout,
    translateX,
    viewportWidth,
    reducedMotion,
    focusIn: () => setFocused(true),
    focusOut: () => setFocused(false),
    hoverIn: () => setHovered(true),
    hoverOut: () => setHovered(false),
    togglePaused: () => setPaused(current => !current),
  };
};
