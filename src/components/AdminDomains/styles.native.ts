import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 18 },
  filters: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  filter: { padding: 8, borderWidth: 1, borderRadius: 6, borderColor: palette.line },
  active: { borderColor: palette.accent, backgroundColor: palette.subtle },
  row: { gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  identity: { gap: 4, flex: 1, minWidth: 180 },
  name: { color: palette.ink, fontSize: 13, fontFamily: `DMSans_600SemiBold` },
  detail: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  expiry: { gap: 3, width: 125 },
  input: { padding: 11, borderWidth: 1, borderRadius: 7, borderColor: palette.line, color: palette.ink, backgroundColor: palette.input, fontSize: 12, fontFamily: `DMSans_400Regular` },
});
