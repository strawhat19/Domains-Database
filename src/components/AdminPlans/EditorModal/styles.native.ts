import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  scroll: { minHeight: 0, flexGrow: 0 },
  content: { minWidth: 0 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, paddingHorizontal: 18, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.overlay },
  panel: { width: `100%`, maxWidth: 760, minHeight: 0, borderRadius: 18, overflow: `hidden`, backgroundColor: palette.paper },
  error: { paddingVertical: 14, paddingHorizontal: 24, color: palette.danger, borderBottomWidth: 1, borderBottomColor: palette.line, fontSize: 11, lineHeight: 19, fontFamily: `DMSans_400Regular` },
});
