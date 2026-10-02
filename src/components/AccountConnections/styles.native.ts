import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  panel: { gap: 22, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  row: { gap: 12, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  title: { flex: 1, minWidth: 150, color: palette.ink, fontSize: 15, fontFamily: `DMSans_700Bold` },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_400Regular` },
  field: { gap: 8 },
  label: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  input: { minHeight: 56, maxHeight: 180, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input, padding: 12, fontSize: 12, color: palette.ink, fontFamily: `monospace` },
  skeleton: { height: 56, borderRadius: 8, backgroundColor: palette.skeleton },
  button: { gap: 8, padding: 12, borderRadius: 6, flexDirection: `row`, alignItems: `center`, borderWidth: 1, borderColor: palette.line },
  primary: { backgroundColor: palette.accent, borderColor: palette.accent },
  primaryText: { color: palette.contrast },
  buttonText: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  note: { gap: 10, flexDirection: `row`, alignItems: `center` },
  noteText: { flex: 1, color: palette.muted, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_400Regular` },
});
