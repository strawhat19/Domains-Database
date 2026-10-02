import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 12 },
  toolbar: { gap: 6, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  tool: { gap: 5, padding: 8, borderRadius: 6, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.input },
  activeTool: { backgroundColor: palette.subtle },
  toolText: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_500Medium` },
  input: { minHeight: 150, padding: 14, borderWidth: 1, borderRadius: 9, borderColor: palette.line, backgroundColor: palette.input, color: palette.ink, fontSize: 14, lineHeight: 23, fontFamily: `DMSans_400Regular`, textAlignVertical: `top` },
  imageRow: { gap: 8, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  imageInput: { flex: 1, minWidth: 180, padding: 10, borderWidth: 1, borderRadius: 6, borderColor: palette.line, backgroundColor: palette.input, color: palette.ink, fontSize: 12, fontFamily: `DMSans_400Regular` },
  helper: { color: palette.muted, fontSize: 10, lineHeight: 17, fontFamily: `DMSans_400Regular` },
  error: { color: palette.danger, fontSize: 11, fontFamily: `DMSans_500Medium` },
  preview: { gap: 12, minHeight: 150, padding: 14, borderWidth: 1, borderRadius: 9, borderColor: palette.line, backgroundColor: palette.input },
  content: { gap: 13 },
  paragraph: { color: palette.ink, fontSize: 14, lineHeight: 24, fontFamily: `DMSans_400Regular` },
  heading: { color: palette.ink, fontSize: 20, lineHeight: 28, fontFamily: `DMSans_700Bold` },
  bold: { fontFamily: `DMSans_700Bold` },
  italic: { fontStyle: `italic` },
  inlineCode: { fontFamily: `monospace`, color: palette.accent, backgroundColor: palette.subtle },
  link: { color: palette.accent, textDecorationLine: `underline` },
  codeBlock: { gap: 8, padding: 16, borderRadius: 8, backgroundColor: palette.canvas },
  language: { color: palette.muted, fontSize: 9, fontFamily: `DMSans_600SemiBold` },
  code: { color: palette.ink, fontSize: 12, lineHeight: 21, fontFamily: `monospace` },
  image: { width: `100%`, height: 240, borderRadius: 9, backgroundColor: palette.subtle },
  imageCaption: { color: palette.muted, fontSize: 10, lineHeight: 18, fontFamily: `DMSans_400Regular` },
});
