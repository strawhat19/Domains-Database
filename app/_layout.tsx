import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import { useAfterPaint } from '../src/shared/common/useAfterPaint';
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
  const dataReady = useAfterPaint();
  return (
    <SafeAreaProvider>
      <AuthProvider enabled={dataReady}>
        <ThemeProvider>
          <AccountContent dataReady={dataReady} />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const AccountContent = ({ dataReady }: { dataReady: boolean }) => {
  const { user, loading } = useAuth();
  const lastAccount = useRef<string | null>(null);
  const [accountRevision, setAccountRevision] = useState(0);
  const accountScope = loading ? null : user?.id ?? `guest`;
  const enabled = useAfterPaint(!loading);
  useEffect(() => {
    if (accountScope === null) return;
    // Keep the initial UI mounted; reset account views only when the actor changes.
    if (lastAccount.current !== null && lastAccount.current !== accountScope) setAccountRevision(current => current + 1);
    lastAccount.current = accountScope;
  }, [accountScope]);
  return (
    <ConnectionAvailabilityProvider enabled={dataReady}>
      <ColumnProvider key={accountRevision} enabled={enabled} userId={user?.id ?? null}>
        <DomainProvider enabled={enabled}>
          <PortfolioPreferencesProvider enabled={enabled} userId={user?.id ?? null}>
            <WatchingProvider enabled={enabled}>
              <RootContent />
            </WatchingProvider>
          </PortfolioPreferencesProvider>
        </DomainProvider>
      </ColumnProvider>
    </ConnectionAvailabilityProvider>
  );
};

export default RootLayout;
