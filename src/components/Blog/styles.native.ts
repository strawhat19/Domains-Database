import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 28, width: `100%`, maxWidth: 1120, alignSelf: `center`, paddingTop: 36, paddingBottom: 44 },
  intro: { gap: 28 },
  introText: { gap: 18 },
  sideBySideText: { flex: 1, gap: 14 },
  sideBySideIntro: { gap: 32, flexDirection: `row`, alignItems: `stretch` },
  sideBySideFooter: { gap: 6, paddingVertical: 14, marginTop: `auto` },
  eyebrow: { gap: 8, flexDirection: `row`, alignItems: `center` },
  eyebrowText: { fontSize: 10, letterSpacing: 1.5, color: palette.accent, fontFamily: `DMSans_700Bold` },
  title: { fontSize: 36, lineHeight: 42, letterSpacing: -1, color: palette.ink, fontFamily: `InstrumentSerif_400Regular` },
  wideTitle: { fontSize: 50, lineHeight: 57, letterSpacing: -1.5 },
  description: { maxWidth: 640, fontSize: 15, lineHeight: 26, color: palette.muted, fontFamily: `DMSans_400Regular` },
  introFooter: { gap: 10, paddingVertical: 18, borderTopWidth: 1, borderTopColor: palette.line },
  count: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_700Bold` },
  note: { fontSize: 12, color: palette.muted, fontFamily: `DMSans_400Regular` },
  featured: { gap: 12, alignSelf: `flex-start` },
  sideBySideFeatured: { alignSelf: `stretch` },
  featuredLabel: { gap: 8, flexDirection: `row`, alignItems: `center` },
  featuredTitle: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_700Bold` },
  grid: { gap: 20, flexWrap: `wrap`, flexDirection: `row`, alignItems: `stretch` },
});
