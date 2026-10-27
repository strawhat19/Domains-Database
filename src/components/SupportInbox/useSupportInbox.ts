import { useEffect, useRef, useState } from 'react';
import { feedbackAPI } from '../../api/feedback';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManageRoles } from '../../shared/admin/permissions';
import type { SupportThread } from '../../shared/feedback/types';

export const useSupportInbox = () => {
  const { user, loading: authLoading } = useAuth();
  const allowed = !authLoading && canManageRoles(user);
  const identity = `${user?.id ?? ``}:${user?.active}:${user?.role}:${authLoading}`;
  const generation = useRef({ identity, value: 0 });
  if (generation.current.identity !== identity) generation.current = { identity, value: generation.current.value + 1 };
  const [revision, setRevision] = useState(0);
  const scope = `${identity}:${generation.current.value}:${revision}`;
  const [state, setState] = useState({ scope, loading: allowed, error: ``, records: [] as SupportThread[] });
  const [search, setSearch] = useState({ scope, value: `` });
  const [selected, setSelected] = useState<{ scope: string; thread?: SupportThread }>({ scope });
  const current = state.scope === scope ? state : { loading: allowed, error: ``, records: [] as SupportThread[] };
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setState({ scope, loading: true, error: ``, records: [] });
    const stop = feedbackAPI.subscribeThreads(records => { if (active) setState({ scope, loading: false, error: ``, records }); }, failure => { if (active) setState({ scope, loading: false, records: [], error: failure.message }); }, true);
    return () => { active = false; stop(); };
  }, [scope, allowed]);
  const query = search.scope === scope ? search.value : ``;
  const normalized = query.trim().toLowerCase();
  const visible = current.records.filter(record => [record.number, record.customerName, record.customerEmail, record.subject, record.lastMessageText].join(` `).toLowerCase().includes(normalized));
  const selectedThread = selected.scope === scope && allowed ? current.records.find(thread => thread.id === selected.thread?.id) ?? selected.thread : undefined;
  return { ...current, allowed, visible, search: query, selectedThread, setSearch: (value: string) => setSearch({ scope, value }), select: (id: string) => setSelected({ scope, thread: current.records.find(thread => thread.id === id) }), refresh: () => setRevision(value => value + 1) };
};
