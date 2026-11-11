import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  pressed: { opacity: .82 },
  compactTabs: { marginTop: 20, marginHorizontal: 20 },
  selectedLabel: { color: palette.contrast },
  selected: { backgroundColor: palette.accent },
  label: { flexShrink: 1, fontSize: 12, color: palette.muted, fontFamily: `DMSans_700Bold` },
  tab: { gap: 6, minHeight: 44, borderRadius: 6, paddingHorizontal: 12, flexDirection: `row`, alignItems: `center` },
  beta: { fontSize: 9, borderWidth: 1, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 6, color: palette.accent, borderColor: palette.line, backgroundColor: palette.subtle, fontFamily: `DMSans_700Bold` },
  tabs: { gap: 4, padding: 3, marginTop: 20, borderWidth: 1, borderRadius: 9, marginBottom: 28, marginHorizontal: 28, flexDirection: `row`, alignSelf: `flex-start`, borderColor: palette.line, backgroundColor: palette.input },
});
