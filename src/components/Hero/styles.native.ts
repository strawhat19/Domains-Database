import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, isDark = false) => StyleSheet.create({
  hero: { gap: 3, padding: 24, width: `100%`, paddingTop: 42, paddingBottom: 34, position: `relative`, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.paper },
  promise: { gap: 8, zIndex: 1, marginTop: 25, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line, alignItems: `center`, flexDirection: `row` },
  title: { zIndex: 1, fontSize: 48, color: palette.ink, lineHeight: 51, letterSpacing: -2, fontFamily: `DMSans_700Bold` },
  accent: { zIndex: 1, fontSize: 48, color: palette.accent, lineHeight: 51, letterSpacing: -2, fontFamily: `DMSans_700Bold` },
  eyebrow: { zIndex: 1, fontSize: 10, color: palette.ink, marginBottom: 22, letterSpacing: 1.6, fontFamily: `DMSans_700Bold` },
  promiseText: { fontSize: 11, color: palette.ink, letterSpacing: .3, fontFamily: `DMSans_600SemiBold` },
  description: { zIndex: 1, fontSize: 14, color: palette.muted, lineHeight: 23, marginTop: 20, fontFamily: `DMSans_400Regular` },
  search: { gap: 9, zIndex: 1, width: `100%`, maxWidth: 430, marginTop: 22 },
  searchRow: {
    gap: 6,
    padding: 5,
    borderWidth: 1,
    borderRadius: 7,
    flexDirection: `row`,
    alignItems: `center`,
    borderColor: isDark ? `${palette.accent}80` : palette.line,
    backgroundColor: isDark ? palette.subtle : palette.paper,
    ...(isDark ? Platform.select<ViewStyle>({
      web: {},
      default: { elevation: 2, shadowRadius: 14, shadowOpacity: .15, shadowColor: palette.accent, shadowOffset: { width: 0, height: 3 } },
    }) : {}),
  },
  searchLabel: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_500Medium` },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12, color: palette.ink, paddingVertical: 10, paddingHorizontal: 8, fontFamily: `DMSans_500Medium` },
  searchButton: { gap: 6, minHeight: 38, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 13, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.accent },
  searchButtonText: { fontSize: 12, color: palette.contrast, fontFamily: `DMSans_700Bold` },
  recentPressed: { opacity: .6 },
  recentsItems: { gap: 5, flex: 1, minWidth: 0, flexWrap: `wrap`, alignItems: `center`, flexDirection: `row` },
  recentsHeading: { gap: 4, flexShrink: 0, alignItems: `center`, flexDirection: `row` },
  recents: { gap: 8, minWidth: 0, alignItems: `center`, flexDirection: `row` },
  recentsLabel: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_500Medium` },
  recentsError: { fontSize: 10, color: palette.danger, fontFamily: `DMSans_400Regular` },
  recentsMessage: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_400Regular` },
  recentQuery: { flexShrink: 1, fontSize: 10, color: palette.muted, fontFamily: `DMSans_500Medium` },
  recent: { gap: 4, minWidth: 0, maxWidth: 130, borderWidth: 1, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 6, alignItems: `center`, flexDirection: `row`, borderColor: palette.line, backgroundColor: palette.paper },
});
