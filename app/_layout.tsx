import { Slot } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import LoadingScreen from '../src/components/LoadingScreen';
import { useAuth } from '../src/shared/authContext/useAuth';
import { useTheme } from '../src/shared/themeContext/useTheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/shared/authContext/AuthContext';
import { ThemeProvider } from '../src/shared/themeContext/ThemeContext';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';
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
      <AuthProvider>
        <AccountContent />
      </AuthProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

const AccountContent = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <ColumnProvider key={user?.id || `guest`} userId={user?.id ?? null}>
      <DomainProvider>
        <PortfolioPreferencesProvider userId={user?.id ?? null}>
          <RootContent />
        </PortfolioPreferencesProvider>
      </DomainProvider>
    </ColumnProvider>
  );
};

export default RootLayout;
