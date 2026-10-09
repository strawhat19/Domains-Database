import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { width: `100%`, padding: 32, paddingVertical: 64, alignItems: `center`, justifyContent: `center` },
  compactPage: { padding: 24, paddingVertical: 40 },
  content: { gap: 16, width: `100%`, maxWidth: 620, alignItems: `center` },
  art: { gap: 6, marginBottom: 24, alignItems: `center` },
  compactArt: { marginBottom: 16 },
  code: { gap: 12, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  digit: { fontSize: 168, lineHeight: 190, letterSpacing: -8, color: palette.ink, fontFamily: `DMSans_700Bold` },
  compactDigit: { fontSize: 108, lineHeight: 124, letterSpacing: -5 },
  globeRing: { width: 144, height: 144, borderWidth: 1, borderRadius: 72, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.subtle },
  compactGlobeRing: { width: 94, height: 94, borderRadius: 47 },
  address: { gap: 7, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderRadius: 999, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  addressText: { color: palette.muted, fontSize: 11, letterSpacing: .2, fontFamily: `DMSans_500Medium` },
  eyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 2, textAlign: `center`, fontFamily: `DMSans_700Bold` },
  title: { color: palette.ink, fontSize: 40, lineHeight: 48, letterSpacing: -1.3, textAlign: `center`, fontFamily: `DMSans_700Bold` },
  compactTitle: { fontSize: 30, lineHeight: 38, letterSpacing: -.8 },
  description: { maxWidth: 420, color: palette.muted, fontSize: 14, lineHeight: 24, textAlign: `center`, fontFamily: `DMSans_400Regular` },
  actions: { gap: 12, maxWidth: `100%`, paddingTop: 12, flexWrap: `wrap`, flexDirection: `row`, justifyContent: `center` },
  compactActions: { width: `100%`, maxWidth: 280, flexDirection: `column` },
  button: { gap: 8, minHeight: 46, minWidth: 0, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderRadius: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  primaryButton: { borderColor: palette.accent, backgroundColor: palette.accent },
  buttonText: { flexShrink: 1, color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  primaryText: { color: palette.contrast },
  pressed: { opacity: .8 },
});
