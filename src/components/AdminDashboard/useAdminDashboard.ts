import { adminAPI } from '../../api/admin';
import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import type { AdminSnapshot } from '../../shared/admin/types';
import { canAccessAdmin, type AdminSection } from '../../shared/admin/permissions';

export const useAdminDashboard = (section: AdminSection) => {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const enabled = ![`users`, `features`, `plans`, `events`, `reviews`, `aiChats`, `messages`, `requests`, `feedback`, `notifications`, `formSubmissions`].includes(section) && canAccessAdmin(user, section);
  const scope = JSON.stringify([user?.id, user?.role, user?.active, section, revision]);
  const [state, setState] = useState<{ scope: string; snapshot: AdminSnapshot | null; error: string }>({ scope, snapshot: null, error: `` });
  const current = state.scope === scope ? state : { scope, snapshot: null, error: `` };
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const stop = adminAPI.subscribeAdminSnapshot(snapshot => {
      if (active) setState({ scope, snapshot, error: `` });
    }, failure => {
      if (active) setState({ scope, snapshot: null, error: failure.message });
    });
    return () => { active = false; stop(); };
  }, [enabled, scope]);
  return { user, ...current, loading: enabled && !current.snapshot && !current.error, refresh: () => setRevision(value => value + 1) };
};
