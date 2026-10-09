import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Sun, Moon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const themeOptions = [
  { value: `dark`, label: `Dark`, Icon: Moon },
  { value: `light`, label: `Light`, Icon: Sun },
] as const;

const ProfileThemePreference = ({ roomy = false }: { roomy?: boolean }) => {
  const { theme, ready, error, palette, setThemePreference } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`profile-theme-preference`)} style={[styles.root, roomy && styles.roomy]}>
      <View {...elementProps(`profile-theme-heading`)} style={styles.heading}>
        <Text {...elementProps(`profile-theme-title`)} style={styles.title} accessibilityRole={`header`}>{`Theme`}</Text>
        <View {...elementProps(`profile-theme-options`)} style={styles.options} accessibilityRole={`radiogroup`} accessibilityLabel={`Theme`}>
          {themeOptions.map(({ value, label, Icon }) => (
            <Pressable
              key={value}
              disabled={!ready}
              accessibilityRole={`radio`}
              accessibilityLabel={`${label} Theme`}
              onPress={() => setThemePreference(value)}
              {...elementProps(`profile-theme-option`, value)}
              accessibilityState={{ checked: theme === value, disabled: !ready }}
              style={[styles.option, theme === value && styles.selected, !ready && styles.disabled]}
            >
              <Icon {...elementProps(`profile-theme-option-icon`, value)} size={16} color={theme === value ? palette.accent : palette.muted} />
              <Text {...elementProps(`profile-theme-option-text`, value)} style={styles.label}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {Boolean(error) && <Text {...elementProps(`profile-theme-error`)} style={styles.error} accessibilityRole={`alert`}>{error}</Text>}
    </View>
  );
};

export default ProfileThemePreference;
