import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 8 },
  roomy: { width: 220 },
  disabled: { opacity: .55 },
  options: { gap: 8, flex: 1, minWidth: 0, flexDirection: `row` },
  heading: { gap: 10, minWidth: 0, flexDirection: `row`, alignItems: `center` },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  title: { flexShrink: 0, fontSize: 13, color: palette.ink, fontFamily: `DMSans_700Bold` },
  label: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  copy: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
  error: { fontSize: 12, lineHeight: 18, color: palette.danger, fontFamily: `DMSans_400Regular` },
  option: { flex: 1, gap: 8, minHeight: 38, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: palette.line, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
});
