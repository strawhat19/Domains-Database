import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

export const useAppFonts = () => useFonts({
  DMSans_700Bold,
  DMSans_500Medium,
  DMSans_400Regular,
  DMSans_600SemiBold,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
});
