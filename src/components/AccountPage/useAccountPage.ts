import { useMemo } from 'react';
import { authAPI } from '../../api/auth';
import { Roles } from '../../types/types';
import { createStyles } from './styles.native';
import { useWindowDimensions } from 'react-native';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { firebaseEnabled } from '../../shared/firebase/config';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getDomainStatus, formatCurrency } from '../../shared/domainUtils';
import { useCollectionPage } from '../../shared/firebase/useCollectionPage';

export const useAccountPage = (page: `profile` | `connections` | `dashboard`) => {
  const { user, loading: authLoading } = useAuth();
  const { domains, loaded: domainsLoaded, loading: domainsLoading } = useDomains();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const actor = page === `dashboard` && !authLoading && user?.active && user.role === Roles.Owner ? user.id : ``;
  const userPage = useCollectionPage(actor, authAPI.subscribeUsersPage);
  const users = userPage.records;
  const stats = [
    { id: `accounts`, label: firebaseEnabled && !useLocalStorage ? `Accounts on this page` : `Local accounts on this page`, value: users.length },
    { id: `domains`, label: `Your domains`, value: domainsLoaded ? domains.length : `—` },
    { id: `renewals`, label: `Renewing soon`, value: domainsLoaded ? domains.filter(domain => getDomainStatus(domain) === `Renewing Soon`).length : `—` },
    { id: `cost`, label: `Your annual cost`, value: domainsLoaded ? formatCurrency(domains.reduce((total, domain) => total + domain.renewalPrice, 0)) : `—` },
  ];
  const roles = Object.values(Roles).map(role => ({ role, count: users.filter(account => account.role === role).length })).filter(item => item.count);
  return { user, users, roles, stats, styles, palette, userPage, error: userPage.error, compact: width < 760, loading: userPage.loading || domainsLoading };
};
