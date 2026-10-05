import { api } from '../../api';
import { formatSyncNotice } from './messages';
import { getRegistrarDomains } from './client';
import { useAuth } from '../authContext/useAuth';
import { connectionsAPI } from '../../api/connections';
import { CONNECTIONS_STORAGE_KEY } from '../connections/service';
import { accountStorageKey } from '../authentication/userScope';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccountSyncStatuses, ConnectionSyncResult, ConnectionSyncStatuses } from './types';
import { connectionFields, type ConnectionAccount, type ConnectionSnapshot } from '../connections/types';
import { getSyncPolicy, saveSyncCache, clearSyncCache, isSyncCacheFresh, reserveManualSync, SYNC_POLICY_STORAGE_KEY, type RegistrarSyncPolicy } from './policy';

const emptyStatuses = (): ConnectionSyncStatuses => ({
  godaddy: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  porkbun: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namesilo: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  hostinger: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namecheap: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
});

const aggregateStatuses = (accounts: readonly ConnectionAccount[], statuses: AccountSyncStatuses): ConnectionSyncStatuses => {
  const result = emptyStatuses();
  for (const field of connectionFields) {
    const entries = accounts.filter(account => account.provider === field.id).map(account => statuses[account.id]).filter(Boolean);
    if (!entries.length) continue;
    const count = entries.reduce((total, status) => total + status.count, 0);
    const checking = entries.some(status => status.state === `checking`);
    const errors = entries.filter(status => status.state === `error`);
    const connected = entries.some(status => status.state === `connected`);
    result[field.id] = {
      count,
      checkedAt: entries.map(status => status.checkedAt).sort().at(-1) ?? ``,
      discoveredDomains: entries.flatMap(status => status.discoveredDomains ?? []),
      state: checking ? `checking` : errors.length ? `error` : connected ? `connected` : `idle`,
      message: checking ? `Checking Connection(s)…` : errors.length ? errors.map(status => status.message).join(`\n`)
        : connected ? formatSyncNotice({ count }) : `Not Connected`,
    };
  }
  return result;
};

