import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, wide: boolean) => StyleSheet.create({
  list: { gap: 8 },
  dimmed: { opacity: .6 },
  copy: { gap: 3, minWidth: 0, flexShrink: 1 },
  primaryText: { color: palette.contrast },
  expanded: { transform: [{ rotate: `180deg` }] },
  actions: { gap: 6, flexWrap: `wrap`, flexDirection: `row` },
  grid: { gap: 10, flexDirection: wide ? `row` : `column`, flexWrap: wide ? `wrap` : `nowrap` },
  meta: { gap: 6, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  primary: { borderColor: palette.accent, backgroundColor: palette.accent },
  activeStatus: { color: palette.success, backgroundColor: palette.successBackground },
  panel: { gap: 12, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 12 },
  title: { fontSize: 13, flexShrink: 1, color: palette.ink, fontFamily: `DMSans_700Bold` },
  heading: { fontSize: 16, flex: 1, color: palette.ink, fontFamily: `DMSans_700Bold` },
  price: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_700Bold` },
  note: { fontSize: 12, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
  error: { fontSize: 12, lineHeight: 18, color: palette.danger, fontFamily: `DMSans_400Regular` },
  status: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, color: palette.muted, backgroundColor: palette.subtle, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  buttonText: { fontSize: 12, color: palette.ink, flexShrink: 1, fontFamily: `DMSans_700Bold` },
  card: { minWidth: 0, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.paper },
  listingCard: { gap: 8, width: wide ? `48.9%` : `100%`, minWidth: 0, padding: 11, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper, justifyContent: `space-between` },
  review: { gap: 8, padding: 10, borderWidth: 1, borderRadius: 7, borderColor: palette.line, backgroundColor: palette.input },
  toggle: { gap: 8, minHeight: 44, paddingHorizontal: 12, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  row: { gap: 7, paddingVertical: 6, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between`, borderBottomWidth: 1, borderColor: palette.line },
  button: { gap: 6, minHeight: 44, maxWidth: `100%`, borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, flexDirection: `row`, alignSelf: `flex-start`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.input },
});
