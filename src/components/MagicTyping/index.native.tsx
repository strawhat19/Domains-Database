import type { MagicTypingProps } from './types';
import { Sparkles } from 'lucide-react-native';
import { View, Text, Animated } from 'react-native';
import { createStyles } from './styles.native';
import { useMagicTyping } from './useMagicTyping';
import { elementProps } from '../../shared/elementProps';
import { useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';

const MagicTyping = ({ suffix, paused = false }: MagicTypingProps) => {
  const { palette } = useTheme();
  const { text, animateCaret } = useMagicTyping(paused);
  const opacity = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    opacity.setValue(1);
    if (!animateCaret) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: .25, duration: 550, isInteraction: false, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 550, isInteraction: false, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity, animateCaret]);

  return (
    <View
      accessible
      style={styles.hint}
      accessibilityRole={`text`}
      accessibilityLiveRegion={`none`}
      accessibilityLabel={`Imagine a domain name`}
      {...elementProps(`magic-typing`, suffix)}
    >
      <View
        style={styles.content}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`magic-typing-content`, suffix)}
      >
        <Sparkles {...elementProps(`magic-typing-icon`, suffix)} size={12} color={palette.accent} />
        <Text {...elementProps(`magic-typing-label`, suffix)} style={styles.label}>{`Imagine`}</Text>
        <View {...elementProps(`magic-typing-example`, suffix)} style={styles.example}>
          <Text {...elementProps(`magic-typing-domain`, suffix)} style={styles.domain} numberOfLines={1}>{text}</Text>
          <Animated.View {...elementProps(`magic-typing-caret`, suffix)} style={[styles.caret, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

export default MagicTyping;
