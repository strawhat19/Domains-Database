import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  lines: { gap: 12 },
  brand: { minWidth: 0, flexShrink: 1 },
  compactScreen: { paddingVertical: 16 },
  compactCard: { gap: 18, padding: 22 },
  bar: { height: 8, borderRadius: 4, backgroundColor: palette.skeleton },
  longBar: { width: `86%` },
  shortBar: { width: `54%` },
  titleBar: { width: `88%`, height: 15 },
  markerBar: { width: 22, height: 18, borderRadius: 5 },
  actionBar: { width: `18%`, height: 22, borderRadius: 6 },
  headingBar: { width: `38%`, height: 12 },
  preview: { gap: 18, paddingTop: 22, borderTopWidth: 1, borderTopColor: palette.line },
  logo: { width: 214, height: 56, maxWidth: `100%` },
  label: { color: palette.muted, fontSize: 12, lineHeight: 20, letterSpacing: .2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accent },
  dots: { gap: 5, flexDirection: `row`, alignItems: `center` },
  previewCards: { gap: 12, flexDirection: `row` },
  previewHeading: { gap: 20, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  heading: { gap: 18, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  previewCard: { flex: 1, gap: 13, minWidth: 0, padding: 15, borderWidth: 1, borderRadius: 10, borderColor: palette.line, backgroundColor: palette.input },
  screen: { width: `100%`, padding: 24, alignItems: `center`, alignSelf: `center` },
  card: { gap: 22, width: `100%`, maxWidth: 700, padding: 28, borderWidth: 1, borderRadius: 16, borderColor: palette.line, backgroundColor: palette.paper },
});
