import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  disabled: { opacity: .5 },
  scroll: { flexGrow: 0, minHeight: 0 },
  body: { gap: 18, padding: 22 },
  actions: { gap: 10, flexWrap: `wrap`, flexDirection: `row` },
  secondary: { backgroundColor: palette.input },
  secondaryText: { color: palette.accent },
  note: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  success: { color: palette.success },
  error: { color: palette.danger },
  description: { color: palette.muted, fontSize: 13, lineHeight: 22, fontFamily: `DMSans_400Regular` },
  title: { flex: 1, color: palette.ink, fontSize: 20, lineHeight: 26, fontFamily: `DMSans_700Bold` },
  label: { color: palette.contrast, fontSize: 12, fontFamily: `DMSans_700Bold` },
  heading: { gap: 10, flexDirection: `row`, alignItems: `center` },
  guest: { gap: 12, paddingTop: 18, borderTopWidth: 1, borderTopColor: palette.line },
  close: { width: 44, height: 44, alignItems: `center`, justifyContent: `center` },
  backdrop: { top: 0, left: 0, right: 0, bottom: 0, position: `absolute` },
  overlay: { flex: 1, paddingHorizontal: 20, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.overlay },
  panel: { width: `100%`, maxWidth: 520, borderWidth: 1, borderRadius: 12, overflow: `hidden`, borderColor: palette.line, backgroundColor: palette.paper },
  button: { gap: 8, minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 4, borderColor: palette.accent, backgroundColor: palette.accent, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
});
