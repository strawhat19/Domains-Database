import { useEffect, useRef, useState } from 'react';
import { marketError } from './useDomainMarket';
import { marketplaceAPI } from '../../api/marketplace';
import { generateID } from '../../shared/common/ids';
import type { MarketplaceMessage, MarketplaceThread } from '../../shared/marketplace/types';

const merge = (current: MarketplaceMessage[], next: MarketplaceMessage[]) => [...new Map([...current, ...next].map(record => [record.id, record])).values()].sort((left, right) => left.number - right.number);
export const useMarketInbox = (accountId: string, initialThread: MarketplaceThread | null) => {
  const [threads, setThreads] = useState(initialThread ? [initialThread] : []);
  const [active, setActive] = useState(initialThread?.id ?? ``);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(Boolean(initialThread?.id));
  const [threadCursor, setThreadCursor] = useState<string | null>(null);
  const [error, setError] = useState(``);
  const [chatError, setChatError] = useState(``);
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(``);
  const [message, setMessage] = useState(``);
  const scope = useRef({ id: active, attempt: `` });
  const readMessage = useRef(``);
  const selected = threads.find(thread => thread.id === active);

  useEffect(() => {
    let alive = true;
    let request = 0;
    const controller = new AbortController();
    const refresh = () => {
      const version = ++request;
      void marketplaceAPI.listThreads(null, controller.signal).then(next => {
        if (!alive || request !== version) return;
        setThreads(current => [...new Map([...next.threads, ...current.filter(item => !next.threads.some(thread => thread.id === item.id))].map(thread => [thread.id, thread])).values()]);
        setThreadCursor(next.nextCursor);
        setLoading(false);
      }, failure => { if (alive && request === version) { setError(marketError(failure)); setLoading(false); } });
    };
    setError(``);
    refresh();
    let stop: (() => void) | undefined;
    try { stop = marketplaceAPI.watchThreads(accountId, refresh, failure => { if (alive) setError(marketError(failure)); }); }
    catch (failure) { if (alive) setError(marketError(failure)); }
    return () => { alive = false; controller.abort(); stop?.(); };
  }, [accountId, revision]);

  useEffect(() => {
    setChatError(``);
    setMessageLoading(!!active);
    if (!active) return;
    let alive = true;
    let stop: (() => void) | undefined;
    const failed = (failure: unknown) => { if (alive) { setMessageLoading(false); setChatError(marketError(failure)); } };
    try {
      stop = marketplaceAPI.watchMessages(active, next => {
        if (alive) { setMessages(current => merge(current, next)); setMessageLoading(false); }
      }, failed);
    } catch (failure) { failed(failure); }
    return () => { alive = false; stop?.(); };
  }, [active, revision]);

  const latest = messages.at(-1);
  useEffect(() => {
    if (!active || !latest || messageLoading || latest.id === readMessage.current) return;
    readMessage.current = latest.id;
    void marketplaceAPI.markThreadRead(active, latest.id).then(() => {
      if (scope.current.id === active) setThreads(current => current.map(thread => thread.id === active ? { ...thread, hasUnread: false } : thread));
    }, failure => {
      if (scope.current.id === active) { readMessage.current = ``; setChatError(marketError(failure)); }
    });
  }, [active, latest, messageLoading]);

  const selectThread = (id: string) => {
    if (id === active) return;
    scope.current = { id, attempt: `` };
    readMessage.current = ``;
    setActive(id);
    setMessage(``);
    setMessages([]);
    setMessageLoading(true);
  };

  const run = async (action: string, operation: () => Promise<void>) => {
    if (pending) return;
    setPending(action);
    setChatError(``);
    try { await operation(); } catch (failure) { if (scope.current.id === active) setChatError(marketError(failure)); }
    finally { setPending(``); }
  };
  const send = () => run(`send`, async () => {
    if (!active || !message.trim()) return;
    const attempt = scope.current.attempt || generateID();
    scope.current = { id: active, attempt };
    const saved = await marketplaceAPI.sendMessage(active, message, attempt);
    if (scope.current.id !== active) return;
    setMessages(current => merge(current, [saved]));
    setMessage(``);
    scope.current.attempt = ``;
  });
  const updateOffer = (action: `accepted` | `declined` | `withdrawn`) => run(action, async () => {
    if (!selected?.offer) return;
    const offer = await marketplaceAPI.updateOffer(selected.offer.id, action);
    setThreads(current => current.map(thread => thread.id === selected.id ? { ...thread, offer } : thread));
  });
  const loadOlder = () => run(`older`, async () => {
    if (!active || !messages[0] || messages[0].number === 1) return;
    const next = await marketplaceAPI.getOlderMessages(active, messages[0].number);
    if (scope.current.id === active) setMessages(current => merge(current, next));
  });
  const loadThreads = () => run(`threads`, async () => {
    if (!threadCursor) return;
    const next = await marketplaceAPI.listThreads(threadCursor);
    setThreads(current => [...new Map([...current, ...next.threads].map(thread => [thread.id, thread])).values()]);
    setThreadCursor(next.nextCursor);
  });
  return { threads, active, selected, messages, message, loading, messageLoading, pending, error, chatError, threadCursor, setActive: selectThread, send, updateOffer, loadOlder, loadThreads,
    reload: () => setRevision(current => current + 1), changeMessage: (text: string) => { scope.current.attempt = ``; setMessage(text); } };
};
