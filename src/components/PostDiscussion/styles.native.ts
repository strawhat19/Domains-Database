import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 13, paddingTop: 15, borderTopWidth: 1, borderTopColor: palette.line },
  heading: { gap: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  title: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_700Bold` },
  caption: { color: palette.muted, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_400Regular` },
  error: { color: palette.danger, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_500Medium` },
  comments: { gap: 12 },
  comment: { gap: 9, padding: 12, borderRadius: 8, backgroundColor: palette.input },
  top: { gap: 9, flexDirection: `row`, alignItems: `center` },
  person: { gap: 2, flex: 1 },
  name: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_700Bold` },
  date: { color: palette.muted, fontSize: 10, fontFamily: `DMSans_400Regular` },
  actions: { gap: 8, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center`, justifyContent: `flex-end` },
  button: { gap: 6, minHeight: 34, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.subtle },
  primary: { backgroundColor: palette.accent },
  buttonLabel: { color: palette.accent, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  primaryLabel: { color: palette.contrast },
  deleteLabel: { color: palette.danger },
  disabled: { opacity: .5 },
  composer: { gap: 8 },
  input: { minHeight: 90, padding: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.input, color: palette.ink, fontSize: 12, lineHeight: 20, textAlignVertical: `top`, fontFamily: `DMSans_400Regular` },
  footer: { gap: 8, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center`, justifyContent: `space-between` },
  auth: { gap: 8, flexDirection: `row`, flexWrap: `wrap` },
});
