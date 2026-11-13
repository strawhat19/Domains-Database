import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  picker: { gap: 8, minWidth: 0 },
  pressed: { opacity: .78 },
  options: { gap: 6, flexWrap: `wrap`, flexDirection: `row` },
  heading: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_700Bold` },
  label: { fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  option: { gap: 5, minHeight: 44, borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, alignItems: `center`, flexDirection: `row`, borderColor: palette.line },
});
