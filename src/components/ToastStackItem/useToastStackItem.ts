import type { ToastStackItemProps } from './types';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated, Easing, type LayoutChangeEvent } from 'react-native';
import { useReducedMotionPreference } from '../../shared/common/useReducedMotion';
import { TOAST_ENTRY_DELAY, TOAST_EXIT_DURATION, TOAST_ENTER_DURATION } from '../ToastStack/motion';

type ToastPhase = `pending` | `entering` | `visible` | `exiting` | `removed`;
interface ToastController {
  resize: () => void;
  dismiss: () => void;
  reduceMotion: () => void;
}

export const useToastStackItem = ({ notice, onDismiss, entryTimeline }: Pick<ToastStackItemProps, `notice` | `onDismiss` | `entryTimeline`>) => {
  const { ready, reducedMotion } = useReducedMotionPreference();
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(24)).current;
  const measuredHeight = useRef(0);
  const dismissCallback = useRef(onDismiss);
  const motionPreference = useRef(reducedMotion);
  const motionReady = useRef(ready);
  const controller = useRef<ToastController | null>(null);
  const [visible, setVisible] = useState(false);
  const { id, appearAt, dismissAt } = notice;
  dismissCallback.current = onDismiss;
  motionPreference.current = reducedMotion;
  motionReady.current = ready;

  useEffect(() => {
    let active = true;
    let revision = 0;
    let phase: ToastPhase = `pending`;
    let animation: Animated.CompositeAnimation | null = null;
    let enterTimer: ReturnType<typeof setTimeout> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    height.setValue(0);
    opacity.setValue(0);
    translateX.setValue(24);
    setVisible(false);
    const finish = () => {
      if (!active || phase === `removed`) return;
      phase = `removed`;
      setVisible(false);
      dismissCallback.current(id);
    };
    const animate = (nextHeight: number | undefined, nextOpacity: number, nextX: number, duration: number, easing: (value: number) => number, complete: () => void) => {
      const run = ++revision;
      animation?.stop();
      if (motionPreference.current || !duration) {
        if (nextHeight !== undefined) height.setValue(nextHeight);
        opacity.setValue(nextOpacity);
        translateX.setValue(nextX);
        complete();
        return;
      }
      animation = Animated.parallel([
        ...(nextHeight === undefined ? [] : [Animated.timing(height, { easing, duration, toValue: nextHeight, useNativeDriver: false, isInteraction: false })]),
        Animated.timing(opacity, { easing, duration, toValue: nextOpacity, useNativeDriver: false, isInteraction: false }),
        Animated.timing(translateX, { easing, duration, toValue: nextX, useNativeDriver: false, isInteraction: false }),
      ]);
      animation.start(({ finished }) => { if (active && finished && run === revision) complete(); });
    };
    const enter = () => {
      if (!active || !motionReady.current || phase !== `pending` || measuredHeight.current <= 0) return;
      const now = Date.now();
      if (now >= dismissAt) { finish(); return; }
      const nextAt = Math.max(appearAt, entryTimeline.nextAt);
      if (nextAt > now) {
        clearTimeout(enterTimer);
        enterTimer = setTimeout(enter, nextAt - now);
        return;
      }
      entryTimeline.nextAt = now + TOAST_ENTRY_DELAY;
      phase = `entering`;
      setVisible(true);
      animate(measuredHeight.current + 10, 1, 0, TOAST_ENTER_DURATION, Easing.out(Easing.cubic), () => { phase = `visible`; });
    };
    const dismiss = () => {
      if (!active || phase === `exiting` || phase === `removed`) return;
      if (phase === `pending`) { finish(); return; }
      phase = `exiting`;
      setVisible(false);
      const collapse = () => animate(0, 0, 56, 160, Easing.inOut(Easing.cubic), finish);
      animate(undefined, 0, 56, TOAST_EXIT_DURATION, Easing.inOut(Easing.cubic), collapse);
    };
    const resize = () => {
      if (!active) return;
      if (phase === `pending` && Date.now() >= appearAt) enter();
      else if (phase === `entering` || phase === `visible`) {
        const duration = phase === `entering` ? TOAST_ENTER_DURATION : 160;
        animate(measuredHeight.current + 10, 1, 0, duration, Easing.out(Easing.cubic), () => { phase = `visible`; });
      }
    };
    const reduceMotion = () => {
      if (!active || !motionPreference.current) return;
      if (phase === `exiting`) animate(0, 0, 56, 0, Easing.linear, finish);
      else if (phase === `entering` || phase === `visible`) {
        animate(measuredHeight.current + 10, 1, 0, 0, Easing.linear, () => { phase = `visible`; });
      }
    };
    const currentController = { resize, dismiss, reduceMotion };
    controller.current = currentController;
    if (dismissAt <= Date.now()) finish();
    else {
      enterTimer = setTimeout(enter, Math.max(0, appearAt - Date.now()));
      timers.push(setTimeout(dismiss, Math.max(0, dismissAt - Date.now())));
    }
    return () => {
      active = false;
      ++revision;
      animation?.stop();
      clearTimeout(enterTimer);
      timers.forEach(timer => clearTimeout(timer));
      if (controller.current === currentController) controller.current = null;
    };
  }, [id, appearAt, dismissAt, height, opacity, translateX, entryTimeline]);

  useEffect(() => { controller.current?.reduceMotion(); }, [reducedMotion]);
  useEffect(() => { if (ready) controller.current?.resize(); }, [ready]);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight <= 0 || Math.abs(nextHeight - measuredHeight.current) < 1) return;
    measuredHeight.current = nextHeight;
    controller.current?.resize();
  }, []);
  const dismiss = useCallback(() => controller.current?.dismiss(), []);
  return { height, opacity, translateX, visible, onLayout, dismiss };
};
