import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { gap: 0 },
  feedback: { marginBottom: 10 },
  scroll: { minHeight: 0, flexGrow: 0, flexShrink: 1 },
  root: { left: 24, right: 24, bottom: 24, zIndex: 110, maxWidth: 720, position: `absolute` },
});
