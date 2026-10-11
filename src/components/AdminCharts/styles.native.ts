import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 16, minWidth: 0 },
  legend: { gap: 16, flexWrap: `wrap`, flexDirection: `row` },
  legendItem: { gap: 6, flexDirection: `row`, alignItems: `center` },
  dot: { width: 7, height: 7, borderRadius: 7 },
  text: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_400Regular` },
  value: { flexShrink: 1, color: palette.ink, fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  plot: { height: 190, width: `100%` },
  selection: { gap: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  controls: { gap: 6, flexDirection: `row` },
  button: { padding: 7, borderWidth: 1, borderRadius: 6, borderColor: palette.line },
  empty: { padding: 24, alignItems: `center` },
  distribution: { gap: 24, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  ring: { width: 128, height: 128 },
  rows: { gap: 14, flex: 1, minWidth: 160 },
  row: { gap: 7 },
  rowHeading: { gap: 8, flexDirection: `row`, justifyContent: `space-between` },
  track: { height: 6, overflow: `hidden`, borderRadius: 6, backgroundColor: palette.subtle },
  bar: { height: 6, borderRadius: 6 },
});
