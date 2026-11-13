import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  stack: { gap: 8, zIndex: 90, position: `absolute`, pointerEvents: `box-none` },
  toast: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    pointerEvents: `box-none`,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    ...Platform.select<ViewStyle>({
      web: { boxShadow: `0px 4px 12px rgba(0, 0, 0, 0.15)` },
      default: { elevation: 8, shadowColor: `#000`, shadowOpacity: .15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  row: { gap: 8, minWidth: 0, flexDirection: `row`, alignItems: `center`, pointerEvents: `box-none` },
  heading: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18, color: palette.ink, fontFamily: `DMSans_700Bold` },
  percent: { fontSize: 11, color: palette.muted, fontVariant: [`tabular-nums`], fontFamily: `DMSans_600SemiBold` },
  detail: { fontSize: 11, lineHeight: 16, color: palette.danger, fontFamily: `DMSans_500Medium` },
  track: { height: 4, borderRadius: 999, overflow: `hidden`, backgroundColor: palette.subtle, pointerEvents: `none` },
  fill: { height: `100%`, borderRadius: 999 },
  close: { width: 44, minHeight: 44, marginRight: -6, marginVertical: -10, alignItems: `center`, justifyContent: `center` },
});
