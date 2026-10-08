import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { CurrencyFieldProps } from './types';
import { Text, View, TextInput } from 'react-native';
import { useCurrencyField } from './useCurrencyField';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const CurrencyField = (props: CurrencyFieldProps) => {
  const { id, label, disabled = false } = props;
  const { palette } = useTheme();
  const field = useCurrencyField(props);
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View
      {...elementProps(`currency-field`, id)}
      style={[styles.field, field.focused && styles.focused, disabled && styles.disabled]}
    >
      <Text {...elementProps(`currency-field-prefix`, id)} style={styles.prefix} accessible={false}>{`$`}</Text>
      <TextInput
        maxLength={24}
        style={styles.input}
        value={field.draft}
        spellCheck={false}
        editable={!disabled}
        autoCorrect={false}
        onBlur={field.blur}
        onFocus={field.focus}
        placeholder={`0.00`}
        autoCapitalize={`none`}
        keyboardType={`decimal-pad`}
        onChangeText={field.change}
        placeholderTextColor={palette.muted}
        {...elementProps(`currency-field-input`, id)}
        accessibilityLabel={`${label} In USD`}
      />
    </View>
  );
};

export type { CurrencyFieldProps } from './types';
export default CurrencyField;
