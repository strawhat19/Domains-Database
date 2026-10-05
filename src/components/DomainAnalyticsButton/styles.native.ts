import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  compact: { width: 34, paddingHorizontal: 7 },
  pressed: { backgroundColor: palette.subtle },
  text: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  button: { gap: 6, minHeight: 34, borderWidth: 1, borderRadius: 7, paddingVertical: 7, paddingHorizontal: 10, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line },
});
