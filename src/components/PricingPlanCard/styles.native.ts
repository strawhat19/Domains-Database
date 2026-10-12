import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  foreground: { top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, position: `absolute` },
  backing: { top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, position: `absolute`, transform: [{ translateX: 7 }, { translateY: 6 }] },
  card: { gap: 15, padding: 24, borderWidth: 1, position: `relative`, borderColor: `transparent`, backgroundColor: `transparent` },
});
