import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  dark: { opacity: .68 },
  light: { opacity: .5 },
  art: { ...StyleSheet.absoluteFillObject },
  outer: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: `hidden` },
});
