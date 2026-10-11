import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 18 },
  rows: { gap: 0 },
  row: { gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.line },
  heading: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  identity: { gap: 4, flex: 1, minWidth: 180 },
  name: { color: palette.ink, fontSize: 13, fontFamily: `DMSans_600SemiBold` },
  detail: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  avatar: { width: 34, height: 34, borderRadius: 34, backgroundColor: palette.subtle, alignItems: `center`, justifyContent: `center` },
  initial: { color: palette.accent, fontSize: 13, fontFamily: `DMSans_700Bold` },
  badge: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 5, backgroundColor: palette.subtle },
  actions: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  input: { padding: 11, borderWidth: 1, borderRadius: 7, borderColor: palette.line, color: palette.ink, backgroundColor: palette.input, fontSize: 12, fontFamily: `DMSans_400Regular` },
  error: { color: palette.danger, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  success: { color: palette.success, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
});
