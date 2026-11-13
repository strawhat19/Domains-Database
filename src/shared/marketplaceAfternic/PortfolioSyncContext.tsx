import { Roles } from '../../types/types';
import { useLocalStorage } from '../config';
import type { AfternicListing } from './types';
import { useAuth } from '../authContext/useAuth';
import { AfternicRequestError, requestMarketplaceAfternic } from './client';
import { useBackgroundProgressReporter } from '../backgroundProgress/BackgroundProgressContext';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

const maxPages = 401;
const snapshotLifetime = 60 * 60 * 1_000;
const emptyListings: ReadonlyMap<string, AfternicListing> = new Map();
type Snapshot = { listings: ReadonlyMap<string, AfternicListing>; skipped: number; syncedAt: string | null };
const emptySnapshot: Snapshot = { listings: emptyListings, skipped: 0, syncedAt: null };

const readSnapshot = async (signal: AbortSignal): Promise<Snapshot> => {
  const listings = new Map<string, AfternicListing>();
  let offset = 0;
  let duplicateCount = 0;
  let generationId: string | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await requestMarketplaceAfternic(`snapshot`, { offset, generationId }, signal);
    for (const listing of result.listings) {
      if (listings.has(listing.domain)) duplicateCount += 1;
      listings.set(listing.domain, listing);
    }
    if (result.nextOffset === null) return { listings, skipped: result.skipped + duplicateCount, syncedAt: result.syncedAt };
    if (!result.generationId || result.nextOffset <= offset) break;
    offset = result.nextOffset;
    generationId = result.generationId;
  }
  throw new Error(`Afternic Snapshot Could Not Be Read Completely`);
};

const readLatestSnapshot = async (signal: AbortSignal) => {
  try { return await readSnapshot(signal); }
  catch (failure) {
    if (signal.aborted || !(failure instanceof AfternicRequestError) || failure.status !== 409) throw failure;
    return readSnapshot(signal);
  }
};

const syncPortfolio = async (signal: AbortSignal) => {
  let attemptId: string | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await requestMarketplaceAfternic(`sync`, { attemptId }, signal);
    if (result.done) return;
    attemptId = result.attemptId;
  }
  throw new Error(`Afternic Sync Could Not Be Completed`);
};

type SyncMode = `auto` | `manual` | `connected` | `configured`;
const blankState = { connected: false, syncing: false, error: ``, ...emptySnapshot };
const noSync = async () => {};
const unavailable = { ...blankState, complete: false, sync: noSync, loadConnected: noSync, syncConnected: noSync };
const AfternicPortfolioSyncContext = createContext(unavailable);

export const AfternicPortfolioSyncProvider = ({ preload, requested, children }: PropsWithChildren<{ preload?: boolean; requested: boolean }>) => {
  const { user, loading } = useAuth();
  const enabled = !useLocalStorage && !loading && user?.active === true && !user.anonymous && user.role !== Roles.Guest;
  const report = useBackgroundProgressReporter(`afternic`, `Afternic Listings`);
  const [state, setState] = useState(blankState);
  const snapshot = useRef(emptySnapshot);
  const attempted = useRef(false);
  const confirmed = useRef(false);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => { pending.current?.abort(); pending.current = null; attempted.current = false; report(null); }, [enabled, report]);

  const run = useCallback(async (mode: SyncMode) => {
    if (!enabled || pending.current) return;
    attempted.current = true;
    const controller = new AbortController();
    const { signal } = controller;
    pending.current = controller;
    let verified = mode === `configured` || mode === `connected`;
    let reporting = false;
    setState(current => ({ ...current, syncing: true, error: `` }));
    const apply = (next: Snapshot) => {
      if (signal.aborted) return;
      snapshot.current = next;
      setState(current => ({ ...current, ...next }));
    };
    try {
      if (!verified) {
        const status = await requestMarketplaceAfternic(`status`, {}, signal);
        if (typeof status.configured !== `boolean`) throw new Error(`Afternic Status Could Not Be Confirmed`);
        verified = status.configured;
      }
      if (signal.aborted) return;
      confirmed.current = verified;
      setState(current => ({ ...current, connected: verified }));
      if (!verified) { apply(emptySnapshot); return; }
      if (!snapshot.current.syncedAt) apply(await readLatestSnapshot(signal));
      const lastSync = Date.parse(snapshot.current.syncedAt ?? ``);
      const fresh = lastSync > Date.now() - snapshotLifetime && snapshot.current.skipped === 0;
      if (!signal.aborted && (mode === `manual` || mode === `configured` || !fresh)) {
        reporting = mode === `auto`;
        if (reporting) report({});
        await syncPortfolio(signal);
        const updated = await readLatestSnapshot(signal);
        apply(updated);
        if (reporting && !signal.aborted) report(updated.skipped === 0 ? { done: true } : { error: `Some Afternic Listings Could Not Be Read` });
      }
    } catch (failure) {
      if (signal.aborted) return;
      if (reporting) report({ error: failure instanceof Error ? failure.message : `Afternic Sync Could Not Be Completed` });
      if (failure instanceof AfternicRequestError && [401, 403].includes(failure.status)) {
        confirmed.current = false;
        apply(emptySnapshot);
        setState(current => ({ ...current, connected: false, error: verified ? failure.message : `` }));
      } else {
        const error = failure instanceof Error ? failure.message : `Afternic Sync Could Not Be Completed`;
        setState(current => ({ ...current, error }));
      }
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!signal.aborted) setState(current => ({ ...current, syncing: false }));
    }
  }, [enabled, report]);

  useEffect(() => {
    if ((!requested && !preload) || !enabled) return;
    const lastSync = Date.parse(snapshot.current.syncedAt ?? ``);
    const stale = !Number.isFinite(lastSync) || lastSync <= Date.now() - snapshotLifetime || snapshot.current.skipped > 0;
    if (!attempted.current || (confirmed.current && stale)) void run(`auto`);
  }, [enabled, preload, requested, run]);

  const sync = useCallback(() => run(`manual`), [run]);
  const loadConnected = useCallback(() => confirmed.current ? noSync() : run(`connected`), [run]);
  const syncConnected = useCallback(() => run(`configured`), [run]);
  const value = useMemo(() => enabled ? {
    ...state, sync, loadConnected, syncConnected, complete: !!state.syncedAt && state.skipped === 0,
  } : unavailable, [enabled, loadConnected, state, sync, syncConnected]);
  return <AfternicPortfolioSyncContext.Provider value={value}>{children}</AfternicPortfolioSyncContext.Provider>;
};

export const useAfternicPortfolioSync = (enabled: boolean) => {
  const state = useContext(AfternicPortfolioSyncContext);
  return enabled ? state : unavailable;
};
