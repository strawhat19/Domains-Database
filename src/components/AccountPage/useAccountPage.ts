import { useMemo } from 'react';
import { Providers } from '../../types/types';
import { createStyles } from './styles.native';
import { useWindowDimensions } from 'react-native';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';
import { firebaseEnabled } from '../../shared/firebase/config';
import { useDomains } from '../../shared/domainContext/useDomains';
import { Globe2, CalendarClock, Wallet } from 'lucide-react-native';
import { getDomainStatus, formatCurrency } from '../../shared/domainUtils';

export const useAccountPage = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const { domains, loaded, error } = useDomains();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const providerLabel = user?.provider === Providers.Google || user?.providerId?.includes(`google`) ? `Google` : user?.provider === Providers.Local ? `Local Demo` : `Email & Password`;
  const stats = [
    { id: `domains`, Icon: Globe2, label: `Your Domains`, value: loaded && !error ? domains.length : `—` },
    { id: `renewals`, Icon: CalendarClock, label: `Renewing Soon`, value: loaded && !error ? domains.filter(domain => getDomainStatus(domain) === `Renewing Soon`).length : `—` },
    { id: `cost`, Icon: Wallet, label: `Annual Renewal`, value: loaded && !error ? formatCurrency(domains.reduce((total, domain) => total + domain.renewalPrice, 0)) : `—` },
  ];
  return {
    user, stats, error, styles, palette, providerLabel,
    compact: width <= 650,
    narrow: width <= 1100,
    titleSize: Math.max(34, Math.min(56, width * .05)),
    connectionMode: firebaseEnabled && !useLocalStorage ? `Firebase Account` : useLocalStorage ? `Local Demo · This Device` : `Connection Needed`,
  };
};
