import { useMemo, type ReactNode } from 'react';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react-native';

interface ToastProps {
  id?: string;
  message: string;
  action?: ReactNode;
  onDismiss?: () => void;
  kind?: `success` | `error`;
}

const Toast = ({ action, message, onDismiss, kind = `error`, id = `toast` }: ToastProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!message) return null;
  const Icon = kind === `error` ? TriangleAlert : CheckCircle2;
  const color = kind === `error` ? palette.danger : palette.success;
  return (
    <View {...elementProps(`toast`, id)} style={[styles.toast, !!action && styles.withAction]} accessibilityRole={`alert`} accessibilityLiveRegion={`polite`}>
      <Icon {...elementProps(`toast-icon`, id)} size={17} color={color} />
      <View {...elementProps(`toast-content`, id)} style={styles.content}>
        <Text {...elementProps(`toast-message`, id)} style={[styles.message, { color }]}>{message}</Text>
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
