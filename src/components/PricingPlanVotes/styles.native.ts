import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  votes: { gap: 8, flexWrap: `wrap`, flexDirection: `row` },
  disabled: { opacity: .5 },
  selected: { borderColor: palette.accent, backgroundColor: palette.subtle },
  selectedLabel: { color: palette.accent },
  label: { color: palette.muted, fontSize: 11, fontFamily: `DMSans_700Bold` },
  vote: { gap: 7, minHeight: 44, paddingVertical: 9, paddingHorizontal: 11, borderWidth: 1, borderRadius: 5, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.input },
});
