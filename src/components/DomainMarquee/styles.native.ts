import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  hidden: { opacity: 0 },
  pressed: { opacity: .65 },
  viewport: { flex: 1, height: 40 },
  trackContainer: { flex: 1, height: 40 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject },
  fade: { top: 0, bottom: 1, position: `absolute` },
  track: { alignItems: `center`, flexDirection: `row` },
  cycle: { gap: 8, paddingRight: 8, alignItems: `center`, flexDirection: `row` },
  label: { fontSize: 11, flexShrink: 0, fontFamily: `DMSans_600SemiBold` },
  navyPill: { borderColor: palette.line, backgroundColor: palette.input },
  tealPill: { borderColor: palette.line, backgroundColor: palette.subtle },
  loading: { gap: 8, flex: 1, overflow: `hidden`, flexDirection: `row`, alignItems: `center` },
  skeleton: { height: 28, flexGrow: 1, borderRadius: 14, backgroundColor: palette.skeleton },
  stackSkeleton: { borderRadius: 4, backgroundColor: `transparent` },
  stackPill: { borderRadius: 4, paddingRight: 16, borderColor: `transparent`, backgroundColor: `transparent` },
  bar: { height: 42, alignSelf: `center`, alignItems: `center`, flexDirection: `row`, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.canvas },
  pill: { gap: 7, minHeight: 28, borderWidth: 1, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12, alignItems: `center`, flexDirection: `row` },
});
