import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  page: { width: `100%`, maxWidth: 720, padding: 26, paddingVertical: 62, alignSelf: `center` },
  panel: { gap: 16, padding: 30, borderWidth: 1, borderRadius: 18, borderColor: palette.line, backgroundColor: palette.paper },
  mark: { width: 42, height: 42, borderRadius: 12, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.subtle },
  title: { color: palette.ink, fontSize: 39, lineHeight: 45, fontFamily: `InstrumentSerif_400Regular` },
  copy: { color: palette.muted, fontSize: 14, lineHeight: 23, fontFamily: `DMSans_400Regular` },
  actions: { gap: 10, paddingTop: 8, flexDirection: `row`, flexWrap: `wrap` },
  button: { gap: 8, minHeight: 43, paddingHorizontal: 17, borderRadius: 8, alignItems: `center`, flexDirection: `row`, justifyContent: `center`, backgroundColor: palette.accent },
  buttonText: { color: palette.contrast, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  secondary: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  secondaryText: { color: palette.ink },
  disabled: { opacity: 0.5 },
  skeletonTitle: { height: 34, width: `55%`, borderRadius: 7, backgroundColor: palette.skeleton },
  skeletonLine: { height: 16, width: `80%`, borderRadius: 5, backgroundColor: palette.skeleton },
  skeletonAction: { height: 43, width: 115, borderRadius: 8, backgroundColor: palette.skeleton },
});
