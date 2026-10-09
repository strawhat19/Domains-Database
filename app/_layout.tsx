import { Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { routes } from '../src/shared/routes';
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
  const pathname = usePathname();
  const { ready: themeReady } = useTheme();
  const { user, loading, dataRevision } = useAuth();
  const lastAccount = useRef<string | null>(null);
  const [accountRevision, setAccountRevision] = useState(0);
  const accountScope = loading ? null : user?.id ?? `guest`;
  const enabled = useAfterPaint(!loading && themeReady);
  useEffect(() => {
    if (accountScope === null) return;
    // Keep the initial UI mounted; reset account views only when the actor changes.
    if (lastAccount.current !== null && lastAccount.current !== accountScope) setAccountRevision(current => current + 1);
    lastAccount.current = accountScope;
  }, [accountScope]);
  return (
    <ConnectionAvailabilityProvider enabled={enabled}>
      <DomainProvider
        enabled={enabled}
        key={`${accountRevision}-${dataRevision}`}
        requested={pathname === routes.domains.href}
      >
        <ColumnProvider enabled={enabled} userId={user?.id ?? null}>
          <PortfolioPreferencesProvider enabled={enabled} userId={user?.id ?? null}>
            <WatchingProvider enabled={enabled}>
              <RootContent />
            </WatchingProvider>
          </PortfolioPreferencesProvider>
        </ColumnProvider>
      </DomainProvider>
    </ConnectionAvailabilityProvider>
  );
};

export default RootLayout;
