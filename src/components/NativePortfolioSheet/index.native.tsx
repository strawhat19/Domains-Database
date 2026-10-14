import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { createStyles } from './styles.native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import { portfolioHaptic } from '../../shared/common/haptics.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

interface Props {
  id: string;
  title?: string;
  visible: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClose: () => void;
  onHidden?: () => void;
}

const NativePortfolioSheet = ({ id, title, visible, children, onClose, onHidden, disabled = false }: Props) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [present, setPresent] = useState(visible);
  const [shown, setShown] = useState(visible);
  const [expanded, setExpanded] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedTransparency, setReducedTransparency] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(windowHeight);
  const height = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const measuredHeight = useRef(0);
  const startHeight = useRef(0);
  const dragging = useRef(false);
  const suppressTap = useRef(0);
  const generation = useRef(0);
  const presentRef = useRef(visible);
  const retained = useRef({ title, children });
  const current = useRef({ visible, disabled, expanded, onClose, onHidden, reducedMotion, availableHeight });
  current.current = { visible, disabled, expanded, onClose, onHidden, reducedMotion, availableHeight };
  if (visible) retained.current = { title, children };
  const maximum = Math.max(100, Math.min(availableHeight * .9, availableHeight - insets.top - 12));
  const compact = Math.min(maximum, availableHeight * .5);
  const bounds = useRef({ maximum, compact });
  bounds.current = { maximum, compact };
  const finishExit = (version: number | null) => {
    if (version === null || version !== generation.current || current.current.visible) return;
    presentRef.current = false;
    setPresent(false);
    setExpanded(true);
    requestAnimationFrame(() => { if (!current.current.visible && generation.current === version) current.current.onHidden?.(); });
  };
  const exitCallback = useRef(finishExit);
  exitCallback.current = finishExit;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReducedMotion(value); }).catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener(`reduceMotionChanged`, setReducedMotion);
    const transparency = Platform.OS === `ios` ? AccessibilityInfo.addEventListener(`reduceTransparencyChanged`, setReducedTransparency) : null;
    if (Platform.OS === `ios`) void AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (active) setReducedTransparency(value); }).catch(() => undefined);
    const listener = height.addListener(({ value }) => { measuredHeight.current = value; });
    return () => { active = false; ++generation.current; motion.remove(); transparency?.remove(); height.removeListener(listener); height.stopAnimation(); progress.stopAnimation(); };
  }, [height, progress]);

  useEffect(() => {
    if (!visible && !presentRef.current) return;
    const version = ++generation.current;
    if (visible) {
      presentRef.current = true;
      setPresent(true);
      setShown(true);
      Animated.parallel([
        Animated.spring(height, { toValue: expanded ? maximum : compact, damping: 34, stiffness: 280, mass: 1, useNativeDriver: false, overshootClamping: true }),
        Animated.timing(progress, { toValue: 1, duration: reducedMotion ? 0 : 220, useNativeDriver: false }),
      ]).start();
      if (reducedMotion) height.setValue(expanded ? maximum : compact);
    } else {
      Animated.parallel([
        Animated.timing(height, { toValue: 0, duration: reducedMotion ? 0 : 220, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: reducedMotion ? 0 : 220, useNativeDriver: false }),
      ]).start(({ finished }) => {
        if (!finished || version !== generation.current || current.current.visible) return;
        setShown(false);
        if (Platform.OS !== `ios`) requestAnimationFrame(() => exitCallback.current(version));
      });
    }
  }, [visible, expanded, maximum, compact, reducedMotion, height, progress]);

  const restore = () => {
    const target = current.current.expanded ? bounds.current.maximum : bounds.current.compact;
    if (current.current.reducedMotion) height.setValue(target);
    else Animated.spring(height, { toValue: target, damping: 34, stiffness: 280, mass: 1, useNativeDriver: false, overshootClamping: true }).start();
  };
  const requestClose = () => {
    if (current.current.disabled) { restore(); return; }
    current.current.onClose();
  };
  const settle = (next: boolean) => {
    setExpanded(next);
    const target = next ? bounds.current.maximum : bounds.current.compact;
    if (current.current.reducedMotion) height.setValue(target);
    else Animated.spring(height, { toValue: target, damping: 34, stiffness: 280, mass: 1, useNativeDriver: false, overshootClamping: true }).start();
    portfolioHaptic(`tap`);
  };
  const callbacks = useRef({ restore, settle, requestClose });
  callbacks.current = { restore, settle, requestClose };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !current.current.disabled && Math.abs(gesture.dy) > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => { dragging.current = true; height.stopAnimation(); startHeight.current = measuredHeight.current; },
    onPanResponderMove: (_event, gesture) => height.setValue(Math.max(44, Math.min(bounds.current.maximum, startHeight.current - gesture.dy))),
    onPanResponderRelease: (_event, gesture) => {
      dragging.current = false;
      suppressTap.current = Date.now() + 220;
      const projected = measuredHeight.current - gesture.vy * 200;
      if (projected < bounds.current.maximum * .2) callbacks.current.requestClose();
      else callbacks.current.settle(Math.abs(projected - bounds.current.maximum) <= Math.abs(projected - bounds.current.compact));
    },
    onPanResponderTerminate: () => { dragging.current = false; suppressTap.current = Date.now() + 220; callbacks.current.restore(); },
    onPanResponderTerminationRequest: () => false,
  }), [height]);

  if (!present && !visible) return null;
  return <Modal transparent visible={shown} statusBarTranslucent navigationBarTranslucent animationType={`none`} presentationStyle={`overFullScreen`} onRequestClose={requestClose} onDismiss={() => exitCallback.current(current.current.visible ? null : generation.current)}>
    <View nativeID={`${id}-overlay`} style={styles.host}>
      <Animated.View pointerEvents={`none`} style={[styles.backdrop, { opacity: progress }]}>
        {!reducedTransparency && <BlurView intensity={38} tint={isDark ? `dark` : `light`} style={styles.backdrop} />}
        <View style={[styles.backdrop, { backgroundColor: reducedTransparency ? palette.canvas : palette.overlay }]} />
      </Animated.View>
      <Pressable nativeID={`${id}-backdrop`} accessibilityRole={`button`} accessibilityLabel={`Close ${title ?? `Settings`}`} disabled={disabled} onPress={requestClose} style={styles.backdrop} />
      <KeyboardAvoidingView pointerEvents={`box-none`} style={styles.keyboard} behavior={Platform.OS === `ios` ? `padding` : `height`} keyboardVerticalOffset={12}>
        <View pointerEvents={`box-none`} nativeID={`${id}-viewport`} style={styles.viewport} onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)}>
          <Animated.View nativeID={id} accessibilityViewIsModal onAccessibilityEscape={requestClose} style={[styles.sheet, { height, paddingBottom: insets.bottom }]}>
            <View nativeID={`${id}-grip-gesture`} {...pan.panHandlers}>
              <Pressable
                nativeID={`${id}-grip-target`}
                style={styles.gripTarget}
                disabled={disabled}
                accessibilityRole={`adjustable`}
                accessibilityLabel={`${title ?? `Settings`} Sheet Height`}
                accessibilityHint={`Drag Up To Expand, Down To Collapse Or Close`}
                accessibilityValue={{ min: 50, max: 90, now: expanded ? 90 : 50 }}
                accessibilityActions={[{ name: `increment`, label: `Expand Sheet` }, { name: `decrement`, label: `Collapse Sheet` }, { name: `escape`, label: `Close Sheet` }]}
                onAccessibilityAction={event => {
                  if (event.nativeEvent.actionName === `increment`) settle(true);
                  else if (event.nativeEvent.actionName === `decrement`) settle(false);
                  else if (event.nativeEvent.actionName === `escape`) requestClose();
                }}
                onPress={() => { if (!dragging.current && Date.now() >= suppressTap.current) settle(!expanded); }}
              ><View nativeID={`${id}-grip`} style={styles.grip} /></Pressable>
            </View>
            {!!retained.current.title && <View nativeID={`${id}-heading`} style={styles.header}>
              <Text nativeID={`${id}-title`} accessibilityRole={`header`} style={styles.title}>{retained.current.title}</Text>
              <Pressable nativeID={`${id}-close`} accessibilityRole={`button`} accessibilityLabel={`Close ${retained.current.title}`} disabled={disabled} onPress={requestClose} style={styles.close}><X size={20} color={palette.muted} /></Pressable>
            </View>}
            <View nativeID={`${id}-content`} style={styles.content}>{retained.current.children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
};

export default NativePortfolioSheet;
