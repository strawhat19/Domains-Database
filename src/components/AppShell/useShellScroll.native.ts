import { Animated, ScrollView } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import type { NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native';

export const useShellScroll = (pathname: string, sticky: boolean) => {
  const position = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mainOffset, setMainOffset] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hero, setHero] = useState<{ pathname: string; bottom: number } | null>(null);
  const setHeroBottom = useCallback((bottom: number | null) => setHero(previous => bottom === null
    ? previous?.pathname === pathname ? null : previous : { pathname, bottom }), [pathname]);
  const updatePosition = useCallback((y: number) => {
    position.current = y;
    setScrolled(sticky && y > 8);
    const heroBottom = mainOffset + (hero?.bottom ?? 0) - (sticky ? headerHeight : 0);
    setShowScrollTop(y > 0 && y >= (hero?.pathname === pathname ? heroBottom : 300));
  }, [hero, sticky, pathname, mainOffset, headerHeight]);
  const onScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) =>
    updatePosition(Math.max(0, nativeEvent.contentOffset.y)), [updatePosition]);
  const onMainLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => setMainOffset(nativeEvent.layout.y), []);
  const onHeaderLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => setHeaderHeight(nativeEvent.layout.height), []);
  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: !reducedMotion }), [reducedMotion]);

  useEffect(() => updatePosition(position.current), [updatePosition]);
  useEffect(() => {
    position.current = 0;
    setScrolled(false);
    setShowScrollTop(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pathname]);
  useEffect(() => {
    const opacity = scrolled ? .86 : 1;
    if (reducedMotion) { headerOpacity.setValue(opacity); return; }
    const animation = Animated.timing(headerOpacity, { toValue: opacity, duration: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scrolled, headerOpacity, reducedMotion]);

  return { onScroll, scrollRef, scrollToTop, headerHeight, setHeroBottom, onMainLayout, showScrollTop, headerOpacity, onHeaderLayout, scrolled: sticky && scrolled };
};
