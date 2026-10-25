import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { zIndex: 40, position: `relative` },
  photo: { ...StyleSheet.absoluteFillObject },
  button: { width: 40, height: 40, padding: 0, borderWidth: 1, borderRadius: 20, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  avatar: { width: 38, height: 38, borderRadius: 19, overflow: `hidden`, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.paper },
  skeleton: { width: 40, height: 40, borderRadius: 20, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.skeleton },
  initial: { fontSize: 16, color: palette.ink, fontFamily: `DMSans_700Bold` },
  linkText: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  signin: { gap: 7, padding: 10, borderRadius: 6, flexDirection: `row`, alignItems: `center`, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  options: { top: 46, right: 0, width: 248, zIndex: 40, position: `absolute`, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 6, ...Platform.select<ViewStyle>({
    web: { boxShadow: `0px 6px 18px rgba(0, 0, 0, 0.14)` },
    default: { elevation: 8, shadowColor: `#000`, shadowOffset: { width: 0, height: 6 }, shadowOpacity: .14, shadowRadius: 18 },
  }) },
  heading: { gap: 8, padding: 12, marginBottom: 4, borderBottomWidth: 1, flexDirection: `row`, alignItems: `center`, borderBottomColor: palette.line },
  name: { minWidth: 0, fontSize: 14, color: palette.ink, fontFamily: `DMSans_700Bold` },
  email: { minWidth: 0, fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  pillIcon: { flexShrink: 0 },
  identity: { gap: 4, flex: 1, minWidth: 0 },
  planPillText: { color: palette.contrast },
  planPill: { borderColor: palette.accent, backgroundColor: palette.accent },
  pillText: { minWidth: 0, flexShrink: 1, fontSize: 9, lineHeight: 12, includeFontPadding: false, color: palette.ink, fontFamily: `DMSans_700Bold` },
  pills: { gap: 4, flexShrink: 0, maxWidth: `55%`, alignItems: `flex-end`, justifyContent: `center` },
  pill: { gap: 4, height: 16, borderWidth: 1, flexShrink: 0, maxWidth: `100%`, borderRadius: 999, paddingHorizontal: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.subtle },
  item: { gap: 10, padding: 12, borderRadius: 6, flexDirection: `row`, alignItems: `center` },
  badgeText: { fontSize: 9, fontFamily: `DMSans_700Bold` },
  badge: { height: 20, minWidth: 20, marginLeft: `auto`, borderRadius: 999, paddingHorizontal: 5, alignItems: `center`, justifyContent: `center` },
  signout: { marginTop: 4, borderTopWidth: 1, borderTopColor: palette.line },
  signoutText: { fontSize: 12, color: palette.danger, fontFamily: `DMSans_600SemiBold` },
  error: { fontSize: 11, padding: 10, color: palette.danger, fontFamily: `DMSans_400Regular` },
});
