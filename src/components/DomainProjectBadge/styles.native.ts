import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  rowStatus: { gap: 6, flexShrink: 1, flexDirection: `row`, alignItems: `center` },
  statusDotWrap: { width: 14, height: 14, alignItems: `center`, justifyContent: `center` },
  statusText: { flexShrink: 1, color: palette.ink, fontSize: 12, fontFamily: `DMSans_400Regular` },
});
