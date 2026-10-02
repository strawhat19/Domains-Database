import { useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { EMPTY_CONNECTIONS, type ConnectionProvider } from '../../shared/connections/types';

export const useAccountConnections = () => {
  const { user } = useAuth();
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
      setNotice(`Connections Saved`);
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
      setValues({ ...EMPTY_CONNECTIONS });
      setVisible(true);
      setNotice(`Connections Removed`);
    } catch { setError(`Could Not Remove Connections`); }
    finally { setBusy(false); }
  };
  const dismiss = () => { setError(``); setNotice(``); };
  return { busy, error, notice, values, loading, visible, change, save, clear, dismiss, setVisible };
};
