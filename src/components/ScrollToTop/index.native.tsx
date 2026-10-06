import { useMemo } from 'react';
import { ArrowUp } from 'lucide-react-native';
import type { ScrollToTopProps } from './types';
import { createStyles } from './styles.native';
import { Animated, Pressable } from 'react-native';
import { useScrollToTop } from './useScrollToTop.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const ScrollToTop = ({ visible, onPress, bottomInset = 0 }: ScrollToTopProps) => {
  const { palette } = useTheme();
  const motion = useScrollToTop(visible);
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <Animated.View
      accessible={false}
      accessibilityElementsHidden={!visible}
      {...elementProps(`native-scroll-to-top`)}
      style={[styles.root, { bottom: 20 + bottomInset, pointerEvents: visible ? `auto` : `none` }, motion]}
      importantForAccessibility={visible ? `auto` : `no-hide-descendants`}
    >
      <Pressable
        onPress={onPress}
        disabled={!visible}
        accessibilityRole={`button`}
        accessibilityLabel={`Scroll To Top`}
        accessibilityState={{ disabled: !visible }}
        {...elementProps(`native-scroll-to-top-button`)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ArrowUp
          size={19}
          accessible={false}
          color={palette.accent}
          {...elementProps(`native-scroll-to-top-icon`)}
        />
      </Pressable>
    </Animated.View>
  );
};

export default ScrollToTop;