export const useRegistrarSync = (refreshDomains: () => Promise<void>, enabled = true) => {
  const { user, loginRevision } = useAuth();
  const userId = user?.id;
  const active = useRef(false);
  if (!enabled) active.current = false;
  const revision = useRef(0);
  const owner = useRef(user?.name ?? ``);
  const controllers = useRef<AbortController[]>([]);
  const syncingRef = useRef(false);
  const manualRequest = useRef<symbol | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [manualPending, setManualPending] = useState(false);
  const [manualNotice, setManualNotice] = useState(``);
  const [canSyncManually, setCanSyncManually] = useState(false);
  const [syncError, setSyncError] = useState(``);
  const [syncNotice, setSyncNotice] = useState(``);
  const [connectionStatuses, setConnectionStatuses] = useState(emptyStatuses);
  const [accountStatuses, setAccountStatuses] = useState<AccountSyncStatuses>({});
  owner.current = user?.name ?? ``;

  const cancelRequests = useCallback(() => {
    revision.current += 1;
    controllers.current.forEach(controller => controller.abort());
    controllers.current = [];
  }, []);

  const resetSyncState = useCallback(() => {
    cancelRequests();
    syncingRef.current = false;
    manualRequest.current = null;
    setSyncing(false);
    setCooldownUntil(0);
    setManualPending(false);
    setCanSyncManually(false);
    setManualNotice(``);
    setSyncError(``);
    setSyncNotice(``);
    setConnectionStatuses(emptyStatuses());
    setAccountStatuses({});
  }, [cancelRequests]);
  const resetConnectionSync = useCallback(() => {
    resetSyncState();
    const run = revision.current;
    if (enabled && userId) void clearSyncCache(userId).catch(failure => {
      if (active.current && revision.current === run) setSyncError(failure instanceof Error ? failure.message : `Could Not Reset Sync History`);
    });
  }, [enabled, userId, resetSyncState]);
  const clearSyncNotice = useCallback(() => setSyncNotice(``), []);
  const applyPolicy = useCallback((policy: RegistrarSyncPolicy, snapshot: ConnectionSnapshot) => {
    setClock(Date.now());
    setCooldownUntil(policy.manualCooldownUntil);
    setCanSyncManually(policy.connectionsUpdated === snapshot.updated
      && policy.successfulProviders.some(provider => Boolean(snapshot.values[provider]?.trim())));
  }, []);

  const runSync = useCallback(async (saved?: ConnectionSnapshot, automatic = false, connectionIds?: readonly string[]): Promise<ConnectionSyncResult> => {
    cancelRequests();
    const run = revision.current;
    const current = () => active.current && revision.current === run;
    const empty = { count: 0, errors: [], warnings: [] };
    if (!enabled || !userId || !current()) {
      if (active.current) setSyncing(false);
      return empty;
    }
    syncingRef.current = true;
    setSyncError(``);
    setSyncNotice(``);
    try {
      const [snapshot, policy] = await Promise.all([
        saved ? Promise.resolve(saved) : connectionsAPI.getConnections(userId),
        getSyncPolicy(userId),
      ]);
      if (!current()) return empty;
      if (snapshot.userId !== userId) throw new Error(`Sign In To Sync Your Domains`);
      applyPolicy(policy, snapshot);
      if (automatic && isSyncCacheFresh(policy, snapshot.updated)
        && snapshot.accounts.every(account => {
          const status = policy.accountStatuses?.[account.id];
          return status && ![`idle`, `checking`].includes(status.state);
        })) {
        setConnectionStatuses(policy.statuses);
        setAccountStatuses(policy.accountStatuses ?? {});
        return empty;
      }
      const accounts = snapshot.accounts.filter(account => !connectionIds || connectionIds.includes(account.id));
      setSyncing(Boolean(accounts.length));
      const accountNext: AccountSyncStatuses = Object.fromEntries(snapshot.accounts.flatMap(account => {
        const status = policy.accountStatuses?.[account.id];
        return status ? [[account.id, status]] : [];
      }));
      accounts.forEach(account => { accountNext[account.id] = { count: 0, message: `Checking Connection…`, checkedAt: ``, state: `checking` }; });
      const updateStatuses = () => {
        setAccountStatuses({ ...accountNext });
        setConnectionStatuses(aggregateStatuses(snapshot.accounts, accountNext));
      };
      updateStatuses();
      const results: ConnectionSyncResult[] = [];
      for (const account of accounts) {
        const field = connectionFields.find(value => value.id === account.provider)!;
        const label = `${field.label} ${account.number}`;
        const controller = new AbortController();
        controllers.current.push(controller);
        try {
          const result = await getRegistrarDomains(account.provider, account.values, controller.signal);
          if (!current()) return empty;
          const latest = await connectionsAPI.getConnections(userId);
          if (!current()) return empty;
          if (latest.updated !== snapshot.updated || latest.accounts.find(value => value.id === account.id)?.values !== account.values) throw new Error(`Connections Changed — Save Again To Sync`);
          const annotate = (domain: typeof result.domains[number]) => ({
            ...domain, meta: { ...domain.meta, registrarConnectionId: account.id, registrarProvider: account.provider },
          });
          const count = await api.syncRegistrarDomains(result.domains.map(annotate), userId, owner.current);
          if (!current()) return empty;
          await refreshDomains();
          if (!current()) return empty;
          const warnings = result.warnings?.map(message => `${label}: ${message}`) ?? [];
          accountNext[account.id] = {
            count,
            state: `connected`,
            checkedAt: new Date().toISOString(),
            discoveredDomains: result.discoveredDomains?.map(annotate),
            message: formatSyncNotice({ count, warnings }),
          };
          updateStatuses();
          results.push({ count, warnings, errors: [] });
        } catch (failure) {
          if (!current()) return empty;
          const message = failure instanceof Error ? failure.message : `Could Not Check Connection`;
          accountNext[account.id] = { count: 0, message, state: `error`, checkedAt: new Date().toISOString() };
          updateStatuses();
          results.push({ count: 0, warnings: [], errors: [`${label}: ${message}`] });
        }
      }
      const next = aggregateStatuses(snapshot.accounts, accountNext);
      if (!current()) return empty;
      const count = results.reduce((total, result) => total + result.count, 0);
      const errors = results.flatMap(result => result.errors);
      const warnings = results.flatMap(result => result.warnings);
      const successful = results.some(result => !result.errors.length);
      if (accounts.length) {
        const cached = await saveSyncCache(userId, snapshot.updated, next, successful ? Date.now() : 0, current, accountNext);
        if (!current()) return empty;
        applyPolicy(cached, snapshot);
      }
      setSyncError(errors.join(`\n`));
      if (accounts.length && successful) setSyncNotice(formatSyncNotice({ count, warnings }, errors.length ? `Partial Sync` : ``));
      return { count, errors, warnings };
    } catch (failure) {
      if (!current()) return empty;
      const message = failure instanceof Error ? failure.message : `Could Not Load Connections`;
      setSyncError(message);
      return { count: 0, warnings: [], errors: [message] };
    } finally {
      if (current()) {
        syncingRef.current = false;
        setSyncing(false);
      }
    }
  }, [enabled, userId, applyPolicy, cancelRequests, refreshDomains]);

  const syncManually = useCallback(async () => {
    if (!enabled || !userId || !active.current || !canSyncManually || syncingRef.current || manualRequest.current) return;
    const request = Symbol(`manual-sync`);
    const run = revision.current;
    const current = () => active.current && revision.current === run && manualRequest.current === request;
    manualRequest.current = request;
    setManualPending(true);
    setManualNotice(``);
    try {
      const snapshot = await connectionsAPI.getConnections(userId);
      const policy = await getSyncPolicy(userId);
      if (!current()) return;
      applyPolicy(policy, snapshot);
      if (policy.connectionsUpdated !== snapshot.updated
        || !policy.successfulProviders.some(provider => Boolean(snapshot.values[provider]?.trim()))) {
        setManualNotice(`Save A Successful Registrar Connection Before Syncing`);
        return;
      }
      const reservation = await reserveManualSync(userId);
      if (!current()) return;
      applyPolicy(reservation.policy, snapshot);
      if (!reservation.allowed) return;
      await runSync(snapshot);
    } catch (failure) {
      if (current()) setManualNotice(failure instanceof Error ? failure.message : `Could Not Sync Domains`);
    } finally {
      if (manualRequest.current === request) {
        manualRequest.current = null;
        if (active.current) setManualPending(false);
      }
    }
  }, [enabled, userId, canSyncManually, applyPolicy, runSync]);

  useEffect(() => {
    if (!enabled || !syncNotice) return;
    const timer = setTimeout(clearSyncNotice, 60_000);
    return () => clearTimeout(timer);
  }, [enabled, syncNotice, clearSyncNotice]);

  useEffect(() => {
    if (!enabled || !userId) return;
    let mounted = true;
    let operation = 0;
    const refreshPolicy = async () => {
      const run = revision.current;
      const request = ++operation;
      const current = () => mounted && active.current && operation === request && revision.current === run;
      try {
        const [snapshot, policy] = await Promise.all([connectionsAPI.getConnections(userId), getSyncPolicy(userId)]);
        if (current()) applyPolicy(policy, snapshot);
      } catch (failure) {
        if (!current()) return;
        setCanSyncManually(false);
        setSyncError(failure instanceof Error ? failure.message : `Could Not Load Sync Settings`);
      }
    };
    const unsubscribe = connectionsAPI.subscribeConnections(changedUserId => {
      if (changedUserId === userId) void refreshPolicy();
    });
    const resume = () => { void refreshPolicy(); };
    const policyKey = accountStorageKey(SYNC_POLICY_STORAGE_KEY, userId);
    const connectionKey = accountStorageKey(CONNECTIONS_STORAGE_KEY, userId);
    const storageChanged = (event: StorageEvent) => {
      if (event.key === null || event.key === policyKey || event.key === connectionKey) void refreshPolicy();
    };
    if (typeof window !== `undefined`) {
      window.addEventListener(`focus`, resume);
      window.addEventListener(`storage`, storageChanged);
    }
    return () => {
      mounted = false;
      unsubscribe();
      if (typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resume);
        window.removeEventListener(`storage`, storageChanged);
      }
    };
  }, [enabled, userId, applyPolicy]);

  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= cooldownUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    active.current = enabled;
    if (enabled) void runSync(undefined, true);
    else resetSyncState();
    return () => { active.current = false; cancelRequests(); };
  }, [enabled, loginRevision, runSync, cancelRequests, resetSyncState]);

  const syncConnections = useCallback((snapshot?: ConnectionSnapshot, connectionIds?: readonly string[]) => runSync(snapshot, false, connectionIds), [runSync]);
  const manualSyncWaitSeconds = enabled && canSyncManually ? Math.max(0, Math.ceil((cooldownUntil - clock) / 1000)) : 0;
  const wait = `${Math.floor(manualSyncWaitSeconds / 60)}:${String(manualSyncWaitSeconds % 60).padStart(2, `0`)}`;
  return {
    syncManually,
    canSyncManually: enabled && Boolean(userId) && canSyncManually,
    syncing: enabled && (syncing || manualPending),
    manualSyncWaitSeconds,
    manualSyncMessage: enabled ? manualSyncWaitSeconds
      ? `Manual Sync Limit Reached — Wait ${wait} Before Syncing Again` : manualNotice : ``,
    syncConnections, clearSyncNotice, resetConnectionSync,
    syncError: enabled ? syncError : ``, syncNotice: enabled ? syncNotice : ``,
    accountStatuses: enabled ? accountStatuses : {},
    connectionStatuses: enabled ? connectionStatuses : emptyStatuses(),
  };
};
