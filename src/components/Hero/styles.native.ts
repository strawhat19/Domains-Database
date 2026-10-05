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
  search: { gap: 9, width: `100%`, maxWidth: 430, marginTop: 22 },
  searchRow: { gap: 6, padding: 5, borderWidth: 1, borderRadius: 7, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  searchLabel: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_500Medium` },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12, color: palette.ink, paddingVertical: 10, paddingHorizontal: 8, fontFamily: `DMSans_500Medium` },
  searchButton: { gap: 6, minHeight: 38, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 13, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.accent },
  searchButtonText: { fontSize: 12, color: palette.contrast, fontFamily: `DMSans_700Bold` },
});
