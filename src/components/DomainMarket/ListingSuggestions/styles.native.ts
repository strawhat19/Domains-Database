import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  section: { gap: 10, minWidth: 0 },
  list: { gap: 10, paddingBottom: 8 },
  pressed: { backgroundColor: palette.subtle },
  heading: { gap: 7, flexDirection: `row`, alignItems: `center` },
  title: { fontSize: 15, color: palette.ink, fontFamily: `DMSans_700Bold` },
  amount: { color: palette.ink, fontFamily: `DMSans_700Bold` },
  estimate: { fontSize: 11, color: palette.muted, fontFamily: `DMSans_400Regular` },
  name: { flexShrink: 1, minWidth: 0, fontSize: 14, color: palette.ink, fontFamily: `DMSans_700Bold` },
  buttonText: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_700Bold` },
  pickText: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_700Bold` },
  card: { width: 218, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
  cardHeading: { paddingRight: 28 },
  cardContent: { gap: 8, minWidth: 0, padding: 12 },
  grid: { gap: 9, flexWrap: `wrap`, flexDirection: `row` },
  disabled: { opacity: .55 },
  sellCard: { width: undefined, flexGrow: 1, flexBasis: 150, minHeight: 90, maxWidth: `100%` },
  sellSelect: { flex: 1, borderRadius: 7 },
  dismiss: { top: 0, right: 0, zIndex: 1, width: 44, height: 44, position: `absolute`, borderRadius: 7, alignItems: `center`, justifyContent: `center` },
  skeleton: { gap: 8, padding: 12, justifyContent: `center` },
  skeletonName: { width: `82%`, height: 13, borderRadius: 4, backgroundColor: palette.skeleton },
  skeletonEstimate: { width: `56%`, height: 10, borderRadius: 4, backgroundColor: palette.skeleton },
  button: { gap: 6, minHeight: 44, borderWidth: 1, borderRadius: 7, paddingHorizontal: 12, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center`, borderColor: palette.line, backgroundColor: palette.paper },
});
