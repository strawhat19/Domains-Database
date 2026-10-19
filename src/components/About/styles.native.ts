import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { gap: 32, width: `100%`, maxWidth: 1120, paddingTop: 24, paddingBottom: 40, alignSelf: `center` },
  backLink: { gap: 8, minHeight: 44, borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  backText: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_500Medium` },
  hero: { gap: 28 },
  wideHero: { gap: 36, flexDirection: `row`, alignItems: `center` },
  heroCopy: { gap: 16, minWidth: 0 },
  eyebrow: { fontSize: 9, lineHeight: 15, letterSpacing: 1.3, color: palette.accent, fontFamily: `DMSans_700Bold` },
  title: { fontSize: 44, lineHeight: 50, letterSpacing: -1.5, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { fontSize: 14, lineHeight: 24, color: palette.muted, fontFamily: `DMSans_400Regular` },
  artwork: { minWidth: 0, position: `relative` },
  artworkContent: { zIndex: 1, padding: 10 },
  grid: { gap: 20, flexWrap: `wrap`, flexDirection: `row` },
  card: { minWidth: 0, position: `relative` },
  cardBacking: { ...StyleSheet.absoluteFillObject, zIndex: 0, transform: [{ translateX: 6 }, { translateY: 5 }] },
  cardForeground: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  cardContent: { gap: 14, zIndex: 1, padding: 24 },
  cardTop: { gap: 12, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  symbol: { width: 36, height: 36, borderWidth: 1, borderRadius: 4, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.subtle },
  finalSymbol: { backgroundColor: palette.paper },
  number: { fontSize: 11, lineHeight: 16, letterSpacing: 1, color: palette.accent, fontFamily: `DMSans_500Medium` },
  sectionTitle: { fontSize: 20, lineHeight: 27, color: palette.ink, fontFamily: `DMSans_700Bold` },
  paragraph: { fontSize: 13, lineHeight: 23, color: palette.muted, fontFamily: `DMSans_400Regular` },
});
