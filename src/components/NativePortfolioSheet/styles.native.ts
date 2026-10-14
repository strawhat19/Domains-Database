import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../styles/theme/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  host: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  keyboard: { flex: 1 },
  viewport: { flex: 1, justifyContent: `flex-end` },
  sheet: { width: `100%`, overflow: `hidden`, borderWidth: 1, borderColor: palette.line, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: palette.paper },
  gripTarget: { height: 44, flexShrink: 0, alignItems: `center`, justifyContent: `center` },
  grip: { width: 64, height: 4, borderRadius: 2, backgroundColor: palette.muted },
  header: { gap: 12, paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.line, flexDirection: `row`, alignItems: `center` },
  title: { flex: 1, color: palette.ink, fontSize: 22, fontFamily: `DMSans_700Bold` },
  close: { width: 44, height: 44, borderRadius: 8, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.input },
  content: { flex: 1, minHeight: 0 },
});
