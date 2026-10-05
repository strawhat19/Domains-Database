import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { createStyles } from './styles.native';
import { Sun, Moon } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const ThemeToggle = () => {
  const { ready, isDark, palette, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const Icon = isDark ? Sun : Moon;

  return (
    <Pressable
      onPress={toggleTheme}
      disabled={!ready}
      accessibilityRole={`button`}
      accessibilityState={{ selected: isDark, disabled: !ready }}
      {...elementProps(`native-header-theme-toggle`)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityLabel={isDark ? `Switch to light mode` : `Switch to dark mode`}
    >
      <Icon
        size={18}
        color={palette.ink}
        {...elementProps(`native-header-theme-toggle-icon`)}
      />
    </Pressable>
  );
};

export default ThemeToggle;
