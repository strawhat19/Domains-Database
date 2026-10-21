import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createEngagementStyles = (palette: ThemePalette) => StyleSheet.create({
  hidden: { display: `none` },
  root: { gap: 8, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center`, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
  action: { gap: 6, minHeight: 36, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 7, flexDirection: `row`, alignItems: `center`, backgroundColor: palette.input },
  selected: { backgroundColor: palette.subtle },
  label: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_600SemiBold` },
  selectedLabel: { color: palette.accent },
  error: { color: palette.danger, fontSize: 11, lineHeight: 18, fontFamily: `DMSans_500Medium` },
  disabled: { opacity: .5 },
});
