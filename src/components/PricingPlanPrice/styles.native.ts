import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  price: { gap: 7, zIndex: 1, minWidth: 0, marginVertical: 12, flexWrap: `wrap`, flexDirection: `row`, alignItems: `baseline` },
  amount: { fontSize: 44, lineHeight: 52, letterSpacing: -1.3, color: palette.ink, fontFamily: `DMSans_700Bold` },
  currency: { fontSize: 27, letterSpacing: -.7, color: palette.accent, fontFamily: `DMSans_700Bold` },
  literal: { fontSize: 27, letterSpacing: 0 },
  period: { fontSize: 12, lineHeight: 19, letterSpacing: 0, color: palette.muted, fontFamily: `DMSans_400Regular` },
});
