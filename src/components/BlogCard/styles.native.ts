import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  card: { flex: 1, overflow: `hidden`, borderWidth: 1, borderRadius: 14, borderColor: palette.line, backgroundColor: palette.paper },
  link: { flex: 1 },
  featuredLink: { flexDirection: `row`, alignItems: `stretch` },
  pressed: { opacity: .8 },
  image: { width: `100%`, aspectRatio: 1.6, borderBottomWidth: 1, borderBottomColor: palette.line },
  compactImage: { aspectRatio: 2.4, backgroundColor: `#f5f3e9` },
  featuredImage: { width: `45%`, aspectRatio: undefined, alignSelf: `stretch`, borderBottomWidth: 0, borderRightWidth: 1, borderRightColor: palette.line, backgroundColor: `#f5f3e9` },
  body: { flex: 1, gap: 14, padding: 22 },
  compactBody: { gap: 10, padding: 16 },
  featuredBody: { gap: 12, minWidth: 0, padding: 20 },
  meta: { gap: 10, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  category: { fontSize: 10, letterSpacing: .7, color: palette.accent, textTransform: `uppercase`, fontFamily: `DMSans_700Bold` },
  readingTime: { gap: 5, flexDirection: `row`, alignItems: `center` },
  readingTimeText: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  title: { fontSize: 21, lineHeight: 28, letterSpacing: -.5, color: palette.ink, fontFamily: `DMSans_700Bold` },
  compactTitle: { fontSize: 18, lineHeight: 24 },
  featuredTitle: { fontSize: 24, lineHeight: 31 },
  excerpt: { fontSize: 13, lineHeight: 22, color: palette.muted, fontFamily: `DMSans_400Regular` },
  read: { gap: 6, paddingTop: 4, marginTop: `auto`, flexDirection: `row`, alignItems: `center` },
  readText: { fontSize: 12, color: palette.accent, fontFamily: `DMSans_700Bold` },
});
