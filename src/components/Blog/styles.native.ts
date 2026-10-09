import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 32, width: `100%`, maxWidth: 1120, alignSelf: `center`, paddingTop: 28, paddingBottom: 44 },
  intro: { gap: 24 },
  introText: { gap: 20, alignSelf: `stretch` },
  wideIntroText: { flex: 1 },
  introHeading: { gap: 20, alignItems: `flex-start` },
  wideIntroHeading: { gap: 28, flexDirection: `row`, alignItems: `center` },
  backLink: { gap: 8, minHeight: 36, flexDirection: `row`, alignItems: `center`, alignSelf: `flex-start` },
  backText: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  eyebrow: { gap: 8, padding: 12, borderWidth: 1, borderRadius: 999, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.subtle },
  eyebrowText: { fontSize: 9, letterSpacing: 1.3, color: palette.accent, fontFamily: `DMSans_700Bold` },
  title: { fontSize: 34, lineHeight: 42, letterSpacing: -1, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { maxWidth: 780, fontSize: 14, lineHeight: 26, color: palette.muted, fontFamily: `DMSans_400Regular` },
  featured: { paddingVertical: 32, backgroundColor: `#248477` },
  guides: { gap: 30, paddingTop: 10 },
  guidesIntro: { gap: 14, maxWidth: 660 },
  sectionTitle: { fontSize: 28, lineHeight: 36, letterSpacing: -.9, color: palette.ink, fontFamily: `DMSans_700Bold` },
  sectionDescription: { fontSize: 13, lineHeight: 24, color: palette.muted, fontFamily: `DMSans_400Regular` },
  grid: { rowGap: 32, columnGap: 20, flexWrap: `wrap`, flexDirection: `row`, alignItems: `stretch` },
});
