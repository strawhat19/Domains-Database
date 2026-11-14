import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  metadata: { rowGap: 2, columnGap: 8, flexWrap: `wrap`, alignItems: `center`, flexDirection: `row` },
  status: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_500Medium` },
  value: { color: palette.ink, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  dns: { gap: 3, width: `100%`, alignItems: `flex-start` },
  error: { color: palette.danger, fontSize: 11, fontFamily: `DMSans_500Medium` },
  button: { gap: 4, minHeight: 44, flexDirection: `row`, alignItems: `center` },
  buttonText: { color: palette.accent, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
});
