import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  section: { width: `100%`, borderTopWidth: 1, paddingVertical: 64, paddingHorizontal: 32, borderTopColor: palette.line, backgroundColor: palette.paper },
  compactSection: { paddingVertical: 44, paddingHorizontal: 20 },
  inner: { gap: 26, width: `100%`, maxWidth: 1056, alignSelf: `center` },
  intro: { gap: 26 },
  wideIntro: { gap: 36, alignItems: `center`, flexDirection: `row` },
  copy: { gap: 11, flexShrink: 1, maxWidth: 600 },
  wideCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1.6, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  title: { fontSize: 28, lineHeight: 35, letterSpacing: -.7, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { fontSize: 13, lineHeight: 22, color: palette.muted, fontFamily: `DMSans_400Regular` },
  grid: { gap: 14, flexWrap: `wrap`, flexDirection: `row`, alignItems: `stretch` },
  cardBacking: { ...StyleSheet.absoluteFillObject, zIndex: 0, transform: [{ translateX: 7 }, { translateY: 6 }] },
  cardForeground: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  featureCard: { gap: 13, padding: 23, borderWidth: 1, position: `relative`, borderColor: `transparent`, backgroundColor: `transparent` },
  featureHeading: { gap: 12, zIndex: 1, alignItems: `center`, flexDirection: `row`, justifyContent: `space-between` },
  featureTitle: { flex: 1, fontSize: 17, lineHeight: 23, color: palette.ink, fontFamily: `DMSans_700Bold` },
  featureDescription: { zIndex: 1, fontSize: 12, lineHeight: 21, color: palette.muted, fontFamily: `DMSans_400Regular` },
  illustrationFrame: { gap: 12, padding: 14, borderWidth: 1, position: `relative`, borderColor: `transparent`, backgroundColor: `transparent` },
  illustration: { zIndex: 1, width: `100%`, aspectRatio: 1.6 },
  caption: { zIndex: 1, fontSize: 10, lineHeight: 17, color: palette.muted, fontFamily: `DMSans_400Regular` },
  note: { fontSize: 10, lineHeight: 17, maxWidth: 640, color: palette.muted, fontFamily: `DMSans_400Regular` },
});
