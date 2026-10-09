import type { RefObject } from 'react';
import { createStyles } from './styles.native';
import { useMemo, useImperativeHandle } from 'react';
import { Check, Pencil, X } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useNativeModalTitle } from './useModalTitle.native';
import { Text, View, Pressable, TextInput } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

export interface NativeModalTitleHandle {
  getValue: () => string;
}

interface NativeModalTitleProps {
  id: string;
  value: string;
  label: string;
  invalid?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  onChange: (value: string) => void;
  titleRef?: RefObject<NativeModalTitleHandle | null>;
}

const ModalTitle = ({ id, value, label, titleRef, maxLength, placeholder = `Untitled`, invalid = false, readOnly = false, disabled = false, onChange }: NativeModalTitleProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const title = useNativeModalTitle({ value, onChange, invalid, readOnly, disabled });
  useImperativeHandle(titleRef, () => ({ getValue: title.getValue }), [title.getValue]);

  return (
    <View {...elementProps(`modal-title`, id)} style={styles.title} onAccessibilityEscape={() => title.finish(false)}>
      {title.editing ? (
        <View {...elementProps(`modal-title-editor`, id)}>
          <TextInput
            multiline
            autoCorrect={false}
            selectTextOnFocus
            autoComplete={`off`}
            autoCapitalize={`none`}
            ref={title.editorRef}
            value={title.draft}
            maxLength={maxLength}
            editable={title.editable}
            returnKeyType={`done`}
            accessibilityLabel={label}
            placeholder={placeholder}
            submitBehavior={`blurAndSubmit`}
            onKeyPress={title.onKeyPress}
            onChangeText={title.setDraft}
            placeholderTextColor={palette.muted}
            {...elementProps(`modal-title-input`, id)}
            onBlur={() => title.finish(true)}
            onSubmitEditing={() => title.finish(true)}
            style={[styles.text, styles.input, invalid && styles.invalid]}
          />
          <View {...elementProps(`modal-title-actions`, id)} style={styles.actions}>
            {[
              { key: `confirm`, label: `Accept Title`, accept: true, Icon: Check },
              { key: `cancel`, label: `Cancel Title Edit`, accept: false, Icon: X },
            ].map(action => (
              <Pressable
                key={action.key}
                disabled={disabled}
                accessibilityRole={`button`}
                accessibilityLabel={action.label}
                onPress={() => title.finish(action.accept)}
                onPressIn={() => { if (!action.accept) title.finish(false); }}
                {...elementProps(`modal-title-action`, `${id}-${action.key}`)}
                style={({ pressed }) => [styles.action, pressed && styles.active, disabled && styles.disabled]}
              >
                <action.Icon size={16} color={palette.accent} {...elementProps(`modal-title-action-icon`, `${id}-${action.key}`)} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : title.editable ? (
        <Pressable
          onPress={title.open}
          accessibilityRole={`button`}
          {...elementProps(`modal-title-trigger`, id)}
          accessibilityLabel={`Edit ${label}: ${value || placeholder}`}
          accessibilityHint={`Tap To Edit, Then Accept Or Cancel`}
          style={({ pressed }) => [styles.trigger, pressed && styles.active, invalid && styles.invalid]}
        >
          <Text {...elementProps(`modal-title-value`, id)} style={[styles.text, !value && { color: palette.muted }]}>{value || placeholder}</Text>
          <Pencil size={15} color={palette.muted} {...elementProps(`modal-title-edit-icon`, id)} />
        </Pressable>
      ) : (
        <Text accessibilityRole={`header`} {...elementProps(`modal-title-value`, id)} style={[styles.text, !value && { color: palette.muted }]}>{value || placeholder}</Text>
      )}
    </View>
  );
};

export default ModalTitle;
