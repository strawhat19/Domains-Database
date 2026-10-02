import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from '../src/components/AppShell';
import { useTheme } from '../src/shared/themeContext/useTheme';
import { useAppFonts } from '../src/shared/useAppFonts';
import LoadingScreen from '../src/components/LoadingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';
import { ThemeProvider } from '../src/shared/themeContext/ThemeContext';
import { ColumnProvider } from '../src/shared/columnContext/ColumnContext';
import { PortfolioPreferencesProvider } from '../src/shared/portfolioPreferences/PortfolioPreferencesContext';

const RootContent = () => {
  const { isDark } = useTheme();
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = Platform.OS === `web` || fontsLoaded || !!fontError;

  return (
    <>
      <StatusBar style={isDark ? `light` : `dark`} />
      {ready ? (
        <AppShell>
          <Slot />
        </AppShell>
      ) : <LoadingScreen />}
    </>
  );
};

const RootLayout = () => (
  <SafeAreaProvider>
    <ThemeProvider>
      <ColumnProvider>
        <DomainProvider>
          <PortfolioPreferencesProvider>
            <RootContent />
          </PortfolioPreferencesProvider>
        </DomainProvider>
      </ColumnProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

export default RootLayout;
