import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readPublicProfilePage, type PublicProfileCard } from '../../shared/publicDirectory/readPublicProfilePage';

export type DomainerDirectoryOrder = `az` | `za`;
export type DomainerDirectoryFilter = `all` | `with-bio`;

const initialState = { records: [] as PublicProfileCard[], nextCursor: null as string | null, error: ``, loading: true, loadingMore: false };
const nameOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: `base` });
const normalize = (text: string) => text.normalize(`NFD`).replace(/\p{M}/gu, ``).trim().toLocaleLowerCase();

export const useDomainerDirectory = () => {
  const focused = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState(initialState);
  const [query, setQuery] = useState(``);
  const [settledQuery, setSettledQuery] = useState(``);
  const [filter, setFilter] = useState<DomainerDirectoryFilter>(`all`);
  const [order, setSelectedOrder] = useState<DomainerDirectoryOrder>(`az`);
  const [explicitSort, setExplicitSort] = useState(false);
  const needle = normalize(query);

  const load = useCallback(async (cursor: string | null) => {
    if (!focused.current || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState(current => cursor ? { ...current, error: ``, loadingMore: true } : initialState);
    try {
      const page = await readPublicProfilePage(cursor, controller.signal);
      if (!controller.signal.aborted) setState(current => ({
        records: cursor ? [...new Map([...current.records, ...page.profiles].map(profile => [profile.id, profile])).values()] : page.profiles,
        nextCursor: page.nextCursor, error: ``, loading: false, loadingMore: false,
      }));
    } catch {
      if (!controller.signal.aborted) setState(current => ({ ...current, loading: false, loadingMore: false, error: `Public Profiles Could Not Be Loaded` }));
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, []);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void load(null);
    return () => {
      focused.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, [load]));

  useEffect(() => {
    if (!needle) { setSettledQuery(``); return; }
    const timer = setTimeout(() => setSettledQuery(needle), 250);
    return () => clearTimeout(timer);
  }, [needle]);

  const narrowed = filter !== `all` || explicitSort;
  const scan = narrowed || Boolean(needle && needle === settledQuery);
  const { error, loading, loadingMore, nextCursor, records } = state;
  useEffect(() => {
    if (scan && nextCursor && !loadingMore && !error) void load(nextCursor);
  }, [scan, nextCursor, loadingMore, error, load]);

  const profiles = useMemo(() => records.filter(profile => (filter === `all` || Boolean(profile.description.trim()))
    && (!needle || normalize(profile.name).includes(needle) || normalize(profile.description).includes(needle)))
    .sort((left, right) => (order === `az` ? 1 : -1) * nameOrder.compare(left.name, right.name) || left.id.localeCompare(right.id)), [records, needle, filter, order]);

  return {
    profiles, loading, loadingMore, error, query, setQuery, filter, setFilter, order,
    hasMore: nextCursor !== null,
    searching: Boolean((needle || narrowed) && (loading || nextCursor) && !error),
    retry: () => { void load(nextCursor); },
    loadMore: () => { if (nextCursor) void load(nextCursor); },
    setOrder: (value: DomainerDirectoryOrder) => { setExplicitSort(true); setSelectedOrder(value); },
  };
};
