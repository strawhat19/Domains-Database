import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  stack: { gap: 7, width: 88, flexShrink: 0 },
  compactStack: { gap: 5, width: 64 },
  tile: { width: `100%`, height: 30, paddingLeft: 12, paddingRight: 14, position: `relative`, alignItems: `center`, flexDirection: `row`, justifyContent: `space-between` },
  compactTile: { height: 25, paddingLeft: 9, paddingRight: 10 },
  label: { zIndex: 1, fontSize: 19, lineHeight: 23, color: isDark ? palette.canvas : palette.paper, fontFamily: `DMSans_700Bold` },
  compactLabel: { fontSize: 15, lineHeight: 19 },
  dot: { zIndex: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: `#19aeab` },
});
