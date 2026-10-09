import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  title: { width: `100%`, minWidth: 0, flexShrink: 1 },
  disabled: { opacity: .6 },
  active: { backgroundColor: palette.subtle, borderColor: palette.line },
  invalid: { borderColor: palette.danger },
  actions: { gap: 4, marginTop: 7, flexDirection: `row`, justifyContent: `flex-end` },
  text: { flexShrink: 1, color: palette.ink, fontSize: 25, lineHeight: 32, letterSpacing: -.5, fontFamily: `DMSans_700Bold` },
  action: { width: 36, height: 36, borderWidth: 1, borderRadius: 4, borderColor: palette.line, backgroundColor: palette.paper, alignItems: `center`, justifyContent: `center` },
  input: { minHeight: 42, maxHeight: 106, padding: 4, margin: -5, borderWidth: 1, borderRadius: 5, borderColor: palette.accent, backgroundColor: palette.input, textAlignVertical: `top` },
  trigger: { gap: 8, padding: 4, margin: -5, minHeight: 44, borderWidth: 1, borderRadius: 5, borderColor: `transparent`, flexDirection: `row`, alignItems: `center` },
});
