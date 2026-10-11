import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { marginTop: 32, minWidth: 0 },
  heading: { gap: 12, marginBottom: 18, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  titleRow: { gap: 10, flexDirection: `row`, alignItems: `center` },
  title: { color: palette.ink, fontSize: 26, fontFamily: `DMSans_700Bold` },
  link: { gap: 6, flexDirection: `row`, alignItems: `center` },
  table: { borderWidth: 1, borderRadius: 12, borderColor: palette.line, backgroundColor: palette.paper, overflow: `hidden` },
  row: { gap: 10, paddingVertical: 15, paddingHorizontal: 18, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, borderBottomWidth: 1, borderBottomColor: palette.line },
  number: { minWidth: 24, padding: 5, borderRadius: 5, color: palette.contrast, backgroundColor: palette.accent, textAlign: `center`, fontSize: 10 },
  identity: { gap: 5, minWidth: 140, flex: 1 },
  name: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  detail: { color: palette.muted, fontSize: 10, lineHeight: 16, fontFamily: `DMSans_400Regular` },
  empty: { padding: 24 },
});
