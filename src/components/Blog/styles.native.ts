import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 36, width: `100%`, maxWidth: 1120, alignSelf: `center`, paddingTop: 28, paddingBottom: 44 },
  intro: { gap: 22 },
  introText: { gap: 14, alignSelf: `stretch` },
  wideIntroText: { flex: 1 },
  introHeading: { gap: 20, alignItems: `flex-start` },
  wideIntroHeading: { gap: 28, flexDirection: `row`, alignItems: `flex-start` },
  backLink: { gap: 8, minHeight: 36, paddingHorizontal: 10, borderWidth: 1, borderRadius: 3, flexDirection: `row`, alignItems: `center`, alignSelf: `flex-start`, borderColor: palette.line, backgroundColor: palette.paper },
  backText: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  eyebrow: { gap: 8, flexDirection: `row`, alignItems: `center`, alignSelf: `flex-start` },
  eyebrowText: { fontSize: 9, letterSpacing: 1.3, color: palette.accent, fontFamily: `DMSans_700Bold` },
  title: { fontSize: 44, lineHeight: 50, letterSpacing: -1.5, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { maxWidth: 780, fontSize: 14, lineHeight: 26, color: palette.muted, fontFamily: `DMSans_400Regular` },
  featured: { paddingBottom: 6 },
  guides: { gap: 30, paddingTop: 10 },
  guidesIntro: { gap: 14, maxWidth: 660 },
  sectionTitle: { fontSize: 28, lineHeight: 36, letterSpacing: -.9, color: palette.ink, fontFamily: `DMSans_700Bold` },
  sectionDescription: { fontSize: 13, lineHeight: 24, color: palette.muted, fontFamily: `DMSans_400Regular` },
  grid: { rowGap: 28, columnGap: 20, flexWrap: `wrap`, flexDirection: `row`, alignItems: `stretch` },
});
