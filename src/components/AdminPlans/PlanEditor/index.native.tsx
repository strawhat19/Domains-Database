import { useMemo } from 'react';
import { billingLabels } from '../values';
import { createStyles } from './styles.native';
import { X, Save } from 'lucide-react-native';
import type { PlanEditorProps } from './types';
import { usePlanEditor } from './usePlanEditor';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { planLimits, planCurrencies, planBillingIntervals } from '../../../shared/plans/types';

const PlanEditor = (props: PlanEditorProps) => {
  const { busy, record, onClose } = props;
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { error, values, submit, setField } = usePlanEditor(props);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const editorId = `admin-plan-editor-${record?.id ?? `new`}`;
  const compact = width <= 600;
  const inputs = [
    { field: `name`, label: `Name *`, limit: planLimits.name, wide: true },
    { field: `slug`, label: `Plan Slug *`, limit: planLimits.slug, note: record ? `The Slug Is Fixed After Creation` : `Lowercase Letters, Numbers, And Hyphens` },
    { field: `displayOrder`, label: `Display Order *`, limit: 16, note: `Lower Numbers Appear First` },
    { field: `description`, label: `Description`, limit: planLimits.description, wide: true, multiline: true },
    { field: `amount`, label: `Price (${values.currency}) *`, limit: 20, note: `Use Up To Two Decimal Places` },
    { field: `features`, label: `Features · One Per Line`, limit: planLimits.features * (planLimits.feature + 1), wide: true, multiline: true, note: `Up To ${planLimits.features} Features · ${planLimits.feature} Characters Each` },
  ] as const;
  const inputField = (input: typeof inputs[number]) => <View key={input.field} {...elementProps(`${editorId}-field`, input.field)} style={[styles.field, (compact || (`wide` in input && input.wide)) && styles.wideField]}>
    <Text {...elementProps(`${editorId}-label`, input.field)} style={styles.label}>{input.label}</Text>
    <TextInput
      {...elementProps(`${editorId}-input`, input.field)}
      maxLength={input.limit}
      value={values[input.field]}
      accessibilityLabel={input.label}
      editable={!busy && !(input.field === `slug` && !!record)}
      onChangeText={value => setField(input.field, value)}
      multiline={`multiline` in input && input.multiline}
      autoCapitalize={[`slug`, `amount`, `displayOrder`].includes(input.field) ? `none` : `sentences`}
      keyboardType={input.field === `amount` ? `decimal-pad` : input.field === `displayOrder` ? `number-pad` : `default`}
      placeholderTextColor={palette.placeholder}
      style={[styles.input, `multiline` in input && input.multiline && styles.multiline, input.field === `features` && styles.body]}
    />
    {`note` in input && <Text style={styles.fieldNote} {...elementProps(`${editorId}-note`, input.field)}>{input.note}</Text>}
  </View>;
  const choiceField = (field: `currency` | `billingInterval`, label: string, options: readonly { value: string; label: string }[]) => <View {...elementProps(`${editorId}-field`, field)} style={[styles.field, compact && styles.wideField]}>
    <Text {...elementProps(`${editorId}-label`, field)} style={styles.label}>{label}</Text>
    <View {...elementProps(`${editorId}-choices`, field)} style={styles.choices} accessibilityRole={`radiogroup`} accessibilityLabel={label}>
      {options.map(option => <Pressable key={option.value} {...elementProps(`${editorId}-choice`, `${field}-${option.value}`)} disabled={busy} onPress={() => setField(field, option.value)} accessibilityRole={`radio`} accessibilityState={{ checked: values[field] === option.value, disabled: busy }} accessibilityLabel={option.label} style={[styles.choice, values[field] === option.value && styles.selected]}><Text {...elementProps(`${editorId}-choice-label`, `${field}-${option.value}`)} style={[styles.choiceLabel, values[field] === option.value && styles.selectedLabel]}>{option.label}</Text></Pressable>)}
    </View>
  </View>;
  return <View {...elementProps(editorId)} style={[styles.root, compact && styles.compact]}>
    <View {...elementProps(`${editorId}-heading`)} style={styles.heading}>
      <Text {...elementProps(`${editorId}-title`)} style={styles.title} accessibilityRole={`header`}>{`${record ? `Edit` : `Add`} Plan`}</Text>
      <Pressable {...elementProps(`${editorId}-close`)} disabled={busy} onPress={onClose} style={styles.close} accessibilityRole={`button`} accessibilityState={{ disabled: busy }} accessibilityLabel={`Close Plan Editor`}><X {...elementProps(`${editorId}-close-icon`)} size={17} color={palette.accent} /></Pressable>
    </View>
    <View {...elementProps(`${editorId}-fields`)} style={styles.fields}>
      {inputs.slice(0, 5).map(inputField)}
      {choiceField(`currency`, `Currency`, planCurrencies.map(value => ({ value, label: value })))}
      {choiceField(`billingInterval`, `Billing Interval`, planBillingIntervals.map(value => ({ value, label: billingLabels[value] })))}
      <View {...elementProps(`${editorId}-field`, `status`)} style={[styles.field, compact && styles.wideField]}>
        <Text {...elementProps(`${editorId}-label`, `status`)} style={styles.label}>{`Status`}</Text>
        <View {...elementProps(`${editorId}-choices`, `status`)} style={styles.choices} accessibilityRole={`radiogroup`} accessibilityLabel={`Status`}>
          {[false, true].map(active => <Pressable key={String(active)} disabled={busy} onPress={() => setField(`active`, active)} accessibilityRole={`radio`} accessibilityState={{ checked: values.active === active, disabled: busy }} style={[styles.choice, values.active === active && styles.selected]} {...elementProps(`${editorId}-status`, active ? `active` : `inactive`)}><Text style={[styles.choiceLabel, values.active === active && styles.selectedLabel]} {...elementProps(`${editorId}-status-label`, active ? `active` : `inactive`)}>{active ? `Active` : `Inactive`}</Text></Pressable>)}
        </View>
      </View>
      {inputs.slice(5).map(inputField)}
    </View>
    <Text {...elementProps(`${editorId}-visibility-note`)} style={styles.note}>{`Active plans appear in Pricing. Inactive plans stay in Admin. Prices do not change account access.`}</Text>
    {!!error && <Text {...elementProps(`${editorId}-error`)} style={styles.error} accessibilityRole={`alert`}>{error}</Text>}
    <View {...elementProps(`${editorId}-actions`)} style={styles.actions}>
      <Pressable {...elementProps(`${editorId}-cancel`)} disabled={busy} onPress={onClose} style={[styles.cancel, busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: busy }}><X {...elementProps(`${editorId}-cancel-icon`)} size={14} color={palette.accent} /><Text {...elementProps(`${editorId}-cancel-label`)} style={styles.cancelLabel}>{`Cancel`}</Text></Pressable>
      <Pressable {...elementProps(`${editorId}-save`)} disabled={busy} onPress={() => { if (!busy) void submit().then(saved => { if (saved) onClose(); }); }} style={[styles.save, busy && styles.disabled]} accessibilityRole={`button`} accessibilityState={{ disabled: busy, busy }}><Save {...elementProps(`${editorId}-save-icon`)} size={14} color={palette.contrast} /><Text {...elementProps(`${editorId}-save-label`)} style={styles.saveLabel}>{busy ? `Saving` : `Save`}</Text></Pressable>
    </View>
  </View>;
};

export default PlanEditor;
