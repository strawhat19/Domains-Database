import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .55 },
  row: { gap: 10, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center` },
  panel: { gap: 12, padding: 16, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.subtle },
  title: { flex: 1, fontSize: 14, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  copy: { fontSize: 11, lineHeight: 18, color: palette.muted, fontFamily: `DMSans_400Regular` },
  error: { fontSize: 12, lineHeight: 18, color: palette.danger, fontFamily: `DMSans_500Medium` },
  input: { minWidth: 0, minHeight: 150, borderWidth: 1, borderRadius: 6, padding: 12, color: palette.ink, borderColor: palette.line, backgroundColor: palette.input, fontSize: 12, fontFamily: `monospace`, textAlignVertical: `top` },
  buttonText: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  primaryText: { color: palette.contrast },
  primary: { borderColor: palette.accent, backgroundColor: palette.accent },
  button: { gap: 8, minHeight: 40, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: palette.line, flexDirection: `row`, alignItems: `center` },
});
