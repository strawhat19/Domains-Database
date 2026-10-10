import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .45 },
  scroll: { minHeight: 0, flexGrow: 0, flexShrink: 1 },
  content: { gap: 12, paddingBottom: 22, paddingHorizontal: 22 },
  choiceLabel: { flexShrink: 1, color: palette.ink, fontSize: 13, fontFamily: `DMSans_600SemiBold` },
  cancelLabel: { color: palette.muted, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  description: { color: palette.muted, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  title: { flex: 1, color: palette.ink, fontSize: 24, letterSpacing: -.5, fontFamily: `DMSans_700Bold` },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 6, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.input },
  header: { gap: 16, padding: 22, flexShrink: 0, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  overlay: { flex: 1, padding: 18, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.overlay },
  cancelButton: { gap: 7, minHeight: 44, paddingHorizontal: 15, borderWidth: 1, borderRadius: 6, borderColor: palette.line, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  footer: { padding: 22, flexShrink: 0, flexDirection: `row`, justifyContent: `flex-end` },
  dialog: { width: `100%`, maxWidth: 520, minHeight: 0, maxHeight: `100%`, flexShrink: 1, borderRadius: 10, overflow: `hidden`, backgroundColor: palette.paper },
  choiceButton: { gap: 10, minHeight: 48, paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderRadius: 6, borderColor: palette.line, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.input },
});
