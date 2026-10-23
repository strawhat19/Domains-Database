import { useAuth } from '../authContext/useAuth';
import { getFirebaseDb } from '../firebase/client';
import { firebaseEnabled } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { hasUnlimitedPlanAccess, hasPaidBillingAccess } from '../accountPlans';
import { readBillingAccess, isConfirmedFreeBilling } from '../planAccess/billing';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

interface StarterAccess {
  error: string;
  owner: boolean;
  allowed: boolean;
  loading: boolean;
  confirmedFree: boolean;
  refresh: () => void;
  domainLimit: number | null;
  plan: `free` | `starter`;
}
export const StarterAccessContext = createContext<StarterAccess | null>(null);
export const StarterAccessProvider = ({ children }: PropsWithChildren) => {
  const { user, busy: authBusy, error: authError, loading: authLoading, loginRevision } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ scope: ``, error: ``, paid: false, loading: true, confirmedFree: false });
  const owner = !authLoading && hasUnlimitedPlanAccess(user);
  const scope = `${user?.id ?? `guest`}:${user?.active}:${user?.role}:${loginRevision}:${revision}`;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (authLoading || owner || !user?.id || !user.active || !firebaseEnabled) return;
    let active = true;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    setState({ scope, error: ``, paid: false, loading: true, confirmedFree: false });
    const timeout = setTimeout(() => { if (active) setState({ scope, paid: false, loading: false, confirmedFree: false, error: `Plan Access Could Not Be Confirmed — Refresh To Try Again` }); }, 20_000);
    const stop = onSnapshot(doc(getFirebaseDb(), `billingUsers`, user.id), { includeMetadataChanges: true }, saved => {
      if (!active || saved.metadata.fromCache || saved.metadata.hasPendingWrites) return;
      clearTimeout(timeout);
      const exists = saved.exists();
      const record = exists ? saved.data() : undefined;
      const billing = readBillingAccess(record);
      if (expiry) clearTimeout(expiry);
      const paid = hasPaidBillingAccess(billing);
      setState({ scope, paid, error: ``, loading: false, confirmedFree: !exists || isConfirmedFreeBilling(record) });
      if (paid && billing.accessUntil) expiry = setTimeout(refresh, Math.min(2_147_483_647, Math.max(1, billing.accessUntil - Date.now() + 1)));
    }, failure => { clearTimeout(timeout); if (active) setState({ scope, paid: false, loading: false, confirmedFree: false, error: failure.message }); });
    return () => { active = false; stop(); clearTimeout(timeout); if (expiry) clearTimeout(expiry); };
  }, [scope, authLoading, owner, user?.id, user?.active, refresh]);
  const needsBilling = !owner && !!user?.id && user.active && firebaseEnabled;
  const current = state.scope === scope;
  const loading = authLoading || (!!needsBilling && (!current || state.loading));
  const error = needsBilling && current ? state.error : ``;
  const allowed = owner || (!!needsBilling && current && !loading && !error && state.paid);
  const confirmedFree = firebaseEnabled && !authLoading && !authBusy && !authError && !owner
    && (!user || (!!needsBilling && current && !loading && !error && !allowed && state.confirmedFree));
  const value = useMemo<StarterAccess>(() => ({ owner, error, allowed, loading, refresh, confirmedFree, plan: allowed ? `starter` : `free`, domainLimit: owner ? null : allowed ? 333 : 33 }), [owner, error, allowed, loading, refresh, confirmedFree]);
  return <StarterAccessContext.Provider value={value}>{children}</StarterAccessContext.Provider>;
};

