import { useEffect, useRef, useState } from 'react';
import { feedbackAPI } from '../../api/feedback';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManageRoles } from '../../shared/admin/permissions';
import type { FeedbackKind, FeedbackEntry, FeedbackStatus } from '../../shared/feedback/types';

export const useFeedbackEntries = (kind: FeedbackKind) => {
  const { user, loading: authLoading } = useAuth();
  const allowed = !authLoading && canManageRoles(user);
  const identity = `${user?.id ?? ``}:${user?.active}:${user?.role}:${authLoading}:${kind}`;
  const generation = useRef({ identity, value: 0 });
  if (generation.current.identity !== identity) generation.current = { identity, value: generation.current.value + 1 };
  const [revision, setRevision] = useState(0);
  const scope = `${identity}:${generation.current.value}:${revision}`;
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const pending = useRef(``);
  const [state, setState] = useState({ scope, loading: allowed, error: ``, records: [] as FeedbackEntry[] });
  const [filters, setFilters] = useState({ scope, search: ``, status: `all` });
  const [mutation, setMutation] = useState({ scope, pendingId: ``, error: ``, notice: `` });
  const current = state.scope === scope ? state : { loading: allowed, error: ``, records: [] as FeedbackEntry[] };
  const activeFilters = filters.scope === scope ? filters : { search: ``, status: `all` };
  const saving = mutation.scope === scope ? mutation : { pendingId: ``, error: ``, notice: `` };
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setState({ scope, loading: true, error: ``, records: [] });
    const stop = feedbackAPI.subscribeFeedback(kind, records => { if (active) setState({ scope, records, loading: false, error: `` }); }, failure => { if (active) setState({ scope, records: [], loading: false, error: failure.message }); });
    return () => { active = false; stop(); };
  }, [scope, kind, allowed]);
  const query = activeFilters.search.trim().toLowerCase();
  const visible = current.records.filter(record => (activeFilters.status === `all` || record.status === activeFilters.status) && [record.number, record.authorName, record.authorEmail, record.title, record.description, record.mediaUrl].join(` `).toLowerCase().includes(query));
  const updateStatus = async (id: string, status: FeedbackStatus) => {
    const record = current.records.find(record => record.id === id);
    if (!allowed || !record || record.status === status || pending.current.startsWith(`${scope}:`)) return;
    const operation = `${scope}:${id}`;
    pending.current = operation;
    setMutation({ scope, pendingId: id, error: ``, notice: `` });
    try {
      await feedbackAPI.updateFeedbackStatus(id, status);
      if (latestScope.current === scope) setMutation({ scope, pendingId: ``, error: ``, notice: `Feedback Status Updated` });
    } catch (failure) {
      if (latestScope.current === scope) setMutation({ scope, pendingId: ``, error: failure instanceof Error ? failure.message : `Feedback Status Could Not Be Updated`, notice: `` });
    } finally { if (pending.current === operation) pending.current = ``; }
  };
  return { ...current, ...saving, error: current.error, mutationError: saving.error, allowed, visible, search: activeFilters.search, status: activeFilters.status, updateStatus, setSearch: (search: string) => setFilters({ scope, search, status: activeFilters.status }), setStatus: (status: string) => setFilters({ scope, status, search: activeFilters.search }), refresh: () => setRevision(value => value + 1) };
};
