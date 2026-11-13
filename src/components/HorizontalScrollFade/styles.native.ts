import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  left: { left: 0 },
  right: { right: 0 },
  frame: { minWidth: 0, position: `relative` },
  fade: { top: 0, bottom: 0, width: 24, zIndex: 4, position: `absolute`, pointerEvents: `none` },
});
