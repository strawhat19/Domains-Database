import { StyleSheet } from 'react-native';
import { discoveryCarouselSizing } from './sizing';
import { discoveryCardGap } from '../DomainDiscovery/useDiscoveryShelf';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  faded: { opacity: .55 },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  controls: { gap: 6, flexDirection: `row` },
  rows: { gap: discoveryCardGap - discoveryCarouselSizing.padding * 2, minWidth: 0, width: `100%` },
  filterGroup: { gap: 5, flexShrink: 0, flexWrap: `nowrap`, flexDirection: `row`, alignItems: `center` },
  selectedFilter: { borderColor: palette.accent, backgroundColor: palette.subtle },
  filterLabel: { fontSize: 12, fontFamily: `DMSans_600SemiBold` },
  filter: { gap: 6, flexShrink: 0, minHeight: 36, borderWidth: 1, borderRadius: 7, paddingHorizontal: 12, flexDirection: `row`, alignItems: `center`, borderColor: palette.line },
  section: { gap: 10, minWidth: 0, width: `100%` },
  item: { minWidth: 0, flexShrink: 0 },
  frame: { minWidth: 0, width: `100%`, position: `relative` },
  viewport: { minWidth: 0, width: `100%`, flexGrow: 0 },
  heading: { gap: 8, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between` },
  titleGroup: { gap: 7, minWidth: 0, flexShrink: 1, flexDirection: `row`, alignItems: `center` },
  title: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  count: { fontSize: 10, color: palette.muted, fontFamily: `DMSans_400Regular` },
  note: { fontSize: 10, lineHeight: 16, color: palette.muted, fontFamily: `DMSans_400Regular` },
  empty: { minWidth: 0, padding: 14, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
  control: { width: 30, height: 30, borderWidth: 1, borderRadius: 6, alignItems: `center`, justifyContent: `center`, borderColor: palette.line, backgroundColor: palette.paper },
  fade: { top: 0, bottom: 0, position: `absolute`, width: discoveryCarouselSizing.fadeWidth },
  track: { flexWrap: `nowrap`, flexDirection: `row`, paddingVertical: discoveryCarouselSizing.padding },
  cycle: { flexShrink: 0, flexWrap: `nowrap`, flexDirection: `row`, gap: discoveryCarouselSizing.gap, paddingRight: discoveryCarouselSizing.gap },
});
