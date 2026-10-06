import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  hint: { minHeight: 18, maxWidth: `100%`, alignSelf: `flex-start` },
  content: { gap: 6, minHeight: 18, maxWidth: `100%`, alignItems: `center`, flexDirection: `row` },
  example: { gap: 2, width: 114, minWidth: 0, minHeight: 16, flexShrink: 1, alignItems: `center`, flexDirection: `row` },
  label: { fontSize: 11, lineHeight: 16, color: palette.muted, fontFamily: `DMSans_400Regular` },
  domain: { minWidth: 0, flexShrink: 1, fontSize: 11, lineHeight: 16, color: palette.accent, fontFamily: `DMSans_500Medium` },
  caret: { width: 1, height: 11, flexShrink: 0, backgroundColor: palette.accent },
});
