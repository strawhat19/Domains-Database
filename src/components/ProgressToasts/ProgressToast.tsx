import type { createStyles } from './styles.native';
import type { ProgressToastTask } from './types';
import { useEffect, useRef, useState } from 'react';
import { elementProps } from '../../shared/elementProps';
import type { ThemePalette } from '../../shared/themeContext/theme';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { CheckCircle2, RotateCw, TriangleAlert, X } from 'lucide-react-native';
import { TOAST_ENTER_DURATION, TOAST_EXIT_DURATION } from '../ToastStack/motion';

const completeHold = 1_200;
const revealDelay = 650;
const enterOffset = 8;
const transition = Easing.out(Easing.cubic);

const ProgressToast = ({ task, palette, styles }: {
  task: ProgressToastTask;
  palette: ThemePalette;
  styles: ReturnType<typeof createStyles>;
}) => {
  const { id, label, detail, status, completed, total } = task;
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const failed = status === `error`;
  const complete = status === `complete`;
  const percent = complete ? 100 : typeof completed === `number` && typeof total === `number` && total > 0
    ? Math.min(99, Math.floor(Math.max(0, completed) / total * 100)) : undefined;
  const Icon = failed ? TriangleAlert : complete ? CheckCircle2 : RotateCw;
  const color = failed ? palette.danger : complete ? palette.success : palette.accent;
  const visible = revealed || failed;

  useEffect(() => {
    if (complete || failed || revealed) return;
    const timer = setTimeout(() => setRevealed(true), revealDelay);
    return () => clearTimeout(timer);
  }, [complete, failed, revealed]);

  useEffect(() => {
    if (!complete || !visible) return;
    const timer = setTimeout(() => setExiting(true), completeHold);
    return () => clearTimeout(timer);
  }, [complete, visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const fade = Animated.timing(opacity, {
      toValue: exiting ? 0 : 1,
      duration: reduced ? 0 : exiting ? TOAST_EXIT_DURATION : TOAST_ENTER_DURATION,
      easing: transition,
      useNativeDriver: true,
      isInteraction: false,
    });
    fade.start(({ finished }) => { if (active && finished && exiting) setDismissed(true); });
    return () => { active = false; fade.stop(); };
  }, [opacity, exiting, reduced, visible]);

  useEffect(() => {
    if (!visible || failed) return;
    if (percent === undefined && !reduced) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(progress, { toValue: 38, duration: 850, easing: transition, useNativeDriver: false, isInteraction: false }),
        Animated.timing(progress, { toValue: 18, duration: 850, easing: transition, useNativeDriver: false, isInteraction: false }),
      ]));
      pulse.start();
      return () => pulse.stop();
    }
    const fill = Animated.timing(progress, { toValue: percent ?? 30, duration: reduced ? 0 : 240, easing: transition, useNativeDriver: false, isInteraction: false });
    fill.start();
    return () => fill.stop();
  }, [failed, percent, progress, reduced, visible]);

  if (!visible || dismissed) return null;
  const translateY = opacity.interpolate({ inputRange: [0, 1], outputRange: [enterOffset, 0] });
  const width = progress.interpolate({ inputRange: [0, 100], outputRange: [`0%`, `100%`] });
  return (
    <Animated.View
      {...elementProps(`progress-toast`, id)}
      aria-hidden={exiting}
      accessibilityElementsHidden={exiting}
      importantForAccessibility={exiting ? `no-hide-descendants` : `auto`}
      style={[styles.toast, { opacity, pointerEvents: failed && !exiting ? `box-none` : `none`, transform: [{ translateY: reduced ? 0 : translateY }] }]}
    >
      <View {...elementProps(`progress-toast-heading`, id)} style={styles.row}>
        <Icon size={15} aria-hidden color={color} {...elementProps(`progress-toast-icon`, id)} />
        <Text {...elementProps(`progress-toast-title`, id)} style={styles.heading} accessibilityLiveRegion={`polite`}>
          {complete ? `${label} Complete` : failed ? `${label} Could Not Finish` : label}
        </Text>
        {!failed && percent !== undefined && <Text aria-hidden {...elementProps(`progress-toast-percent`, id)} style={styles.percent}>{`${percent}%`}</Text>}
        {failed && <Pressable
          style={styles.close}
          accessibilityRole={`button`}
          accessibilityLabel={`Dismiss ${label}`}
          onPress={() => setExiting(true)}
          {...elementProps(`progress-toast-dismiss`, id)}
        ><X size={15} aria-hidden color={palette.muted} {...elementProps(`progress-toast-dismiss-icon`, id)} /></Pressable>}
      </View>
      {failed ? !!detail && <Text {...elementProps(`progress-toast-detail`, id)} style={styles.detail}>{detail}</Text> : (
        <View
          style={styles.track}
          accessibilityLabel={label}
          accessibilityRole={`progressbar`}
          {...elementProps(`progress-toast-track`, id)}
          accessibilityValue={percent === undefined ? { text: `In Progress` } : { min: 0, max: 100, now: percent }}
        >
          <Animated.View aria-hidden {...elementProps(`progress-toast-fill`, id)} style={[styles.fill, { width, backgroundColor: color }]} />
        </View>
      )}
    </Animated.View>
  );
};

export default ProgressToast;
