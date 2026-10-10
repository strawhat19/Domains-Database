import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { getNotificationHref } from '../../shared/routes';
import type { DomainMarqueeItem } from './useDomainMarquee';
import {
  Linking,
  AppState,
  ScrollView,
  AccessibilityInfo,
  type NativeScrollEvent,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type GestureResponderEvent,
} from 'react-native';

const pixelsPerSecond = 26;
const movementThreshold = 8;

export const useMarquee = (contentKey: string) => {
  const router = useRouter();
  const offset = useRef(0);
  const dragged = useRef(false);
  const interacting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const touchOrigin = useRef({ x: 0, y: 0 });
  const previousCycleWidth = useRef(0);
  const layoutReadyRef = useRef(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);
  const [cycleWidth, setCycleWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyCount = cycleWidth > 0 ? Math.max(3, Math.ceil(viewportWidth / cycleWidth) + 3) : 3;
  const copies = Array.from({ length: copyCount }, (_, index) => index);
  const ready = layoutReady && readyKey === contentKey;

  const clearResumeTimer = () => {
    if (resumeTimer.current === null) return;
    clearTimeout(resumeTimer.current);
    resumeTimer.current = null;
  };
  const wrapOffset = () => {
    if (cycleWidth <= 0) return;
    offset.current = cycleWidth + ((offset.current % cycleWidth) + cycleWidth) % cycleWidth;
    scroll.current?.scrollTo({ x: offset.current, animated: false });
  };
  const pauseInteraction = () => {
    clearResumeTimer();
    interacting.current = true;
  };
  const releaseInteraction = () => {
    clearResumeTimer();
    resumeTimer.current = setTimeout(() => {
      wrapOffset();
      dragged.current = false;
      interacting.current = false;
      resumeTimer.current = null;
    }, 250);
  };
  const onTouchStart = (event: GestureResponderEvent) => {
    pauseInteraction();
    dragged.current = false;
    touchOrigin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
  };
  const onTouchMove = (event: GestureResponderEvent) => {
    const deltaX = Math.abs(event.nativeEvent.pageX - touchOrigin.current.x);
    const deltaY = Math.abs(event.nativeEvent.pageY - touchOrigin.current.y);
    if (deltaX > movementThreshold || deltaY > movementThreshold) dragged.current = true;
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (interacting.current) offset.current = event.nativeEvent.contentOffset.x;
  };
  const onScrollBeginDrag = () => {
    pauseInteraction();
    dragged.current = true;
  };
  const openItem = (item: DomainMarqueeItem) => {
    if (!ready || dragged.current) return;
    if (item.external) void Linking.openURL(item.href).catch(() => undefined);
    else router.push(getNotificationHref(item.id));
  };
  const pauseLayout = () => {
    layoutReadyRef.current = false;
    setLayoutReady(false);
  };
  const measureCycle = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (!Number.isFinite(width) || width <= 0) return;
    setMeasuredKey(contentKey);
    if (width === cycleWidth) return;
    pauseLayout();
    setCycleWidth(width);
  };
  const measureViewport = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (!Number.isFinite(width) || width <= 0 || width === viewportWidth) return;
    pauseLayout();
    setViewportWidth(width);
  };
  const measureContent = (width: number) => {
    if (!Number.isFinite(width) || width <= 0 || width === contentWidth) return;
    pauseLayout();
    setContentWidth(width);
  };

  useEffect(() => {
    let mounted = true;
    const updateMotion = (enabled: boolean) => {
      if (mounted) setReduceMotion(enabled);
    };
    AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => updateMotion(true));
    const motionSubscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, updateMotion);
    const appSubscription = AppState.addEventListener(`change`, (state) => {
      setAppActive(state !== `background` && state !== `inactive`);
      if (state === `active`) {
        dragged.current = false;
        interacting.current = false;
      }
    });
    return () => {
      mounted = false;
      clearResumeTimer();
      appSubscription.remove();
      motionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    layoutReadyRef.current = false;
    setLayoutReady(false);
    if (measuredKey !== contentKey || cycleWidth <= 0 || viewportWidth <= 0 || Math.abs(contentWidth - cycleWidth * copyCount) > copyCount) return;
    const previousWidth = previousCycleWidth.current;
    if (previousWidth !== cycleWidth) {
      const phase = previousWidth > 0 ? ((offset.current - previousWidth) % previousWidth + previousWidth) % previousWidth / previousWidth : 0;
      offset.current = cycleWidth + phase * cycleWidth;
      previousCycleWidth.current = cycleWidth;
    }
    if (!interacting.current) wrapOffset();
    const timer = setTimeout(() => {
      if (!interacting.current) wrapOffset();
      layoutReadyRef.current = true;
      setReadyKey(contentKey);
      setLayoutReady(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [cycleWidth, contentWidth, copyCount, measuredKey, viewportWidth, contentKey]);

  useEffect(() => {
    if (reduceMotion || !appActive || !ready || cycleWidth <= 0) return;
    let frame = 0;
    let previousTime: number | null = null;
    const animate = (time: number) => {
      const elapsed = previousTime === null ? 0 : Math.min(time - previousTime, 64);
      previousTime = time;
      if (layoutReadyRef.current && !interacting.current) {
        const nextOffset = offset.current + pixelsPerSecond * elapsed / 1000;
        offset.current = cycleWidth + ((nextOffset % cycleWidth) + cycleWidth) % cycleWidth;
        scroll.current?.scrollTo({ x: offset.current, animated: false });
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ready, appActive, cycleWidth, reduceMotion]);

  return {
    ready,
    copies,
    scroll,
    onScroll,
    measureContent,
    openItem,
    onTouchMove,
    measureCycle,
    onTouchStart,
    measureViewport,
    pauseInteraction,
    releaseInteraction,
    onScrollBeginDrag,
  };
};
