import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  scroll: { minHeight: 0, flexGrow: 0 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  disabled: { opacity: .5 },
  selectedRole: { backgroundColor: palette.accent },
  selectedRoleLabel: { color: palette.contrast },
  roleLabel: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  label: { color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  description: { color: palette.ink, fontSize: 12, lineHeight: 20, fontFamily: `DMSans_400Regular` },
  note: { color: palette.muted, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  error: { color: palette.danger, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_400Regular` },
  title: { flex: 1, color: palette.ink, fontSize: 18, fontFamily: `DMSans_600SemiBold` },
  content: { gap: 10, padding: 20 },
  roles: { gap: 8, paddingTop: 4 },
  roleOptions: { gap: 3, flexWrap: `wrap`, flexDirection: `row` },
  close: { width: 28, height: 28, alignItems: `center`, justifyContent: `center` },
  heading: { gap: 10, padding: 20, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: `row`, alignItems: `center` },
  overlay: { flex: 1, paddingHorizontal: 18, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.overlay },
  panel: { width: `100%`, maxWidth: 520, minHeight: 0, borderWidth: 1, borderRadius: 12, borderColor: palette.line, overflow: `hidden`, backgroundColor: palette.paper },
  roleOption: { minHeight: 24, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderRadius: 3, borderColor: palette.line, backgroundColor: palette.input, alignItems: `center`, justifyContent: `center` },
});
