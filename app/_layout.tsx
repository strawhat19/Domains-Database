import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import LoadingScreen from '../src/components/LoadingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';

const RootLayout = () => {
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = Platform.OS === `web` || fontsLoaded || !!fontError;

  return (
    <SafeAreaProvider>
      <DomainProvider>
        <StatusBar style={`dark`} />
        {ready ? (
          <AppShell>
            <Slot />
          </AppShell>
        ) : <LoadingScreen />}
      </DomainProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
