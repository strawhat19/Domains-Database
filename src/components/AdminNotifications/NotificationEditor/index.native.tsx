import { useMemo } from 'react';
import { X, Save } from 'lucide-react-native';
import { createStyles } from './styles.native';
import type { NotificationEditorProps } from './types';
import { elementProps } from '../../../shared/elementProps';
import { useNotificationEditor } from './useNotificationEditor';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { AnnouncementStatus } from '../../../shared/models/notifications/Notification';

const NotificationEditor = (props: NotificationEditorProps) => {
  const { busy, record, onClose } = props;
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { error, values, submit, setField } = useNotificationEditor(props);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const editorId = `admin-notification-editor-${record?.id ?? `new`}`;
  const compact = width <= 600;
  const inputs = [
    { field: `title`, label: `Title *`, limit: 160, wide: true },
    { field: `slug`, label: `URL Slug *`, limit: 100, placeholder: `domains-announcement` },
    { field: `body`, label: `Body *`, limit: 5000, wide: true, multiline: true },
    { field: `suffix`, label: `Optional Text After The Link`, limit: 300, wide: true, multiline: true },
    { field: `linkLabel`, label: `Optional Link Label`, limit: 120 },
    { field: `linkHref`, label: `Optional Link Destination`, limit: 2048, placeholder: `/domains Or https://example.com` },
  ] as const;
  const inputField = (input: typeof inputs[number]) => <View key={input.field} {...elementProps(`${editorId}-field`, input.field)} style={[styles.field, (compact || (`wide` in input && input.wide)) && styles.wideField]}>
    <Text {...elementProps(`${editorId}-label`, input.field)} style={styles.label}>{input.label}</Text>
    <TextInput
      {...elementProps(`${editorId}-input`, input.field)}
      editable={!busy}
      maxLength={input.limit}
      value={values[input.field]}
      accessibilityLabel={input.label}
      onChangeText={value => setField(input.field, value)}
      placeholder={`placeholder` in input ? input.placeholder : undefined}
      multiline={`multiline` in input && input.multiline}
      autoCapitalize={input.field === `slug` || input.field === `linkHref` ? `none` : `sentences`}
      placeholderTextColor={palette.placeholder}
      style={[styles.input, `multiline` in input && input.multiline && styles.multiline, input.field === `body` && styles.body]}
    />
  </View>;
  const choiceField = (field: `kind` | `status`, label: string, options: readonly { value: string; label: string }[]) => <View {...elementProps(`${editorId}-field`, field)} style={[styles.field, compact && styles.wideField]}>
    <Text {...elementProps(`${editorId}-label`, field)} style={styles.label}>{label}</Text>
    <View {...elementProps(`${editorId}-choices`, field)} style={styles.choices} accessibilityRole={`radiogroup`} accessibilityLabel={label}>
      {options.map(option => <Pressable key={option.value} {...elementProps(`${editorId}-choice`, `${field}-${option.value}`)} disabled={busy} onPress={() => setField(field, option.value)} accessibilityRole={`radio`} accessibilityState={{ checked: values[field] === option.value, disabled: busy }} accessibilityLabel={option.label} style={[styles.choice, values[field] === option.value && styles.selected]}><Text {...elementProps(`${editorId}-choice-label`, `${field}-${option.value}`)} style={[styles.choiceLabel, values[field] === option.value && styles.selectedLabel]}>{option.label}</Text></Pressable>)}
    </View>
  </View>;
  return <View {...elementProps(editorId)} style={[styles.root, compact && styles.compact]}>
    <View {...elementProps(`${editorId}-heading`)} style={styles.heading}>
      <Text {...elementProps(`${editorId}-title`)} style={styles.title} accessibilityRole={`header`}>{`${record ? `Edit` : `Add`} Notification`}</Text>
      <Pressable {...elementProps(`${editorId}-close`)} disabled={busy} onPress={onClose} style={styles.close} accessibilityRole={`button`} accessibilityLabel={`Close Notification Editor`}><X {...elementProps(`${editorId}-close-icon`)} size={17} color={palette.accent} /></Pressable>
    </View>
    <View {...elementProps(`${editorId}-fields`)} style={styles.fields}>
      {inputs.slice(0, 2).map(inputField)}
      {choiceField(`kind`, `Kind`, [{ value: `announcement`, label: `Announcement` }, { value: `development`, label: `Development` }])}
      {inputs.slice(2).map(inputField)}
      {choiceField(`status`, `Status`, [{ value: AnnouncementStatus.Draft, label: `Inactive` }, { value: AnnouncementStatus.Active, label: `Active` }])}
    </View>
    <Text {...elementProps(`${editorId}-visibility-note`)} style={styles.note}>{`Inactive notifications stay in Admin. Active notifications appear in the bell menu and on the Notifications page.`}</Text>
    {!!error && <Text {...elementProps(`${editorId}-error`)} style={styles.error} accessibilityRole={`alert`}>{error}</Text>}
    <View {...elementProps(`${editorId}-actions`)} style={styles.actions}>
      <Pressable {...elementProps(`${editorId}-cancel`)} disabled={busy} onPress={onClose} style={[styles.cancel, busy && styles.disabled]} accessibilityRole={`button`}><X {...elementProps(`${editorId}-cancel-icon`)} size={14} color={palette.accent} /><Text {...elementProps(`${editorId}-cancel-label`)} style={styles.cancelLabel}>{`Cancel`}</Text></Pressable>
      <Pressable {...elementProps(`${editorId}-save`)} disabled={busy} onPress={() => { if (!busy) void submit().then(saved => { if (saved) onClose(); }); }} style={[styles.save, busy && styles.disabled]} accessibilityRole={`button`}><Save {...elementProps(`${editorId}-save-icon`)} size={14} color={palette.contrast} /><Text {...elementProps(`${editorId}-save-label`)} style={styles.saveLabel}>{busy ? `Saving` : `Save`}</Text></Pressable>
    </View>
  </View>;
};

export default NotificationEditor;
