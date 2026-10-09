import type { ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { zIndex: 40, position: `relative` },
  button: { width: 40, height: 40, padding: 1, borderWidth: 1, borderRadius: Platform.OS === `web` ? 5 : 6, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  avatar: { width: 36, height: 36, borderRadius: Platform.OS === `web` ? 4 : 5, alignItems: `center`, justifyContent: `center` },
  skeleton: { width: 40, height: 40, borderRadius: Platform.OS === `web` ? 5 : 6, backgroundColor: palette.skeleton },
  initial: { fontSize: 16, fontFamily: `DMSans_700Bold` },
  linkText: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  signin: { gap: 7, padding: 10, borderRadius: 6, flexDirection: `row`, alignItems: `center`, borderWidth: 1, borderColor: palette.line },
  options: { top: 46, right: 0, width: 248, zIndex: 40, position: `absolute`, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 6, ...Platform.select<ViewStyle>({
    web: { boxShadow: `0px 6px 18px rgba(0, 0, 0, 0.14)` },
    default: { elevation: 8, shadowColor: `#000`, shadowOffset: { width: 0, height: 6 }, shadowOpacity: .14, shadowRadius: 18 },
  }) },
  heading: { gap: 4, padding: 12, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: palette.line },
  name: { fontSize: 14, color: palette.ink, fontFamily: `DMSans_700Bold` },
  email: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  item: { gap: 10, padding: 12, borderRadius: 6, flexDirection: `row`, alignItems: `center` },
  badgeText: { fontSize: 9, fontFamily: `DMSans_700Bold` },
  badge: { height: 20, minWidth: 20, marginLeft: `auto`, borderRadius: 999, paddingHorizontal: 5, alignItems: `center`, justifyContent: `center` },
  signout: { marginTop: 4, borderTopWidth: 1, borderTopColor: palette.line },
  signoutText: { fontSize: 12, color: palette.danger, fontFamily: `DMSans_600SemiBold` },
  error: { fontSize: 11, padding: 10, color: palette.danger, fontFamily: `DMSans_400Regular` },
});
