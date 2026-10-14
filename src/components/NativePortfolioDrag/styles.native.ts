import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../styles/theme/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { position: `relative`, minWidth: 0 },
  scrollFrame: { minHeight: 0, minWidth: 0 },
  target: { borderRadius: 10, borderWidth: 1, borderColor: palette.accent, backgroundColor: palette.subtle },
  lifted: { opacity: .25 },
  preview: { top: 0, left: 0, gap: 7, zIndex: 1000, position: `absolute`, padding: 16, borderWidth: 1, borderRadius: 12, borderColor: palette.accent, backgroundColor: palette.paper, shadowColor: `#000000`, shadowOpacity: .2, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 14 },
  previewKind: { color: palette.accent, fontSize: 10, fontFamily: `DMSans_600SemiBold` },
  previewName: { color: palette.ink, fontSize: 16, fontFamily: `DMSans_600SemiBold` },
  insertion: { position: `absolute`, borderRadius: 2, backgroundColor: palette.accent },
});
