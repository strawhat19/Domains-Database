import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  pressed: { opacity: .8 },
  root: { gap: 18, minWidth: 0, width: `100%` },
  heading: { gap: 8, minWidth: 0 },
  titleRow: { gap: 8, flexDirection: `row`, alignItems: `center` },
  title: { flexShrink: 1, color: palette.ink, fontSize: 19, fontFamily: `DMSans_700Bold` },
  copy: { color: palette.muted, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  cards: { gap: 14, minWidth: 0, flexWrap: `wrap`, flexDirection: `row` },
  card: { gap: 14, padding: 18, minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: 260, maxWidth: `100%`, minHeight: 152, borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.paper, flexDirection: `row`, alignItems: `flex-start` },
  iconWrap: { width: 42, height: 42, flexShrink: 0, borderRadius: 10, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.subtle },
  cardCopy: { gap: 10, flex: 1, minWidth: 0 },
  cardHeading: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  cardTitle: { flexShrink: 1, color: palette.ink, fontSize: 15, lineHeight: 21, fontFamily: `DMSans_700Bold` },
  badge: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 5, backgroundColor: palette.subtle },
  badgeText: { color: palette.muted, fontSize: 9, lineHeight: 14, fontFamily: `DMSans_600SemiBold` },
  availableBadge: { backgroundColor: palette.successBackground },
  availableBadgeText: { color: palette.success },
  cardOpen: { gap: 6, marginTop: 2, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  comingSoon: { gap: 18, padding: 22, borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.paper },
  comingSoonHeading: { gap: 12, flexDirection: `row`, alignItems: `center` },
  comingSoonTitle: { flexShrink: 1, color: palette.ink, fontSize: 20, fontFamily: `DMSans_700Bold` },
  actions: { gap: 10, flexWrap: `wrap`, flexDirection: `row` },
  link: { gap: 7, minHeight: 36, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderRadius: 7, borderColor: palette.line, backgroundColor: palette.paper, flexDirection: `row`, alignItems: `center` },
  linkText: { color: palette.accent, fontSize: 11, lineHeight: 16, fontFamily: `DMSans_600SemiBold` },
});
