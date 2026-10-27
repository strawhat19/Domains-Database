import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { width: 20, height: 20, flexShrink: 0, alignItems: `center`, justifyContent: `center` },
  image: { position: `absolute`, left: 0, top: 0, width: `100%`, height: `100%` },
  mark: { backgroundColor: palette.paper },
  largeMark: { top: 9, left: 9, width: 24, height: 24, backgroundColor: palette.subtle },
  avatar: { width: 24, height: 24, overflow: `hidden`, borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.subtle },
  large: { width: 42, height: 42, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.subtle },
  initial: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
});
