import { authAPI } from '../../api/auth';
import { Roles } from '../../types/types';
import { createStyles } from './styles.native';
import { useWindowDimensions } from 'react-native';
import { useLocalStorage } from '../../shared/config';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '../../shared/models/users/User';
import { useAuth } from '../../shared/authContext/useAuth';
import { firebaseEnabled } from '../../shared/firebase/config';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useDomains } from '../../shared/domainContext/useDomains';
import { getDomainStatus, formatCurrency } from '../../shared/domainUtils';

export const useAccountPage = (page: `profile` | `connections` | `dashboard`) => {
  const { user } = useAuth();
  const { domains, loading: domainsLoading } = useDomains();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [error, setError] = useState(``);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(page === `dashboard`);
  useEffect(() => {
    if (page !== `dashboard` || user?.role !== Roles.Owner) return;
    let active = true;
    setLoading(true);
    authAPI.getUsers().then(records => { if (active) setUsers(records); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : `Could Not Load User(s)`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, user?.id, user?.role]);
  const stats = [
    { id: `accounts`, label: firebaseEnabled && !useLocalStorage ? `Accounts` : `Local accounts`, value: users.length },
    { id: `domains`, label: `Your domains`, value: domains.length },
    { id: `renewals`, label: `Renewing soon`, value: domains.filter(domain => getDomainStatus(domain) === `Renewing Soon`).length },
    { id: `cost`, label: `Your annual cost`, value: formatCurrency(domains.reduce((total, domain) => total + domain.renewalPrice, 0)) },
  ];
  const roles = Object.values(Roles).map(role => ({ role, count: users.filter(account => account.role === role).length })).filter(item => item.count);
  return { user, users, error, roles, stats, styles, palette, compact: width < 760, loading: loading || domainsLoading };
};
