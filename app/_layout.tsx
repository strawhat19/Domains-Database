import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import { useAuth } from '../src/shared/authContext/useAuth';
import { useTheme } from '../src/shared/themeContext/useTheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/shared/authContext/AuthContext';
import { ThemeProvider } from '../src/shared/themeContext/ThemeContext';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';
import { ColumnProvider } from '../src/shared/columnContext/ColumnContext';
import { WatchingProvider } from '../src/shared/watching/WatchingContext';
import { ConnectionAvailabilityProvider } from '../src/shared/connections/ConnectionAvailabilityContext';
import { PortfolioPreferencesProvider } from '../src/shared/portfolioPreferences/PortfolioPreferencesContext';

const RootContent = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? `light` : `dark`} />
      <AppShell>
        <Slot />
      </AppShell>
    </>
  );
};

const RootLayout = () => {
  useAppFonts();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AccountContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const AccountContent = () => {
  const { user, loading } = useAuth();
  const enabled = !loading;
  const accountKey = loading ? `pending` : user?.id || `guest`;
  return (
    <ConnectionAvailabilityProvider>
      <ColumnProvider key={accountKey} enabled={enabled} userId={user?.id ?? null}>
        <DomainProvider enabled={enabled}>
          <PortfolioPreferencesProvider enabled={enabled} userId={user?.id ?? null}>
            <WatchingProvider key={accountKey} enabled={enabled}>
              <RootContent />
            </WatchingProvider>
          </PortfolioPreferencesProvider>
        </DomainProvider>
      </ColumnProvider>
    </ConnectionAvailabilityProvider>
  );
};

export default RootLayout;
