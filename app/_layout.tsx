import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { routes } from '../src/shared/routes';
import { Slot, usePathname } from 'expo-router';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import { useAuth } from '../src/shared/authContext/useAuth';
import VercelAnalytics from '../src/components/VercelAnalytics';
import { useTheme } from '../src/shared/themeContext/useTheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAfterPaint } from '../src/shared/common/useAfterPaint';
import { AuthProvider } from '../src/shared/authContext/AuthContext';
import { ThemeProvider } from '../src/shared/themeContext/ThemeContext';
import { WatchingProvider } from '../src/shared/watching/WatchingContext';
import { ColumnProvider } from '../src/shared/columnContext/ColumnContext';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';
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
      <VercelAnalytics />
    </SafeAreaProvider>
  );
};

const AccountContent = () => {
  const pathname = usePathname();
  const { ready: themeReady } = useTheme();
  const { user, loading, dataRevision } = useAuth();
  const accountScope = loading ? null : user?.id ?? `guest`;
  const [accountState, setAccountState] = useState({ scope: accountScope, revision: 0 });
  const enabled = useAfterPaint(!loading && themeReady);
  if (accountScope !== null && accountScope !== accountState.scope) {
    // Reset before committing the page so an account change mounts it only once.
    setAccountState({
      scope: accountScope,
      revision: accountState.revision + Number(accountState.scope !== null),
    });
  }
  return (
    <ConnectionAvailabilityProvider enabled={enabled}>
      <DomainProvider
        enabled={enabled}
        key={`${accountState.revision}-${dataRevision}`}
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
