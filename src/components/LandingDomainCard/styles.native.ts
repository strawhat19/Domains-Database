import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  pressed: { opacity: .65 },
  foreground: { ...StyleSheet.absoluteFillObject, zIndex: 0, pointerEvents: `none` },
  backing: { ...StyleSheet.absoluteFillObject, zIndex: 0, pointerEvents: `none`, transform: [{ translateX: 7 }, { translateY: 6 }] },
  card: { gap: 17, minWidth: 0, flexGrow: 1, width: `100%`, padding: 24, position: `relative` },
  top: { gap: 12, zIndex: 1, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  extension: { fontSize: 11, borderRadius: 5, paddingVertical: 5, paddingHorizontal: 8, color: palette.accent, backgroundColor: palette.subtle, fontFamily: `DMSans_600SemiBold` },
  name: { zIndex: 1, fontSize: 21, lineHeight: 28, color: palette.ink, letterSpacing: -.7, fontFamily: `DMSans_600SemiBold` },
  quote: { gap: 7, zIndex: 1, marginTop: `auto` },
  registrar: { fontSize: 10, lineHeight: 15, color: palette.muted, fontFamily: `DMSans_400Regular` },
  priceRow: { gap: 7, flexWrap: `wrap`, flexDirection: `row`, alignItems: `baseline` },
  price: { fontSize: 25, lineHeight: 33, color: palette.ink, letterSpacing: -.8, fontFamily: `DMSans_600SemiBold` },
  term: { fontSize: 10, lineHeight: 15, color: palette.muted, fontFamily: `DMSans_400Regular` },
  actionsCell: { gap: 10, zIndex: 1, borderTopWidth: 1, paddingTop: 14, marginTop: 3, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, justifyContent: `space-between` },
  rowStatus: { gap: 4, flexDirection: `row`, alignItems: `center` },
  statusDotWrap: { width: 10, height: 10, alignItems: `center`, justifyContent: `center` },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.success },
  statusText: { fontSize: 10, color: palette.success, fontFamily: `DMSans_500Medium` },
  search: { gap: 6, borderRadius: 5, paddingVertical: 8, paddingHorizontal: 10, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.subtle },
  searchLabel: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
});
