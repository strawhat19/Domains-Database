import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  pressed: { opacity: .55 },
  disabled: { opacity: .4 },
  root: { gap: 8, minWidth: 0 },
  firstConnector: { left: `50%` },
  lastConnector: { right: `50%` },
  viewport: { minWidth: 0, overflow: `hidden` },
  slide: { minWidth: 0, flexShrink: 0 },
  track: { flexDirection: `row`, alignItems: `stretch` },
  activeDotCore: { backgroundColor: palette.accent },
  activeDot: { borderColor: palette.accent, backgroundColor: palette.subtle },
  dotCore: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.muted },
  controls: { gap: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  connector: { left: 0, right: 0, height: 1, top: `50%`, zIndex: 0, position: `absolute`, backgroundColor: palette.line },
  arrowButton: { width: 32, height: 36, flexShrink: 0, borderRadius: 6, alignItems: `center`, justifyContent: `center` },
  dotButton: { width: 32, height: 36, borderRadius: 6, position: `relative`, alignItems: `center`, justifyContent: `center` },
  pagination: { minWidth: 0, flexShrink: 1, flexWrap: `wrap`, flexDirection: `row`, alignItems: `center`, justifyContent: `center` },
  dot: { width: 12, height: 12, zIndex: 1, borderWidth: 1, borderRadius: 6, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.input },
});
