import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  hero: { gap: 3, padding: 24, paddingTop: 42, paddingBottom: 34, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.paper },
  promise: { gap: 8, marginTop: 25, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line, alignItems: `center`, flexDirection: `row` },
  title: { fontSize: 48, color: palette.ink, lineHeight: 51, letterSpacing: -2, fontFamily: `DMSans_700Bold` },
  accent: { fontSize: 48, color: palette.accent, lineHeight: 51, letterSpacing: -2, fontFamily: `DMSans_700Bold` },
  eyebrow: { fontSize: 10, color: palette.ink, marginBottom: 22, letterSpacing: 1.6, fontFamily: `DMSans_700Bold` },
  promiseText: { fontSize: 11, color: palette.ink, letterSpacing: .3, fontFamily: `DMSans_600SemiBold` },
  description: { fontSize: 14, color: palette.muted, lineHeight: 23, marginTop: 20, fontFamily: `DMSans_400Regular` },
});
