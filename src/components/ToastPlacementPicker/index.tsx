import { useMemo } from 'react';
import { createStyles } from './styles';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight } from 'lucide-react-native';
import { setToastPlacement, useToastPlacement, type ToastPlacement } from '../../shared/toastPlacement/useToastPlacement';

const options = [
  { value: `top-left`, label: `Top Left`, Icon: ArrowUpLeft },
  { value: `top-right`, label: `Top Right`, Icon: ArrowUpRight },
  { value: `bottom-left`, label: `Bottom Left`, Icon: ArrowDownLeft },
  { value: `bottom-right`, label: `Bottom Right`, Icon: ArrowDownRight },
] as const satisfies readonly { value: ToastPlacement; label: string; Icon: typeof ArrowUpLeft }[];

const ToastPlacementPicker = () => {
  const placement = useToastPlacement();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`toast-placement-picker`)} style={styles.picker}>
      <Text {...elementProps(`toast-placement-heading`)} style={styles.heading}>{`Toast Position`}</Text>
      <View {...elementProps(`toast-placement-options`)} style={styles.options} accessibilityRole={`radiogroup`} accessibilityLabel={`Toast Position`}>
        {options.map(({ Icon, value, label }) => {
          const selected = placement === value;
          const color = selected ? palette.accent : palette.muted;
          return (
            <Pressable
              key={value}
              accessibilityRole={`radio`}
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              onPress={() => setToastPlacement(value)}
              {...elementProps(`toast-placement-option`, value)}
              style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}
            >
              <Icon size={14} aria-hidden color={color} {...elementProps(`toast-placement-option-icon`, value)} />
              <Text {...elementProps(`toast-placement-option-label`, value)} style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ToastPlacementPicker;
