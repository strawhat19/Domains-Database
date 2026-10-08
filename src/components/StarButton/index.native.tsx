import { useMemo } from 'react';
import { Star } from 'lucide-react-native';
import { Pressable } from 'react-native';
import type { StarButtonProps } from './types';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const StarButton = ({ id, label, starred, disabled = false, onPress, size = 28 }: StarButtonProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const color = starred ? `#fbbf24` : palette.muted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={`button`}
      accessibilityLabel={label}
      {...elementProps(`star-button`, id)}
      accessibilityState={{ disabled, selected: starred }}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        starred && styles.starred,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Star
        size={16}
        color={color}
        accessible={false}
        fill={starred ? color : `none`}
        {...elementProps(`star-button-icon`, id)}
      />
    </Pressable>
  );
};

export default StarButton;
