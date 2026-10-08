import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  panel: { padding: 24, width: `100%`, minWidth: 0, overflow: `hidden`, borderRadius: 6, backgroundColor: palette.strong },
  header: { gap: 12, alignItems: `center`, flexDirection: `row`, justifyContent: `space-between` },
  footer: { gap: 12, alignItems: `center`, flexDirection: `row`, justifyContent: `space-between` },
  stacks: { width: `100%`, maxWidth: 430, marginTop: 20, marginBottom: 22, aspectRatio: 390 / 260, alignSelf: `center` },
  label: { fontSize: 9, lineHeight: 14, letterSpacing: .9, color: `#b6cbd4`, fontFamily: `DMSans_500Medium` },
  caption: { fontSize: 9, lineHeight: 14, letterSpacing: .9, color: `#b6cbd4`, fontFamily: `DMSans_500Medium` },
  symbol: { fontSize: 9, lineHeight: 14, letterSpacing: .9, color: `#56d4cc`, fontFamily: `DMSans_500Medium` },
});
