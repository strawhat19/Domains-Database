import { useMemo, type ReactNode } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Pressable, Text, View, Platform } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { CheckCircle2, TriangleAlert, Save, X } from 'lucide-react-native';

interface ToastProps {
  id?: string;
  inline?: boolean;
  message: string;
  action?: ReactNode;
  onDismiss?: () => void;
  kind?: `success` | `error` | `reminder`;
}

const Toast = ({ action, message, onDismiss, inline = false, kind = `error`, id = `toast` }: ToastProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!message) return null;
  const reminder = kind === `reminder`;
  const Icon = kind === `error` ? TriangleAlert : reminder ? Save : CheckCircle2;
  const color = kind === `error` ? palette.danger : reminder ? palette.accent : palette.success;
  return (
    <View
      {...elementProps(`toast`, id)}
      accessibilityRole={`alert`}
      accessibilityLiveRegion={`polite`}
      style={[styles.toast, inline && styles.inline, reminder && styles.reminder, !!action && styles.withAction]}
      {...(Platform.OS === `web` && inline ? { dataSet: { class: `toast`, inline: `true` } } : {})}
    >
      <Icon {...elementProps(`toast-icon`, id)} size={17} color={color} />
      <View {...elementProps(`toast-content`, id)} style={styles.content}>
        <Text {...elementProps(`toast-message`, id)} style={[styles.message, reminder && styles.reminderMessage, { color }]}>{message}</Text>
        {action}
      </View>
      {onDismiss && (
        <Pressable {...elementProps(`toast-dismiss`, id)} accessibilityLabel={`Dismiss Message`} onPress={onDismiss} style={styles.dismiss}>
          <X {...elementProps(`toast-dismiss-icon`, id)} size={16} color={palette.muted} />
        </Pressable>
      )}
    </View>
  );
};

export default Toast;
