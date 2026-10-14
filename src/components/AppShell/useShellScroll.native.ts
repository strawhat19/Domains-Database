import { Animated, ScrollView, type View } from 'react-native';
import { useEffect, useRef, useMemo, useState, useCallback, type RefObject } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import type { NativePageScroll, PageScrollViewport } from '../../shared/scrollContext/ScrollContext';
import type { NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native';

export const useShellScroll = (pathname: string, sticky: boolean, viewportRef: RefObject<View | null>, bottomInset = 0) => {
  const position = useRef(0);
  const listeners = useRef(new Set<(layoutChanged: boolean) => void>());
  const metrics = useRef({ height: 0, contentHeight: 0 });
  const scrollRef = useRef<ScrollView>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mainOffset, setMainOffset] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hero, setHero] = useState<{ pathname: string; bottom: number } | null>(null);
  const current = useRef({ sticky, bottomInset, headerHeight });
  current.current = { sticky, bottomInset, headerHeight };
  const setHeroBottom = useCallback((bottom: number | null) => setHero(previous => bottom === null
    ? previous?.pathname === pathname ? null : previous : { pathname, bottom }), [pathname]);
  const notify = useCallback((layoutChanged = false) => listeners.current.forEach(listener => listener(layoutChanged)), []);
  const subscribe = useCallback((listener: (layoutChanged: boolean) => void) => {
    listeners.current.add(listener);
    return () => { listeners.current.delete(listener); };
  }, []);
  const updatePosition = useCallback((y: number) => {
    position.current = y;
    notify();
    setScrolled(sticky && y > 8);
    const heroBottom = mainOffset + (hero?.bottom ?? 0) - (sticky ? headerHeight : 0);
    setShowScrollTop(y > 0 && y >= (hero?.pathname === pathname ? heroBottom : 300));
  }, [hero, sticky, pathname, mainOffset, headerHeight, notify]);
  const onScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    metrics.current = { height: nativeEvent.layoutMeasurement.height, contentHeight: nativeEvent.contentSize.height };
    updatePosition(Math.max(0, nativeEvent.contentOffset.y));
  }, [updatePosition]);
  const onViewportLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => { metrics.current.height = nativeEvent.layout.height; notify(true); }, [notify]);
  const onContentSizeChange = useCallback((_width: number, height: number) => { metrics.current.contentHeight = height; notify(true); }, [notify]);
  const scrollBy = useCallback((amount: number) => {
    if (!scrollRef.current || !Number.isFinite(amount)) return false;
    const maximum = Math.max(0, metrics.current.contentHeight - metrics.current.height);
    const next = Math.max(0, Math.min(maximum, position.current + amount));
    if (next === position.current) return false;
    updatePosition(next);
    scrollRef.current.scrollTo({ y: next, animated: false });
    return true;
  }, [updatePosition]);
  const measureViewport = useCallback((): Promise<PageScrollViewport> => new Promise(resolve => {
    if (!viewportRef.current) { resolve({ x: 0, y: 0, width: 0, height: 0 }); return; }
    viewportRef.current.measureInWindow((x, y, width, height) => {
      const top = current.current.sticky ? current.current.headerHeight : 0;
      resolve({ x, y: y + top, width, height: Math.max(0, height - top - current.current.bottomInset) });
    });
  }), [viewportRef]);
  const pageScroll = useMemo<NativePageScroll>(() => ({ scrollBy, subscribe, measure: measureViewport, getPosition: () => position.current }), [scrollBy, subscribe, measureViewport]);
  const onMainLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => setMainOffset(nativeEvent.layout.y), []);
  const onHeaderLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => setHeaderHeight(nativeEvent.layout.height), []);
  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: !reducedMotion }), [reducedMotion]);

  useEffect(() => updatePosition(position.current), [updatePosition]);
  useEffect(() => {
    position.current = 0;
    notify();
    setScrolled(false);
    setShowScrollTop(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pathname, notify]);
  useEffect(() => {
    const opacity = scrolled ? .86 : 1;
    if (reducedMotion) { headerOpacity.setValue(opacity); return; }
    const animation = Animated.timing(headerOpacity, { toValue: opacity, duration: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scrolled, headerOpacity, reducedMotion]);

  return { onScroll, pageScroll, scrollRef, scrollToTop, headerHeight, setHeroBottom, onMainLayout, showScrollTop, headerOpacity, onHeaderLayout, onViewportLayout, onContentSizeChange, scrolled: sticky && scrolled };
};
