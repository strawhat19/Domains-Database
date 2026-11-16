import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  dark: { opacity: .68 },
  light: { opacity: .5 },
  art: { ...StyleSheet.absoluteFill },
  outer: { ...StyleSheet.absoluteFill, zIndex: 0, overflow: `hidden` },
});
