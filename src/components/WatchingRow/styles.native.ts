import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../shared/themeContext/theme';

export const createStyles = (palette: ThemePalette) => StyleSheet.create({
  date: { gap: 3 },
  price: { gap: 3, flex: 1 },
  disabled: { opacity: .45 },
  connections: { gap: 14 },
  actionsCell: { gap: 3 },
  prices: { gap: 16, flexDirection: `row` },
  statusDotWrap: { width: 8, height: 8, alignItems: `center`, justifyContent: `center` },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  identity: { gap: 9, flexDirection: `row`, alignItems: `center` },
  rowStatus: { gap: 4, flexDirection: `row`, alignItems: `center` },
  dates: { gap: 18, flexWrap: `wrap`, flexDirection: `row` },
  domain: { flex: 1, fontSize: 16, color: palette.ink, fontFamily: `DMSans_700Bold` },
  registrar: { fontSize: 12, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  note: { fontSize: 10, lineHeight: 17, color: palette.muted, fontFamily: `DMSans_400Regular` },
  statusText: { fontSize: 10, fontFamily: `DMSans_500Medium` },
  priceLabel: { fontSize: 9, color: palette.muted, fontFamily: `DMSans_500Medium` },
  priceAmount: { fontSize: 14, color: palette.ink, fontFamily: `DMSans_600SemiBold` },
  buyText: { fontSize: 11, color: palette.accent, fontFamily: `DMSans_600SemiBold` },
  removeText: { fontSize: 11, color: palette.danger, fontFamily: `DMSans_500Medium` },
  connectionHeading: { gap: 8, flexWrap: `wrap`, flexDirection: `row`, justifyContent: `space-between` },
  buy: { gap: 5, minHeight: 40, flexDirection: `row`, alignItems: `center`, alignSelf: `flex-start` },
  remove: { gap: 6, minHeight: 40, paddingHorizontal: 8, flexDirection: `row`, alignItems: `center`, alignSelf: `flex-start` },
  connection: { gap: 9, paddingTop: 14, borderTopWidth: 1, borderColor: palette.line },
  card: { gap: 12, padding: 18, borderWidth: 1, borderRadius: 8, borderColor: palette.line, backgroundColor: palette.paper },
});
