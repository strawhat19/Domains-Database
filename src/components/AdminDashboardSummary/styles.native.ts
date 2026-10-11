import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  body: { minWidth: 0 },
  columns: { gap: 18, flexDirection: `row`, flexWrap: `wrap` },
  activityColumn: { flexGrow: 1.6, flexBasis: 280, minWidth: 0 },
  statusColumn: { flexGrow: 1, flexBasis: 220, minWidth: 0 },
  note: { color: palette.muted, fontSize: 10, lineHeight: 15, fontFamily: `DMSans_400Regular` },
  source: { gap: 7, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center` },
  sourceDot: { width: 6, height: 6, borderRadius: 6 },
});
