import type { MouseEvent, PointerEvent } from 'react';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { AppState, Easing, Animated, Platform, PanResponder, type LayoutChangeEvent } from 'react-native';

interface CarouselGesture {
  width: number;
  deltaX: number;
  startX: number;
  startY: number;
  dragged: boolean;
  startIndex: number;
  pointerId?: number;
  captureTarget?: Element;
  kind: `web` | `native`;
}

const clampIndex = (index: number, count: number) => Math.max(0, Math.min(Math.max(0, count - 1), Math.trunc(index)));
const horizontalIntent = (x: number, y: number) => Math.abs(x) > 8 && Math.abs(x) > Math.abs(y) * 1.2;

export const useCarousel = (count: number, autoplay = true, interval = 7000) => {
  const slideCount = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const delay = Number.isFinite(interval) && interval > 0 ? interval : 7000;
  const translateX = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const mounted = useRef(true);
  const indexRef = useRef(0);
  const widthRef = useRef(0);
  const countRef = useRef(slideCount);
  const clickSuppressed = useRef(false);
  const gesture = useRef<CarouselGesture | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageVisible, setPageVisible] = useState(typeof document === `undefined` || !document.hidden);
  const [windowActive, setWindowActive] = useState(typeof document === `undefined` || document.hasFocus());
  const [appActive, setAppActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const playing = autoplay && slideCount > 1 && viewportWidth > 0 && !reducedMotion && !hovered && !focused && !interacting && appActive && pageVisible && windowActive;
  const playingRef = useRef(playing);
  countRef.current = slideCount;
  playingRef.current = playing;

  const clearClickSuppression = useCallback(() => {
    clickSuppressed.current = false;
    if (clickTimer.current !== undefined) clearTimeout(clickTimer.current);
    clickTimer.current = undefined;
  }, []);

  const releaseCapture = useCallback((current: CarouselGesture | null) => {
    if (current?.pointerId === undefined || !current.captureTarget) return;
    try {
      if (current.captureTarget.hasPointerCapture?.(current.pointerId)) current.captureTarget.releasePointerCapture?.(current.pointerId);
    } catch {}
  }, []);

  const setSlide = useCallback((nextIndex: number) => {
    if (!mounted.current || !Number.isFinite(nextIndex)) return;
    const selected = clampIndex(nextIndex, countRef.current);
    indexRef.current = selected;
    setIndex(selected);
    setSelection(current => current + 1);
  }, []);

  const finishGesture = useCallback((cancelled = false) => {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    releaseCapture(current);
    if (!mounted.current) return;
    let selected = current.startIndex;
    if (!cancelled && current.dragged && Math.abs(current.deltaX) >= Math.min(60, current.width * .15)) selected += current.deltaX < 0 ? 1 : -1;
    setDragging(false);
    setInteracting(false);
    setSlide(selected);
    if (current.dragged) {
      clickSuppressed.current = true;
      if (clickTimer.current !== undefined) clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(clearClickSuppression, 400);
    }
  }, [setSlide, releaseCapture, clearClickSuppression]);

  const applyDrag = useCallback((deltaX: number) => {
    const current = gesture.current;
    if (!current) return;
    current.deltaX = deltaX;
    let offset = Math.max(-current.width, Math.min(current.width, deltaX));
    if ((current.startIndex === 0 && offset > 0) || (current.startIndex >= countRef.current - 1 && offset < 0)) offset *= .28;
    translateX.setValue(-current.startIndex * current.width + offset);
  }, [translateX]);

  const select = useCallback((nextIndex: number) => {
    finishGesture(true);
    setSlide(nextIndex);
  }, [setSlide, finishGesture]);
  const next = useCallback(() => select(countRef.current > 0 ? (indexRef.current + 1) % countRef.current : 0), [select]);
  const previous = useCallback(() => select(countRef.current > 0 ? (indexRef.current - 1 + countRef.current) % countRef.current : 0), [select]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (!Number.isFinite(width) || width < 0 || width === widthRef.current) return;
    finishGesture(true);
    widthRef.current = width;
    setViewportWidth(width);
  }, [finishGesture]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0 || gesture.current || countRef.current < 2 || widthRef.current <= 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(`input,select,textarea,[contenteditable]:not([contenteditable="false"])`)) return;
    const captureTarget = target?.closest(`a,button,[role="button"]`) ?? event.currentTarget;
    clearClickSuppression();
    gesture.current = {
      kind: `web`,
      deltaX: 0,
      dragged: false,
      captureTarget,
      width: widthRef.current,
      startX: event.clientX,
      startY: event.clientY,
      startIndex: indexRef.current,
      pointerId: event.pointerId,
    };
    setInteracting(true);
    playingRef.current = false;
    try { captureTarget.setPointerCapture?.(event.pointerId); } catch {}
  }, [clearClickSuppression]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (current?.kind !== `web` || current.pointerId !== event.pointerId) return;
    if (event.pointerType === `mouse` && event.buttons === 0) { finishGesture(true); return; }
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (!current.dragged) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) { finishGesture(true); return; }
      if (!horizontalIntent(deltaX, deltaY)) return;
      current.dragged = true;
      clickSuppressed.current = true;
      translateX.stopAnimation();
      setDragging(true);
    }
    event.preventDefault();
    applyDrag(deltaX);
  }, [applyDrag, translateX, finishGesture]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (current?.kind !== `web` || current.pointerId !== event.pointerId) return;
    if (current.dragged) current.deltaX = event.clientX - current.startX;
    finishGesture();
  }, [finishGesture]);
  const onPointerCancel = useCallback((event: PointerEvent<HTMLElement>) => {
    if (gesture.current?.kind === `web` && gesture.current.pointerId === event.pointerId) finishGesture(true);
  }, [finishGesture]);
  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!clickSuppressed.current) return;
    event.preventDefault();
    event.stopPropagation();
    clearClickSuppression();
  }, [clearClickSuppression]);

  const panHandlers = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onShouldBlockNativeResponder: () => false,
    onPanResponderTerminationRequest: () => true,
    onMoveShouldSetPanResponder: (_event, state) => countRef.current > 1 && widthRef.current > 0 && horizontalIntent(state.dx, state.dy),
    onPanResponderGrant: (_event, state) => {
      clearClickSuppression();
      gesture.current = {
        kind: `native`,
        startX: 0,
        startY: 0,
        dragged: true,
        deltaX: state.dx,
        width: widthRef.current,
        startIndex: indexRef.current,
      };
      playingRef.current = false;
      translateX.stopAnimation();
      setDragging(true);
      setInteracting(true);
      applyDrag(state.dx);
    },
    onPanResponderMove: (_event, state) => applyDrag(state.dx),
    onPanResponderTerminate: () => finishGesture(true),
    onPanResponderRelease: (_event, state) => {
      if (gesture.current?.kind === `native`) gesture.current.deltaX = state.dx;
      finishGesture();
    },
  }).panHandlers, [applyDrag, translateX, finishGesture, clearClickSuppression]);

  useEffect(() => {
    finishGesture(true);
    const selected = clampIndex(indexRef.current, slideCount);
    if (selected !== indexRef.current) setSlide(selected);
  }, [setSlide, slideCount, finishGesture]);

  useEffect(() => {
    if (gesture.current?.dragged) return;
    translateX.stopAnimation();
    const toValue = -clampIndex(index, slideCount) * viewportWidth;
    if (reducedMotion || viewportWidth === 0) { translateX.setValue(toValue); return; }
    const animation = Animated.timing(translateX, {
      toValue,
      duration: 340,
      isInteraction: false,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== `web`,
    });
    animation.start();
    return () => animation.stop();
  }, [index, dragging, selection, slideCount, translateX, reducedMotion, viewportWidth]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => { if (playingRef.current && !gesture.current) next(); }, delay);
    return () => clearTimeout(timer);
  }, [next, delay, index, playing, selection]);

  useEffect(() => {
    mounted.current = true;
    const cancelInteraction = () => { playingRef.current = false; finishGesture(true); };
    const subscription = AppState.addEventListener(`change`, state => {
      const active = state !== `background` && state !== `inactive`;
      setAppActive(active);
      if (!active) cancelInteraction();
    });
    const updateVisibility = () => {
      setPageVisible(!document.hidden);
      if (document.hidden) cancelInteraction();
    };
    const blur = () => { setWindowActive(false); cancelInteraction(); };
    const focus = () => setWindowActive(true);
    const releasePointer = (event: globalThis.PointerEvent) => {
      if (gesture.current?.kind === `web` && gesture.current.pointerId === event.pointerId) finishGesture(true);
    };
    if (Platform.OS === `web` && typeof document !== `undefined`) {
      updateVisibility();
      document.addEventListener(`visibilitychange`, updateVisibility);
      window.addEventListener(`pointercancel`, releasePointer);
      window.addEventListener(`pointerup`, releasePointer);
      window.addEventListener(`blur`, blur);
      window.addEventListener(`focus`, focus);
    }
    return () => {
      mounted.current = false;
      subscription.remove();
      clearClickSuppression();
      const current = gesture.current;
      gesture.current = null;
      releaseCapture(current);
      translateX.stopAnimation();
      if (Platform.OS !== `web` || typeof document === `undefined`) return;
      document.removeEventListener(`visibilitychange`, updateVisibility);
      window.removeEventListener(`pointercancel`, releasePointer);
      window.removeEventListener(`pointerup`, releasePointer);
      window.removeEventListener(`blur`, blur);
      window.removeEventListener(`focus`, focus);
    };
  }, [translateX, finishGesture, releaseCapture, clearClickSuppression]);

  return {
    index,
    next,
    select,
    playing,
    previous,
    dragging,
    onLayout,
    translateX,
    panHandlers,
    viewportWidth,
    reducedMotion,
    onPointerUp,
    onPointerDown,
    onPointerMove,
    onClickCapture,
    onPointerCancel,
    suppressClick: onClickCapture,
    focusIn: () => setFocused(true),
    hoverIn: () => setHovered(true),
    focusOut: () => setFocused(false),
    hoverOut: () => setHovered(false),
    onLostPointerCapture: onPointerCancel,
  };
};
