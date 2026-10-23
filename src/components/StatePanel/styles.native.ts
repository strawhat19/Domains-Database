import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { width: `100%`, paddingVertical: 56, paddingHorizontal: 24, alignItems: `center`, justifyContent: `center` },
  inline: { paddingVertical: 36, paddingHorizontal: 20 },
  compact: { paddingVertical: 32, paddingHorizontal: 16 },
  content: { gap: 13, width: `100%`, maxWidth: 580, alignItems: `center` },
  art: { width: 144, height: 108, marginBottom: 7, position: `relative` },
  backTile: { top: 16, left: 27, width: 82, height: 74, position: `absolute`, borderWidth: 1, borderRadius: 18, borderColor: palette.line, transform: [{ rotate: `-12deg` }] },
  tile: { top: 22, left: 38, width: 76, height: 74, position: `absolute`, borderWidth: 1, borderRadius: 18, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.subtle },
  domain: { position: `absolute`, borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 7, borderColor: palette.line, backgroundColor: palette.paper },
  domainFirst: { top: 2, right: 0, transform: [{ rotate: `8deg` }] },
  domainLast: { bottom: 0, left: 0, transform: [{ rotate: `-6deg` }] },
  domainText: { color: palette.muted, fontSize: 10, letterSpacing: .3, fontFamily: `DMSans_600SemiBold` },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, textAlign: `center`, color: palette.ink, fontFamily: `DMSans_700Bold` },
  titleRow: { gap: 9, maxWidth: `100%`, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  title: { flexShrink: 1, fontSize: 34, lineHeight: 41, letterSpacing: -.9, textAlign: `center`, color: palette.ink, fontFamily: `DMSans_700Bold` },
  inlineTitle: { fontSize: 25, lineHeight: 32, letterSpacing: -.5 },
  compactTitle: { fontSize: 28, lineHeight: 35, letterSpacing: -.6 },
  compactInlineTitle: { fontSize: 23, lineHeight: 30 },
  badge: { fontSize: 9, lineHeight: 14, borderWidth: 1, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7, color: palette.ink, borderColor: palette.accent, backgroundColor: palette.subtle, fontFamily: `DMSans_700Bold` },
  description: { maxWidth: 470, fontSize: 14, lineHeight: 23, textAlign: `center`, color: palette.muted, fontFamily: `DMSans_400Regular` },
  inlineDescription: { fontSize: 13, lineHeight: 22 },
  actions: { gap: 10, maxWidth: `100%`, paddingTop: 9, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  compactActions: { width: `100%`, alignItems: `stretch`, flexDirection: `column` },
  detail: { maxWidth: 440, fontSize: 11, lineHeight: 19, textAlign: `center`, color: palette.muted, fontFamily: `DMSans_400Regular` },
});
