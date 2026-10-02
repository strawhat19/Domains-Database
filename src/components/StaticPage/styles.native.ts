import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: { gap: 28, padding: 24, paddingTop: 38 },
  backLink: { gap: 7, alignSelf: `flex-start`, flexDirection: `row`, alignItems: `center` },
  backText: { color: `#6b7978`, fontSize: 12, fontFamily: `DMSans_500Medium` },
  heading: { gap: 14, paddingBottom: 8 },
  eyebrow: { color: `#138b8b`, fontSize: 10, letterSpacing: 2.2, fontFamily: `DMSans_600SemiBold` },
  title: { color: `#133b50`, fontSize: 44, lineHeight: 48, fontFamily: `InstrumentSerif_400Regular` },
  description: { color: `#6b7978`, fontSize: 14, lineHeight: 23, fontFamily: `DMSans_400Regular` },
  sections: { gap: 24 },
  section: { gap: 12, paddingTop: 24, borderTopWidth: 1, borderTopColor: `#e0e4dc` },
  sectionTitle: { color: `#133b50`, fontSize: 18, fontFamily: `DMSans_600SemiBold` },
  sectionBody: { color: `#61716f`, fontSize: 14, lineHeight: 24, fontFamily: `DMSans_400Regular` },
});
