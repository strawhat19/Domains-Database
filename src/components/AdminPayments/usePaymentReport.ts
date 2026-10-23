import { onAuthStateChanged } from 'firebase/auth';
import { useLocalStorage } from '../../shared/config';
import { useAuth } from '../../shared/authContext/useAuth';
import { firebaseEnabled } from '../../shared/firebase/config';
import { getFirebaseAuth } from '../../shared/firebase/client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { canViewPayments } from '../../shared/admin/permissions';
import type { PaymentReport, PaymentReportDays } from '../../shared/payments/types';
import { getPaymentReport, PaymentRequestError } from '../../shared/payments/client';

type ReportState = { scope: string; days: PaymentReportDays; report: PaymentReport | null; loading: boolean; error: PaymentRequestError | null };
export const usePaymentReport = () => {
  const { user, loading: authLoading, loginRevision } = useAuth();
  const connected = firebaseEnabled && !useLocalStorage;
  const [days, setDays] = useState<PaymentReportDays>(7);
  const [revision, setRevision] = useState(0);
  const [firebaseUid, setFirebaseUid] = useState(() => connected ? getFirebaseAuth().currentUser?.uid ?? null : null);
  const [state, setState] = useState<ReportState | null>(null);
  const eligible = canViewPayments(user) && !user?.anonymous && Boolean(user?.id && user?.firebase_uid);
  const sessionMatches = connected && firebaseUid === user?.firebase_uid && getFirebaseAuth().currentUser?.uid === user?.firebase_uid;
  const scope = `${user?.id ?? ``}:${user?.firebase_uid ?? ``}:${user?.active}:${user?.role}:${loginRevision}`;
  const allowed = !authLoading && eligible && sessionMatches;
  const current = useRef({ scope, allowed });
  current.current = { scope, allowed };
  useEffect(() => connected ? onAuthStateChanged(getFirebaseAuth(), identity => setFirebaseUid(identity?.isAnonymous ? null : identity?.uid ?? null)) : undefined, [connected]);
  useEffect(() => {
    if (!allowed || !user?.id || !user.firebase_uid) { setState(null); return; }
    const controller = new AbortController();
    const actor = { userId: user.id, firebaseUid: user.firebase_uid };
    setState(previous => ({ scope, days, error: null, loading: true, report: previous?.scope === scope && previous.days === days ? previous.report : null }));
    getPaymentReport(actor, days, controller.signal).then(report => {
      if (!controller.signal.aborted && current.current.scope === scope && current.current.allowed) setState({ scope, days, report, error: null, loading: false });
    }).catch(failure => {
      if (controller.signal.aborted || current.current.scope !== scope || !current.current.allowed) return;
      const error = failure instanceof PaymentRequestError ? failure : new PaymentRequestError(`payments_unavailable`, `Payment Report Is Unavailable — Try Again`);
      const clear = [`payments_forbidden`, `payments_unauthenticated`, `payments_session_changed`].includes(error.code);
      setState(previous => ({ scope, days, error, loading: false, report: !clear && previous?.scope === scope && previous.days === days ? previous.report : null }));
    });
    return () => controller.abort();
  }, [days, scope, allowed, revision]);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const visible = allowed && state?.scope === scope && state.days === days ? state : null;
  return {
    days, setDays, refresh, allowed,
    report: visible?.report ?? null,
    error: visible?.error ?? null,
    loading: authLoading || (allowed && (!visible || visible.loading)),
    disconnected: !connected,
    forbidden: !authLoading && !eligible,
    sessionPending: !authLoading && eligible && connected && !sessionMatches,
  };
};
