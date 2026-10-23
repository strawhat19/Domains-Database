import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { routes } from '../src/shared/routes';
import { Slot, usePathname } from 'expo-router';
import AppShell from '../src/components/AppShell';
import { useAppFonts } from '../src/shared/useAppFonts';
import { useAuth } from '../src/shared/authContext/useAuth';
import { useTheme } from '../src/shared/themeContext/useTheme';
import VercelAnalytics from '../src/components/VercelAnalytics';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAfterPaint } from '../src/shared/common/useAfterPaint';
import { AuthProvider } from '../src/shared/authContext/AuthContext';
import { ThemeProvider } from '../src/shared/themeContext/ThemeContext';
import { WatchingProvider } from '../src/shared/watching/WatchingContext';
import { ColumnProvider } from '../src/shared/columnContext/ColumnContext';
import { DomainProvider } from '../src/shared/domainContext/DomainContext';
import { StarterAccessProvider } from '../src/shared/plans/StarterAccessContext';
import { FeatureFlagsProvider } from '../src/shared/featureFlags/FeatureFlagsContext';
import { ConnectionAvailabilityProvider } from '../src/shared/connections/ConnectionAvailabilityContext';
import { AccountNavigationProvider } from '../src/shared/accountNavigationContext/AccountNavigationContext';
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
        <StarterAccessProvider>
          <FeatureFlagsProvider>
            <ThemeProvider>
              <AccountContent />
            </ThemeProvider>
          </FeatureFlagsProvider>
        </StarterAccessProvider>
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
        requested={[routes.profile.href, routes.domains.href, routes.dashboard.href, routes.adminDomains.href].includes(pathname)}
      >
        <ColumnProvider enabled={enabled} userId={user?.id ?? null}>
          <PortfolioPreferencesProvider enabled={enabled} userId={user?.id ?? null}>
            <WatchingProvider enabled={enabled}>
              <AccountNavigationProvider key={user?.id ?? `guest`}>
                <RootContent />
              </AccountNavigationProvider>
            </WatchingProvider>
          </PortfolioPreferencesProvider>
        </ColumnProvider>
      </DomainProvider>
    </ConnectionAvailabilityProvider>
  );
};

export default RootLayout;
