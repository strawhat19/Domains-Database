import { useEffect, useRef, useState, useCallback } from 'react';
import { feedbackAPI } from '../../api/feedback';
import { generateID } from '../../shared/common/ids';
import { useAuth } from '../../shared/authContext/useAuth';
import { canManageRoles } from '../../shared/admin/permissions';
import type { SupportThread, SupportMessage } from '../../shared/feedback/types';

const failureMessage = (failure: unknown) => failure instanceof Error ? failure.message : `Conversation Could Not Be Loaded`;
const mergeMessages = (first: SupportMessage[], second: SupportMessage[]) => [...new Map(first.concat(second).map(message => [message.id, message])).values()].sort((first, second) => first.number - second.number);

export const useSupportChat = (thread: SupportThread) => {
  const { user, loading: authLoading } = useAuth();
  const [revision, setRevision] = useState(0);
  const allowed = !authLoading && !!user?.active && (user.id === thread.customerId || canManageRoles(user));
  const identity = `${user?.id ?? ``}:${user?.role ?? ``}:${user?.active}:${thread.id}`;
  const generation = useRef({ identity, value: 0 });
  if (generation.current.identity !== identity) generation.current = { identity, value: generation.current.value + 1 };
  const scope = `${identity}:${generation.current.value}`;
  const request = `${scope}:${revision}`;
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const latestRequest = useRef(request);
  latestRequest.current = request;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [state, setState] = useState({ scope: request, loading: true, error: ``, olderError: ``, records: [] as SupportMessage[], hasMore: false, olderPending: false });
  const [composer, setComposer] = useState(() => ({ scope, body: ``, attemptId: generateID(), pending: false, error: `` }));
  const [readError, setReadError] = useState({ scope, message: `` });
  const active = state.scope === request ? state : { loading: allowed, error: ``, olderError: ``, records: [] as SupportMessage[], hasMore: false, olderPending: false };
  const draft = composer.scope === scope ? composer : { scope, body: ``, attemptId: ``, pending: false, error: `` };
  const operation = useRef(``);
  const records = active.records;

  useEffect(() => { setComposer(current => current.scope === scope ? current : { scope, body: ``, attemptId: generateID(), pending: false, error: `` }); }, [scope]);

  useEffect(() => {
    if (!allowed) return;
    let mounted = true;
    setState({ scope: request, loading: true, error: ``, olderError: ``, records: [], hasMore: false, olderPending: false });
    const stop = feedbackAPI.subscribeMessages(thread.id, messages => {
      if (!mounted || latestRequest.current !== request) return;
      setState(current => ({ scope: request, loading: false, error: ``, olderError: current.scope === request ? current.olderError : ``, records: mergeMessages(current.scope === request ? current.records : [], messages), hasMore: current.scope === request && current.records.length >= 50 ? current.hasMore : messages.length >= 50 && (messages?.[0]?.number ?? 0) > 1, olderPending: current.scope === request && current.olderPending }));
    }, failure => {
      if (mounted && latestRequest.current === request) setState(current => ({ ...current, scope: request, loading: false, records: [], error: failureMessage(failure) }));
    });
    return () => { mounted = false; stop(); };
  }, [request, allowed, thread.id]);

  const markRead = useCallback(async (number: number) => {
    if (!allowed || !number) return;
    try {
      await feedbackAPI.markThreadRead(thread.id, number);
      if (alive.current && latestScope.current === scope) setReadError({ scope, message: `` });
    } catch (failure) {
      if (alive.current && latestScope.current === scope) setReadError({ scope, message: failureMessage(failure) });
    }
  }, [allowed, scope, thread.id]);
  const lastNumber = records?.[records.length - 1]?.number ?? 0;
  useEffect(() => { if (!active.loading && !active.error) void markRead(lastNumber); }, [scope, lastNumber, active.loading, active.error, markRead]);

  const updateBody = (body: string) => {
    if (!allowed || draft.pending) return;
    setComposer({ scope, body, pending: false, error: ``, attemptId: generateID() });
  };
  const send = async () => {
    const body = draft.body.trim();
    if (!allowed || !body || body.length > 5000 || operation.current.startsWith(`${scope}:`) || thread.status === `closed`) return;
    const attemptId = draft.attemptId || generateID();
    const token = `${scope}:${attemptId}`;
    operation.current = token;
    setComposer({ scope, body: draft.body, attemptId, pending: true, error: `` });
    try {
      await feedbackAPI.sendMessage(thread.id, body, attemptId);
      if (alive.current && latestScope.current === scope) setComposer({ scope, body: ``, attemptId: generateID(), pending: false, error: `` });
    } catch (failure) {
      if (alive.current && latestScope.current === scope) setComposer({ scope, body: draft.body, attemptId, pending: false, error: failureMessage(failure) });
    } finally {
      if (operation.current === token) operation.current = ``;
    }
  };
  const loadOlder = async () => {
    const before = records?.[0]?.number;
    if (!allowed || !before || active.olderPending || !active.hasMore) return false;
    setState(current => ({ ...current, olderPending: true, olderError: `` }));
    try {
      const page = await feedbackAPI.getMessagesPage(thread.id, before);
      if (!alive.current || latestRequest.current !== request) return false;
      setState(current => ({ ...current, records: mergeMessages(current.records, page.records), hasMore: page.hasMore, olderError: `` }));
      return page.records.length > 0;
    } catch (failure) {
      if (alive.current && latestRequest.current === request) setState(current => ({ ...current, olderError: failureMessage(failure) }));
      return false;
    } finally {
      if (alive.current && latestRequest.current === request) setState(current => ({ ...current, olderPending: false }));
    }
  };
  return { ...active, user, scope, allowed, records, body: draft.body, pending: draft.pending, sendError: draft.error, readError: readError.scope === scope ? readError.message : ``, updateBody, send, loadOlder, retryRead: () => markRead(lastNumber), refresh: () => setRevision(value => value + 1) };
};
