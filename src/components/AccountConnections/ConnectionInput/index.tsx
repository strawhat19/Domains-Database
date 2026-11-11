import { Eye, EyeOff } from 'lucide-react-native';
import type { createStyles } from '../styles.native';
import { elementProps } from '../../../shared/elementProps';
import { Platform, Pressable, TextInput, View } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

interface ConnectionInputProps {
  busy: boolean;
  value: string;
  label: string;
  fieldId: string;
  loading: boolean;
  revealed: boolean;
  maxLength?: number;
  readOnly?: boolean;
  onToggle?: () => void;
  palette: ThemePalette;
  description: string;
  placeholder: string;
  editMasked?: boolean;
  descriptionIds: string;
  onSubmitEditing?: () => void;
  onChange: (value: string) => void;
  styles: ReturnType<typeof createStyles>;
}

const ConnectionInput = ({
  busy, value, label, fieldId, styles, palette, loading, revealed, maxLength, placeholder, description,
  descriptionIds, onChange, onToggle, onSubmitEditing, editMasked = false, readOnly = false,
}: ConnectionInputProps) => {
  const RevealIcon = revealed ? EyeOff : Eye;
  const disabled = busy || loading || !value.trim();
  return (
    <View {...elementProps(`connection-input-wrap`, fieldId)} style={styles.inputWrap}>
      {loading ? <View {...elementProps(`connection-skeleton`, fieldId)} style={styles.skeleton} /> : (
        <TextInput
          {...elementProps(`connection-input`, fieldId)}
          {...(Platform.OS === `web` ? { 'aria-describedby': descriptionIds } : {})}
          style={onToggle ? styles.input : [styles.input, { paddingRight: 12 }]}
          autoCorrect={false}
          autoComplete={`off`}
          autoCapitalize={`none`}
          multiline={false}
          editable={!busy && !readOnly && (revealed || editMasked)}
          value={value}
          maxLength={maxLength}
          secureTextEntry={!revealed}
          placeholder={placeholder}
          accessibilityLabel={label}
          accessibilityHint={description}
          placeholderTextColor={palette.placeholder}
          onChangeText={onChange}
          onSubmitEditing={onSubmitEditing}
        />
      )}
      {onToggle && (
        <Pressable
          {...elementProps(`connection-reveal`, fieldId)}
          {...(Platform.OS === `web` ? { 'aria-pressed': revealed } : {})}
          disabled={disabled}
          onPress={onToggle}
          accessibilityRole={`button`}
          style={[styles.revealButton, disabled && styles.disabled]}
          accessibilityState={{ disabled }}
          accessibilityLabel={`${revealed ? `Hide` : `Show`} ${label}`}
        >
          <RevealIcon {...elementProps(`connection-reveal-icon`, fieldId)} size={18} color={palette.muted} />
        </Pressable>
      )}
    </View>
  );
};

export default ConnectionInput;
