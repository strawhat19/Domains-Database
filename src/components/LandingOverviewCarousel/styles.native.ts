import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  carousel: { gap: 13, width: `100%`, minWidth: 0 },
  pagination: { gap: 6, flexWrap: `wrap`, flexDirection: `row` },
  tab: { gap: 6, flexGrow: 1, flexBasis: 88, minHeight: 44, borderWidth: 1, borderRadius: 7, paddingVertical: 8, paddingHorizontal: 10, alignItems: `center`, flexDirection: `row`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  selectedTab: { borderColor: palette.accent, backgroundColor: palette.subtle },
  tabLabel: { fontSize: 10, lineHeight: 15, color: palette.muted, fontFamily: `DMSans_600SemiBold` },
  selectedTabLabel: { color: palette.accent },
  viewport: { borderWidth: 1, borderRadius: 12, overflow: `hidden`, borderColor: palette.line, backgroundColor: palette.input },
  slide: { padding: 10, justifyContent: `center` },
  illustrationFrame: { flex: 1, justifyContent: `center`, backgroundColor: palette.paper, borderRadius: 8, overflow: `hidden` },
  illustration: { ...StyleSheet.absoluteFillObject },
  footer: { gap: 14 },
  wideFooter: { alignItems: `center`, flexDirection: `row` },
  caption: { gap: 5, minWidth: 0, minHeight: 88 },
  wideCaption: { flex: 1 },
  title: { fontSize: 16, lineHeight: 22, color: palette.ink, fontFamily: `DMSans_700Bold` },
  description: { minHeight: 38, fontSize: 11, lineHeight: 19, color: palette.muted, fontFamily: `DMSans_400Regular` },
  controls: { gap: 7, flexDirection: `row`, alignItems: `center`, justifyContent: `flex-end` },
  position: { marginRight: 4, fontSize: 10, lineHeight: 15, color: palette.muted, fontVariant: [`tabular-nums`], fontFamily: `DMSans_500Medium` },
  arrow: { width: 44, height: 44, borderWidth: 1, borderRadius: 7, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  pressed: { opacity: .65 },
});
