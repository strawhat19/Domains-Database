import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomains } from '../../shared/domainContext/useDomains';

export const useAuthFeedback = () => {
  const pathname = usePathname();
  const auth = useAuth();
  const portfolio = useDomains();
  const visible = pathname !== `/signin` && pathname !== `/signup`;
  const newAccount = Boolean(auth.notice && auth.user && auth.newAccountId === auth.user.id);
  const waitingForDomains = newAccount && (!visible || auth.loading || portfolio.loading);
  const showConnections = newAccount && portfolio.loaded && !waitingForDomains && !portfolio.error && !portfolio.domains.length && !auth.error;
  useEffect(() => {
    if (!auth.notice || waitingForDomains) return;
    const timer = setTimeout(auth.clearNotice, showConnections ? 12000 : 4500);
    return () => clearTimeout(timer);
  }, [auth.notice, auth.clearNotice, waitingForDomains, showConnections]);
  return { ...auth, visible, showConnections, message: auth.error || (showConnections ? `You Have No Domains Yet — Add Registrar Connections To Bring Them In` : auth.notice) || `` };
};
