import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { EditorModalProps } from './types';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../../shared/common/useReducedMotion';
import { Modal, Platform, Pressable, ScrollView, Text, View, KeyboardAvoidingView, useWindowDimensions } from 'react-native';

const EditorModal = ({ id, busy, error, onClose, children }: EditorModalProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const dismiss = () => { if (!busy) onClose(); };
  return <Modal transparent visible animationType={reducedMotion ? `none` : `fade`} onRequestClose={dismiss} {...elementProps(id)}>
    <KeyboardAvoidingView {...elementProps(`${id}-overlay`)} style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} behavior={Platform.OS === `ios` ? `padding` : undefined}>
      <Pressable {...elementProps(`${id}-backdrop`)} style={styles.backdrop} disabled={busy} onPress={dismiss} accessibilityRole={`button`} accessibilityLabel={`Close Notification Editor`} />
      <View {...elementProps(`${id}-panel`)} style={[styles.panel, { maxHeight: height - insets.top - insets.bottom - 48 }]} accessibilityViewIsModal>
        {!!error && <Text {...elementProps(`${id}-error`)} style={styles.error} accessibilityRole={`alert`}>{error}</Text>}
        <ScrollView {...elementProps(`${id}-content`)} style={styles.scroll} keyboardShouldPersistTaps={`handled`} contentContainerStyle={styles.content}>{children(dismiss)}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
};

export default EditorModal;
