import { discoveryCarouselSizing } from './sizing';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { discoveryShelfCardHeights, type DiscoveryCardDensity } from '../DomainDiscovery/useDiscoveryShelf';
import { AppState, ScrollView, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

export const useDiscoveryCarousel = (count: number, disabled: boolean, density: DiscoveryCardDensity, autoplayDirection: -1 | 1 = 1) => {
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const interaction = useRef({ drag: false, focus: false, hover: false, touch: false });
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const cardWidth = viewportWidth > 0 ? Math.max(1, Math.min(discoveryCarouselSizing.cardWidth, viewportWidth - discoveryCarouselSizing.padding * 2)) : discoveryCarouselSizing.cardWidth;
  const step = cardWidth + discoveryCarouselSizing.gap;
  const cycleWidth = count * step;
  const looping = count > 1 && cycleWidth > 0;
  const copyCount = looping ? Math.max(3, Math.ceil(viewportWidth / cycleWidth) + 3) : 1;
  const copies = Array.from({ length: copyCount }, (_, index) => index);
  const layoutReady = viewportWidth > 0 && (!looping || Math.abs(contentWidth - cycleWidth * copyCount) < 2);
  const playing = layoutReady && looping && !paused && !disabled && !reducedMotion && appActive;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = null;
  }, []);

  const setInteraction = useCallback((kind: keyof typeof interaction.current, active: boolean) => {
    interaction.current[kind] = active;
    setPaused(interaction.current.drag || interaction.current.focus || interaction.current.hover || interaction.current.touch);
  }, []);

  const normalize = useCallback((value: number) => looping
    ? cycleWidth + ((value - cycleWidth) % cycleWidth + cycleWidth) % cycleWidth
    : 0, [cycleWidth, looping]);

  const recenter = useCallback(() => {
    const next = normalize(offset.current);
    if (Math.abs(next - offset.current) > .5) scroll.current?.scrollTo({ x: next, animated: false });
    offset.current = next;
  }, [normalize]);

  const onContentSizeChange = useCallback((width: number) => {
    setContentWidth(current => current === width ? current : width);
  }, []);

  const settle = useCallback(() => {
    clearSettleTimer();
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      if (interaction.current.touch) return;
      recenter();
      setInteraction(`drag`, false);
    }, 180);
  }, [recenter, setInteraction, clearSettleTimer]);

  const pauseDrag = useCallback(() => {
    clearSettleTimer();
    setInteraction(`drag`, true);
  }, [setInteraction, clearSettleTimer]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (playingRef.current) return;
    offset.current = event.nativeEvent.contentOffset.x;
    settle();
  }, [settle]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (Number.isFinite(next) && next >= 0) setViewportWidth(current => current === next ? current : next);
  }, []);

  const navigate = useCallback((direction: -1 | 1) => {
    if (!looping || disabled || !layoutReady) return;
    pauseDrag();
    recenter();
    offset.current += direction * step;
    scroll.current?.scrollTo({ x: offset.current, animated: !reducedMotion });
    settle();
  }, [step, settle, looping, disabled, recenter, pauseDrag, reducedMotion, layoutReady]);

  useEffect(() => {
    if (!layoutReady) return;
    offset.current = normalize(offset.current);
    scroll.current?.scrollTo({ x: offset.current, animated: false });
  }, [normalize, layoutReady]);

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, state => setAppActive(state !== `background` && state !== `inactive`));
    return () => { subscription.remove(); clearSettleTimer(); };
  }, [clearSettleTimer]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previousTime: number | null = null;
    const animate = (time: number) => {
      if (!playingRef.current) return;
      const elapsed = previousTime === null ? 0 : Math.min(time - previousTime, 64);
      previousTime = time;
      if (!interaction.current.drag && !interaction.current.focus && !interaction.current.hover && !interaction.current.touch) {
        offset.current = normalize(offset.current + autoplayDirection * discoveryCarouselSizing.pixelsPerSecond * elapsed / 1000);
        scroll.current?.scrollTo({ x: offset.current, animated: false });
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing, normalize, autoplayDirection]);

  return {
    scroll,
    copies,
    looping,
    onLayout,
    onScroll,
    cardWidth,
    pauseDrag,
    onContentSizeChange,
    releaseDrag: settle,
    previous: () => navigate(-1),
    next: () => navigate(1),
    focusIn: () => setInteraction(`focus`, true),
    focusOut: () => setInteraction(`focus`, false),
    hoverIn: () => setInteraction(`hover`, true),
    hoverOut: () => setInteraction(`hover`, false),
    touchStart: () => { clearSettleTimer(); setInteraction(`touch`, true); },
    touchEnd: () => { setInteraction(`touch`, false); settle(); },
    primaryCopy: looping ? 1 : 0,
    height: discoveryShelfCardHeights[density] + discoveryCarouselSizing.padding * 2,
  };
};
