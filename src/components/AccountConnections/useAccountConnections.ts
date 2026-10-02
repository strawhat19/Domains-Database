import { useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomains } from '../../shared/domainContext/useDomains';
import { EMPTY_CONNECTIONS, type ConnectionProvider } from '../../shared/connections/types';

export const useAccountConnections = () => {
  const { user } = useAuth();
  const { syncing, syncConnections, connectionStatuses, resetConnectionSync } = useDomains();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({ ...EMPTY_CONNECTIONS });
  useEffect(() => {
    let active = true;
    setLoading(true);
    setValues({ ...EMPTY_CONNECTIONS });
    setError(``);
    setNotice(``);
    setVisible(false);
    connectionsAPI.getConnections(user?.id).then(snapshot => {
      if (active) { setValues(snapshot.values); setVisible(Object.values(snapshot.values).every(value => !value)); }
    })
      .catch(() => { if (active) setError(`Could Not Load Connections`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  const change = (provider: ConnectionProvider, value: string) => {
    setError(``);
    setNotice(``);
    setValues(current => ({ ...current, [provider]: value }));
  };
  const save = async () => {
    if (busy || loading || !user) return;
    setBusy(true);
    setError(``);
    setNotice(``);
    try {
      const snapshot = await connectionsAPI.saveConnections(values, user.id);
      setValues(snapshot.values);
      setNotice(`Connections Saved — Checking Domains…`);
      const result = await syncConnections(snapshot);
      setNotice(`Connections Saved — ${result.errors.length ? `Sync Finished With Errors; ` : ``}${result.count} Domain(s) Synced${result.warnings.length ? ` — ${result.warnings.join(`; `)}` : ``}`);
      setError(result.errors.join(`; `));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `Could Not Save Connections`);
    } finally { setBusy(false); }
  };
  const clear = async () => {
    if (busy || loading || !user) return;
    setBusy(true);
    setError(``);
    setNotice(``);
    try {
      await connectionsAPI.clearConnections(user.id);
      resetConnectionSync();
      setValues({ ...EMPTY_CONNECTIONS });
      setVisible(true);
      setNotice(`Connections Removed`);
    } catch { setError(`Could Not Remove Connections`); }
    finally { setBusy(false); }
  };
  const dismiss = () => { setError(``); setNotice(``); };
  return { busy, error, notice, values, loading, visible, syncing, change, save, clear, dismiss, setVisible, connectionStatuses };
};
