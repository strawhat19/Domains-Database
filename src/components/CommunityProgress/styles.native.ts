import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 10 },
  top: { gap: 7, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center`, justifyContent: `space-between` },
  identity: { gap: 6, flexDirection: `row`, alignItems: `center` },
  title: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_700Bold` },
  xp: { color: palette.accent, fontSize: 11, fontFamily: `DMSans_700Bold` },
  track: { height: 5, overflow: `hidden`, borderRadius: 4, backgroundColor: palette.line },
  fill: { height: `100%`, borderRadius: 4, backgroundColor: palette.accent },
  caption: { color: palette.muted, fontSize: 10, lineHeight: 17, fontFamily: `DMSans_400Regular` },
  stats: { gap: 8, flexDirection: `row`, flexWrap: `wrap` },
  stat: { gap: 3, minWidth: 65, flexGrow: 1, padding: 9, borderRadius: 7, backgroundColor: palette.input },
  value: { color: palette.ink, fontSize: 15, fontFamily: `DMSans_700Bold` },
  label: { color: palette.muted, fontSize: 9, lineHeight: 15, fontFamily: `DMSans_500Medium` },
  badges: { gap: 6, flexDirection: `row`, flexWrap: `wrap` },
  badge: { gap: 4, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.subtle },
  badgeLabel: { color: palette.accent, fontSize: 9, fontFamily: `DMSans_600SemiBold` },
});
