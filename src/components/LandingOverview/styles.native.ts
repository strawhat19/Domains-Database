import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  section: { width: `100%`, borderTopWidth: 1, paddingVertical: 64, paddingHorizontal: 32, borderTopColor: palette.line, backgroundColor: palette.paper },
  compactSection: { paddingVertical: 44, paddingHorizontal: 20 },
  inner: { width: `100%`, maxWidth: 1200, alignSelf: `center` },
  intro: { gap: 28 },
  wideIntro: { gap: 36, alignItems: `center`, flexDirection: `row` },
  copy: { gap: 13, minWidth: 0, maxWidth: 600 },
  wideCopy: { flex: .35 },
  carousel: { width: `100%`, minWidth: 0 },
  wideCarousel: { flex: .65, width: undefined },
  eyebrow: { fontSize: 9, lineHeight: 15, letterSpacing: 1.3, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  title: { fontSize: 28, lineHeight: 35, letterSpacing: -.7, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { fontSize: 13, lineHeight: 22, color: palette.muted, fontFamily: `DMSans_400Regular` },
  summary: { fontSize: 12, lineHeight: 21, color: palette.ink, fontFamily: `DMSans_500Medium` },
});
