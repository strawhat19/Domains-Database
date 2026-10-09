import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  pressed: { opacity: 0.55 },
  heading: { gap: 8, flexDirection: `row` },
  viewport: { minWidth: 0, overflow: `hidden` },
  track: { flexDirection: `row`, alignItems: `stretch` },
  slide: { gap: 8, minWidth: 0, flexShrink: 0, paddingRight: 1 },
  pagination: { gap: 2, flexDirection: `row`, alignItems: `center` },
  controls: { gap: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  guide: { gap: 6, minWidth: 0, padding: 12, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.input },
  title: { minWidth: 0, flexShrink: 1, fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 17, fontFamily: `DMSans_400Regular` },
  dotButton: { width: 32, height: 32, borderRadius: 6, alignItems: `center`, justifyContent: `center` },
  playback: { width: 32, height: 32, borderRadius: 6, alignItems: `center`, justifyContent: `center` },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  activeDot: { backgroundColor: palette.accent },
});
