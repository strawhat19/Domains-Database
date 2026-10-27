import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  root: { gap: 8, minWidth: 0, flexDirection: `row`, alignItems: `center` },
  avatar: { width: 30, height: 30, borderRadius: 15, overflow: `hidden`, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.subtle },
  photo: { top: 0, left: 0, width: 30, height: 30, position: `absolute`, resizeMode: `cover` },
  initial: { color: palette.accent, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  copy: { gap: 2, flex: 1, minWidth: 0 },
  name: { color: palette.ink, fontSize: 11, lineHeight: 17, fontFamily: `DMSans_600SemiBold` },
  caption: { color: palette.muted, fontSize: 9, lineHeight: 15, fontFamily: `DMSans_400Regular` },
});
