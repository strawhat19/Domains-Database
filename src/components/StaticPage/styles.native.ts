import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 28, padding: 24, paddingTop: 38 },
  backLink: { gap: 7, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center` },
  backText: { color: palette.muted, fontSize: 12, fontFamily: `DMSans_500Medium` },
  heading: { gap: 14, paddingBottom: 8 },
  eyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 2.2, fontFamily: `DMSans_600SemiBold` },
  title: { color: palette.ink, fontSize: 44, lineHeight: 48, fontFamily: `InstrumentSerif_400Regular` },
  description: { color: palette.muted, fontSize: 14, lineHeight: 23, fontFamily: `DMSans_400Regular` },
  sections: { gap: 24 },
  section: { gap: 12, paddingTop: 24, borderTopWidth: 1, borderTopColor: palette.line },
  sectionTitle: { color: palette.ink, fontSize: 18, fontFamily: `DMSans_600SemiBold` },
  sectionBody: { color: palette.muted, fontSize: 14, lineHeight: 24, fontFamily: `DMSans_400Regular` },
});
