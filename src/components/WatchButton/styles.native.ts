import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  button: { gap: 6, minHeight: 34, borderWidth: 1, borderRadius: 7, paddingVertical: 7, paddingHorizontal: 10, flexDirection: `row`, alignItems: `center`, borderColor: palette.line },
  compact: { gap: 4, height: 28, minHeight: 28, maxHeight: 28, paddingVertical: 0, paddingHorizontal: 8 },
  iconOnly: { width: 28, minWidth: 28, paddingHorizontal: 0, justifyContent: `center` },
  watched: { borderColor: palette.accent, backgroundColor: palette.subtle },
  buttonText: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  compactText: { fontSize: 10 },
  disabled: { opacity: .55 },
  overlay: { flex: 1, padding: 24, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.overlay },
  backdrop: { ...StyleSheet.absoluteFillObject },
  dialog: { gap: 16, width: `100%`, maxWidth: 420, padding: 24, borderWidth: 1, borderRadius: 14, borderColor: palette.line, backgroundColor: palette.paper },
  heading: { flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  close: { padding: 5 },
  title: { fontSize: 21, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { fontSize: 12, lineHeight: 21, color: palette.muted, fontFamily: `DMSans_400Regular` },
  actions: { gap: 10, flexWrap: `wrap`, flexDirection: `row` },
  primary: { gap: 7, minHeight: 42, borderRadius: 7, paddingHorizontal: 14, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.accent },
  secondary: { gap: 7, minHeight: 42, borderWidth: 1, borderRadius: 7, paddingHorizontal: 14, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line },
  primaryText: { fontSize: 12, color: palette.contrast, fontFamily: `DMSans_600SemiBold` },
  secondaryText: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
});
