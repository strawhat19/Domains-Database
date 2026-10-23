import { useAuth } from '../authContext/useAuth';
import { getFirebaseDb } from '../firebase/client';
import { firebaseEnabled } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { readBillingAccess } from '../planAccess/billing';
import { hasUnlimitedPlanAccess, hasPaidBillingAccess } from '../accountPlans';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

interface StarterAccess {
  error: string;
  owner: boolean;
  allowed: boolean;
  loading: boolean;
  refresh: () => void;
  domainLimit: number | null;
  plan: `free` | `starter`;
}
export const StarterAccessContext = createContext<StarterAccess | null>(null);
export const StarterAccessProvider = ({ children }: PropsWithChildren) => {
  const { user, loading: authLoading, loginRevision } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ scope: ``, error: ``, paid: false, loading: true });
  const owner = !authLoading && hasUnlimitedPlanAccess(user);
  const scope = `${user?.id ?? `guest`}:${user?.active}:${user?.role}:${loginRevision}:${revision}`;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (authLoading || owner || !user?.id || !user.active || !firebaseEnabled) return;
    let active = true;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    setState({ scope, error: ``, paid: false, loading: true });
    const timeout = setTimeout(() => { if (active) setState({ scope, paid: false, loading: false, error: `Plan Access Could Not Be Confirmed — Refresh To Try Again` }); }, 20_000);
    const stop = onSnapshot(doc(getFirebaseDb(), `billingUsers`, user.id), { includeMetadataChanges: true }, saved => {
      if (!active || saved.metadata.fromCache || saved.metadata.hasPendingWrites) return;
      clearTimeout(timeout);
      const billing = readBillingAccess(saved.exists() ? saved.data() : undefined);
      if (expiry) clearTimeout(expiry);
      const paid = hasPaidBillingAccess(billing);
      setState({ scope, paid, error: ``, loading: false });
      if (paid && billing.accessUntil) expiry = setTimeout(refresh, Math.min(2_147_483_647, Math.max(1, billing.accessUntil - Date.now() + 1)));
    }, failure => { clearTimeout(timeout); if (active) setState({ scope, paid: false, loading: false, error: failure.message }); });
    return () => { active = false; stop(); clearTimeout(timeout); if (expiry) clearTimeout(expiry); };
  }, [scope, authLoading, owner, user?.id, user?.active, refresh]);
  const needsBilling = !owner && !!user?.id && user.active && firebaseEnabled;
  const current = state.scope === scope;
  const loading = authLoading || (!!needsBilling && (!current || state.loading));
  const error = needsBilling && current ? state.error : ``;
  const allowed = owner || (!!needsBilling && current && !loading && !error && state.paid);
  const value = useMemo<StarterAccess>(() => ({ owner, error, allowed, loading, refresh, plan: allowed ? `starter` : `free`, domainLimit: owner ? null : allowed ? 333 : 33 }), [owner, error, allowed, loading, refresh]);
  return <StarterAccessContext.Provider value={value}>{children}</StarterAccessContext.Provider>;
};

