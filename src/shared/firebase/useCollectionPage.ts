import { useEffect, useRef, useState } from 'react';
import type { CollectionPage } from './collection';

type SubscribePage<T> = (onValue: (page: CollectionPage<T>) => void, onError?: (failure: Error) => void, cursor?: number | null) => () => void;
interface PageState<T> extends CollectionPage<T> {
  actor: string;
  error: string;
  loading: boolean;
  request: string;
}

export const useCollectionPage = <T,>(actor: string, subscribe: SubscribePage<T>) => {
  const [paging, setPaging] = useState<{ actor: string; cursors: (number | null)[]; revision: number }>({ actor, cursors: [null], revision: 0 });
  const currentPaging = paging.actor === actor ? paging : { actor, cursors: [null], revision: 0 };
  const cursor = currentPaging.cursors[currentPaging.cursors.length - 1] ?? null;
  const request = JSON.stringify([actor, cursor, currentPaging.revision]);
  const requestRef = useRef(request);
  requestRef.current = request;
  const empty = (): PageState<T> => ({ actor, request, error: ``, records: [], nextCursor: null, loading: !!actor });
  const [state, setState] = useState<PageState<T>>(empty);
  const scoped = state.actor === actor && state.request === request ? state : empty();
  useEffect(() => {
    setPaging(current => current.actor === actor ? current : { actor, cursors: [null], revision: 0 });
  }, [actor]);
  useEffect(() => {
    setState({ actor, request, error: ``, records: [], nextCursor: null, loading: !!actor });
    if (!actor) return;
    let active = true;
    const current = () => active && requestRef.current === request;
    const unsubscribe = subscribe(page => {
      if (current()) setState({ ...page, actor, request, error: ``, loading: false });
    }, failure => {
      if (current()) setState({ actor, request, records: [], nextCursor: null, loading: false, error: failure.message });
    }, cursor);
    return () => { active = false; unsubscribe(); };
  }, [actor, cursor, request, subscribe]);
  const nextPage = () => {
    if (scoped.loading || scoped.nextCursor === null) return;
    setPaging({ ...currentPaging, cursors: [...currentPaging.cursors, scoped.nextCursor] });
  };
  const previousPage = () => {
    if (scoped.loading || currentPaging.cursors.length < 2) return;
    setPaging({ ...currentPaging, cursors: currentPaging.cursors.slice(0, -1) });
  };
  const refresh = () => setPaging({ actor, cursors: [null], revision: currentPaging.revision + 1 });
  return { ...scoped, refresh, nextPage, previousPage, page: currentPaging.cursors.length, hasPrevious: currentPaging.cursors.length > 1, hasNext: scoped.nextCursor !== null };
};
