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
  const { user, loading: authLoading } = useAuth();
  const { domains, loaded: domainsLoaded, loading: domainsLoading } = useDomains();
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [error, setError] = useState(``);
  const [userRecords, setUserRecords] = useState<{ actor: string; users: User[] }>({ actor: ``, users: [] });
  const [loading, setLoading] = useState(page === `dashboard`);
  const actor = !authLoading && user?.active && user.role === Roles.Owner ? user.id : ``;
  const users = userRecords.actor === actor ? userRecords.users : [];
  useEffect(() => {
    setUserRecords({ actor, users: [] });
    setError(``);
    if (page !== `dashboard` || !actor) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const unsubscribe = authAPI.subscribeUsers(records => {
      if (active) { setUserRecords({ actor, users: records }); setError(``); setLoading(false); }
    }, reason => {
      if (active) { setUserRecords({ actor, users: [] }); setError(reason.message); setLoading(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, [page, actor]);
  const stats = [
    { id: `accounts`, label: firebaseEnabled && !useLocalStorage ? `Accounts` : `Local accounts`, value: users.length },
    { id: `domains`, label: `Your domains`, value: domainsLoaded ? domains.length : `—` },
    { id: `renewals`, label: `Renewing soon`, value: domainsLoaded ? domains.filter(domain => getDomainStatus(domain) === `Renewing Soon`).length : `—` },
    { id: `cost`, label: `Your annual cost`, value: domainsLoaded ? formatCurrency(domains.reduce((total, domain) => total + domain.renewalPrice, 0)) : `—` },
  ];
  const roles = Object.values(Roles).map(role => ({ role, count: users.filter(account => account.role === role).length })).filter(item => item.count);
  return { user, users, error, roles, stats, styles, palette, compact: width < 760, loading: loading || domainsLoading };
};
