import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette, wide: boolean) => StyleSheet.create({
  hero: { minHeight: wide ? 256 : 220, overflow: `hidden`, justifyContent: `center`, paddingVertical: wide ? 38 : 25 },
  compactHero: { minHeight: 0, paddingTop: 16, paddingBottom: 4 },
  art: {
    top: wide ? -92 : -63,
    right: wide ? -80 : -122,
    width: wide ? 860 : 620,
    height: wide ? 645 : 465,
    position: `absolute`,
    pointerEvents: `none`,
  },
  content: { gap: 10, zIndex: 1, maxWidth: 560 },
  eyebrow: { gap: 7, flexDirection: `row`, alignItems: `center` },
  eyebrowText: { fontSize: 10, letterSpacing: 1.5, color: palette.accent, fontFamily: `DMSans_700Bold` },
  title: { fontSize: wide ? 54 : 39, lineHeight: wide ? 61 : 45, letterSpacing: wide ? -1.5 : -.9, color: palette.ink, fontFamily: `DMSans_700Bold` },
  compactTitle: { fontSize: wide ? 33 : 25, lineHeight: wide ? 41 : 32, letterSpacing: -.6 },
  description: { maxWidth: 420, fontSize: wide ? 15 : 13, lineHeight: wide ? 25 : 21, color: palette.muted, fontFamily: `DMSans_400Regular` },
  sell: { gap: 8, minHeight: 44, marginTop: 4, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, alignSelf: `flex-start`, alignItems: `center`, flexDirection: `row`, backgroundColor: palette.accent },
  sellText: { color: palette.contrast, fontSize: 13, flexShrink: 1, fontFamily: `DMSans_700Bold` },
  pressed: { opacity: .78 },
});
