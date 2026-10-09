import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  field: { gap: 8 },
  disabledInput: { color: palette.muted, backgroundColor: palette.subtle },
  optionText: { flex: 1, gap: 4, minWidth: 0 },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  bio: { minHeight: 96, textAlignVertical: `top` },
  title: { color: palette.ink, fontSize: 15, fontFamily: `DMSans_700Bold` },
  label: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_400Regular` },
  buttonText: { flexShrink: 1, color: palette.contrast, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  panel: { gap: 22, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  option: { gap: 12, padding: 16, borderWidth: 1, borderRadius: 8, borderColor: palette.line, flexDirection: `row`, alignItems: `center` },
  button: { gap: 8, maxWidth: `100%`, padding: 13, borderRadius: 6, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.accent },
  input: { minWidth: 0, minHeight: 44, padding: 12, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input, color: palette.ink, fontSize: 13, fontFamily: `DMSans_400Regular` },
});
