import { StyleSheet } from 'react-native';

export const createStyles = (isDark: boolean, compact: boolean) => StyleSheet.create({
  root: { left: 0, right: 0, bottom: 0, zIndex: 0, position: `absolute`, overflow: `hidden`, opacity: compact ? isDark ? .14 : .1 : isDark ? .2 : .13 },
  dots: { top: 24, right: -12, width: compact ? 220 : 250, height: compact ? 165 : 188 },
  slabs: { left: compact ? -58 : 12, bottom: compact ? 16 : 32, width: compact ? 280 : 320, height: compact ? 192 : 220 },
  wash: { top: -120, right: -100, width: compact ? 350 : 440, height: compact ? 350 : 440, opacity: isDark ? .25 : .4 },
});
