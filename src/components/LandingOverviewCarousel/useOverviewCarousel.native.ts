import { overviewSlides } from '../LandingOverview/content';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, AccessibilityInfo, ScrollView } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const slideCount = overviewSlides.length;
const wrapIndex = (value: number) => (value % slideCount + slideCount) % slideCount;
const announceSlide = (value: number) => AccessibilityInfo.announceForAccessibility(`${overviewSlides[value]?.title}. Slide ${value + 1} of ${slideCount}`);

export const useOverviewCarousel = () => {
  const touching = useRef(false);
  const dragging = useRef(false);
  const currentIndex = useRef(0);
  const physicalIndex = useRef(1);
  const viewportSize = useRef(0);
  const dragStartIndex = useRef(0);
  const dragReleased = useRef(false);
  const reducedMotion = useRef(true);
  const scrollRef = useRef<ScrollView>(null);
  const scrollTarget = useRef<number | null>(null);
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [isInteracting, setInteracting] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [motionReduced, setMotionReduced] = useState(true);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);

  const clearDragTimer = useCallback(() => {
    if (dragTimer.current) clearTimeout(dragTimer.current);
    dragTimer.current = null;
  }, []);

  const normalizePosition = useCallback(() => {
    const canonicalPosition = physicalIndex.current === 0 ? slideCount : physicalIndex.current === slideCount + 1 ? 1 : physicalIndex.current;
    if (canonicalPosition === physicalIndex.current) return;
    physicalIndex.current = canonicalPosition;
    scrollRef.current?.scrollTo({ x: canonicalPosition * viewportSize.current, animated: false });
  }, []);

  const moveTo = useCallback((nextIndex: number, direction = 0, announce = true) => {
    clearDragTimer();
    dragging.current = false;
    dragReleased.current = false;
    setInteracting(touching.current);
    normalizePosition();
    const next = wrapIndex(nextIndex);
    const previous = currentIndex.current;
    const destination = direction ? currentIndex.current + 1 + direction : next + 1;
    currentIndex.current = next;
    physicalIndex.current = destination;
    scrollTarget.current = destination;
    setIndex(next);
    setInteractionVersion(value => value + 1);
    if (viewportSize.current) scrollRef.current?.scrollTo({ x: destination * viewportSize.current, animated: !reducedMotion.current });
    if (reducedMotion.current) {
      normalizePosition();
      scrollTarget.current = null;
    }
    if (announce && previous !== next) announceSlide(next);
  }, [clearDragTimer, normalizePosition]);

  const previous = useCallback(() => moveTo(currentIndex.current - 1, -1), [moveTo]);
  const next = useCallback(() => moveTo(currentIndex.current + 1, 1), [moveTo]);
  const goTo = useCallback((value: number) => moveTo(value), [moveTo]);

  useEffect(() => {
    let mounted = true;
    const updateMotion = (value: boolean) => {
      reducedMotion.current = value;
      if (mounted) setMotionReduced(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => undefined);
    const motionSubscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, updateMotion);
    const stateSubscription = AppState.addEventListener(`change`, setAppState);
    return () => {
      mounted = false;
      clearDragTimer();
      stateSubscription.remove();
      motionSubscription.remove();
    };
  }, [clearDragTimer]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: (currentIndex.current + 1) * viewportWidth, animated: false });
  }, [viewportWidth]);

  useEffect(() => {
    if (!viewportWidth || motionReduced || isInteracting || appState !== `active`) return;
    let active = true;
    const timer = setInterval(() => {
      scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, width, height) => {
        if (active && !touching.current && !dragging.current && width > 0 && height > 0 && y < Dimensions.get(`window`).height && y + height > 0) moveTo(currentIndex.current + 1, 1, false);
      });
    }, 6500);
    return () => { active = false; clearInterval(timer); };
  }, [index, appState, moveTo, motionReduced, isInteracting, viewportWidth, interactionVersion]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width === viewportSize.current) return;
    clearDragTimer();
    viewportSize.current = width;
    physicalIndex.current = currentIndex.current + 1;
    scrollTarget.current = null;
    dragging.current = false;
    dragReleased.current = false;
    setInteracting(touching.current);
    setViewportWidth(width);
  }, [clearDragTimer]);

  const finishDrag = useCallback((offset: number) => {
    clearDragTimer();
    if (!viewportSize.current) return;
    const position = Math.max(0, Math.min(Math.round(offset / viewportSize.current), slideCount + 1));
    const nextIndex = wrapIndex(position - 1);
    physicalIndex.current = position;
    currentIndex.current = nextIndex;
    scrollTarget.current = null;
    dragging.current = false;
    dragReleased.current = false;
    normalizePosition();
    setIndex(nextIndex);
    setInteracting(touching.current);
    setInteractionVersion(value => value + 1);
    if (dragStartIndex.current !== nextIndex) announceSlide(nextIndex);
  }, [clearDragTimer, normalizePosition]);

  const queueDragEnd = useCallback((offset: number) => {
    clearDragTimer();
    dragTimer.current = setTimeout(() => finishDrag(offset), 160);
  }, [finishDrag, clearDragTimer]);

  const onTouchStart = useCallback(() => {
    touching.current = true;
    setInteracting(true);
  }, []);

  const onTouchEnd = useCallback(() => {
    touching.current = false;
    if (!dragging.current) setInteracting(false);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    clearDragTimer();
    dragging.current = true;
    dragReleased.current = false;
    dragStartIndex.current = currentIndex.current;
    scrollTarget.current = null;
    setInteracting(true);
  }, [clearDragTimer]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!dragging.current || !viewportSize.current) return;
    const offset = event.nativeEvent.contentOffset.x;
    const nextIndex = wrapIndex(Math.max(0, Math.min(Math.round(offset / viewportSize.current), slideCount + 1)) - 1);
    currentIndex.current = nextIndex;
    setIndex(nextIndex);
    if (dragReleased.current) queueDragEnd(offset);
  }, [queueDragEnd]);

  const onScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragReleased.current = true;
    queueDragEnd(event.nativeEvent.contentOffset.x);
  }, [queueDragEnd]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    if (dragging.current) {
      if (dragReleased.current) finishDrag(offset);
      return;
    }
    if (scrollTarget.current === null || Math.abs(offset - scrollTarget.current * viewportSize.current) > 2) return;
    normalizePosition();
    scrollTarget.current = null;
  }, [finishDrag, normalizePosition]);

  return { index, next, goTo, previous, onLayout, onScroll, scrollRef, onTouchEnd, onTouchStart, viewportWidth, onScrollEndDrag, onScrollBeginDrag, onMomentumScrollEnd };
};
