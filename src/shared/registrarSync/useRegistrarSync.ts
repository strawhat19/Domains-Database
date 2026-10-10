import { api } from '../../api';
import { useLocalStorage } from '../config';
import { formatSyncNotice } from './messages';
import { getRegistrarDomains } from './client';
import { firebaseEnabled } from '../firebase/config';
import { useAuth } from '../authContext/useAuth';
import { connectionsAPI } from '../../api/connections';
import { supportsRegistrarSync } from '../connections/inputs';
import { CONNECTIONS_STORAGE_KEY } from '../connections/service';
import { subscribeAccountDataReset } from '../accountData/state';
import { accountStorageKey } from '../authentication/userScope';
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectionFields, type ConnectionAccount, type ConnectionProvider, type ConnectionSnapshot } from '../connections/types';
import type { AccountSyncStatuses, ConnectedSyncRegistrar, ConnectionSyncStatus, ConnectionSyncResult, ConnectionSyncStatuses } from './types';
import { getSyncPolicy, saveSyncCache, clearSyncCache, isSyncCacheFresh, reserveManualSync, subscribeSyncPolicy, SYNC_POLICY_STORAGE_KEY, type RegistrarSyncPolicy } from './policy';

export interface ManualSyncChoice { id: string; label: string }

const emptyStatuses = (): ConnectionSyncStatuses => ({
  vercel: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  godaddy: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  porkbun: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namesilo: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  hostinger: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namecheap: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  squarespace: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
});

const savedOnlyMessage = `Developer OAuth Credentials Saved — Domain Sync Requires Reseller Credentials`;
const savedOnlyStatus = (): ConnectionSyncStatus => ({ count: 0, checkedAt: ``, state: `idle`, message: savedOnlyMessage });
const snapshotAccountStatuses = (snapshot: ConnectionSnapshot, statuses: AccountSyncStatuses = {}): AccountSyncStatuses =>
  Object.fromEntries(snapshot.accounts.flatMap(account => {
    if (!supportsRegistrarSync(account)) return [[account.id, savedOnlyStatus()]];
    const status = statuses[account.id];
    return status ? [[account.id, status]] : [];
  }));
const hasSuccessfulConnection = (policy: RegistrarSyncPolicy, snapshot: ConnectionSnapshot) => policy.successfulProviders.some(provider =>
  snapshot.accounts.some(account => account.provider === provider && supportsRegistrarSync(account) && Boolean(account.values.trim())));
const canResumeSync = (policy: RegistrarSyncPolicy, snapshot: ConnectionSnapshot) => policy.automaticSyncPaused === true
  ? snapshot.accounts.some(account => supportsRegistrarSync(account) && Boolean(account.values.trim()))
  : policy.connectionsUpdated === snapshot.updated && hasSuccessfulConnection(policy, snapshot);
const eligibleSyncAccounts = (snapshot: ConnectionSnapshot) => snapshot.accounts
  .filter(account => supportsRegistrarSync(account) && Boolean(account.values.trim()));

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
        : connected ? formatSyncNotice({ count }) : entries.some(status => status.message === savedOnlyMessage) ? savedOnlyMessage : `Not Connected`,
    };
  }
  return result;
};

export const useRegistrarSync = (refreshDomains: () => Promise<void>, enabled = true) => {
  const { user, loginRevision } = useAuth();
  const userId = user?.id;
  const actorKey = `${userId ?? ``}:${loginRevision}`;
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const active = useRef(false);
  if (!enabled) active.current = false;
  const revision = useRef(0);
  const owner = useRef(user?.name ?? ``);
  const controllers = useRef<AbortController[]>([]);
  const syncingRef = useRef(false);
  const manualRequest = useRef<symbol | null>(null);
  const manualSyncActor = useRef(``);
  const connectionRevision = useRef(0);
  const connectedSyncActor = useRef(``);
  const connectedSyncUpdated = useRef<string | null>(null);
  const manualSyncProvider = useRef<ConnectionProvider | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [manualPending, setManualPending] = useState(false);
  const [manualNotice, setManualNotice] = useState(``);
  const [manualSyncChoices, setManualSyncChoices] = useState<ManualSyncChoice[]>([]);
  const [connectedSyncRegistrars, setConnectedSyncRegistrars] = useState<ConnectedSyncRegistrar[]>([]);
  const [canSyncManually, setCanSyncManually] = useState(false);
  const [syncError, setSyncError] = useState(``);
  const [syncNotice, setSyncNotice] = useState(``);
  const [connectionStatuses, setConnectionStatuses] = useState(emptyStatuses);
  const [accountStatuses, setAccountStatuses] = useState<AccountSyncStatuses>({});
  owner.current = user?.name ?? ``;

  const closeManualSync = useCallback(() => {
    manualSyncActor.current = ``;
    manualSyncProvider.current = undefined;
    setManualSyncChoices([]);
  }, []);

  const clearConnectedSyncRegistrars = useCallback(() => {
    ++connectionRevision.current;
    connectedSyncActor.current = ``;
    connectedSyncUpdated.current = null;
    setConnectedSyncRegistrars([]);
  }, []);

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
    closeManualSync();
    clearConnectedSyncRegistrars();
    setManualNotice(``);
    setSyncError(``);
    setSyncNotice(``);
    setConnectionStatuses(emptyStatuses());
    setAccountStatuses({});
  }, [cancelRequests, closeManualSync, clearConnectedSyncRegistrars]);
  const resetConnectionSync = useCallback(() => {
    resetSyncState();
    const run = revision.current;
    if (enabled && userId) void clearSyncCache(userId).catch(failure => {
      if (active.current && revision.current === run) setSyncError(failure instanceof Error ? failure.message : `Could Not Reset Sync History`);
    });
  }, [enabled, userId, resetSyncState]);
  const clearSyncNotice = useCallback(() => setSyncNotice(``), []);
  const applyPolicy = useCallback((policy: RegistrarSyncPolicy, snapshot: ConnectionSnapshot, restoreStatuses = false, connectionRun = connectionRevision.current) => {
    if (!enabled || !active.current || !userId || currentActor.current !== actorKey || snapshot.userId !== userId || policy.userId !== userId) return;
    if (connectionRun === connectionRevision.current) {
      if (connectedSyncActor.current === actorKey && connectedSyncUpdated.current !== snapshot.updated) closeManualSync();
      connectedSyncActor.current = actorKey;
      connectedSyncUpdated.current = snapshot.updated;
      const providers = new Set(eligibleSyncAccounts(snapshot).map(account => account.provider));
      setConnectedSyncRegistrars(connectionFields.flatMap(field => providers.has(field.id) ? [{ provider: field.id, label: field.label }] : []));
    }
    setClock(Date.now());
    setCooldownUntil(policy.manualCooldownUntil);
    const canSync = canResumeSync(policy, snapshot);
    setCanSyncManually(canSync);
    if (!canSync) closeManualSync();
    if (restoreStatuses && !syncingRef.current) {
      const matching = policy.connectionsUpdated === snapshot.updated;
      const statuses = snapshotAccountStatuses(snapshot, matching ? policy.accountStatuses : {});
      setAccountStatuses(statuses);
      setConnectionStatuses(matching
        ? { ...policy.statuses, squarespace: aggregateStatuses(snapshot.accounts, statuses).squarespace }
        : aggregateStatuses(snapshot.accounts, statuses));
      return;
    }
    if (snapshot.accounts.some(account => !supportsRegistrarSync(account))) {
      setAccountStatuses(previous => snapshotAccountStatuses(snapshot, previous));
      if (!syncingRef.current) setConnectionStatuses(previous => ({
        ...previous,
        squarespace: aggregateStatuses(snapshot.accounts, snapshotAccountStatuses(snapshot, policy.accountStatuses)).squarespace,
      }));
    }
  }, [enabled, userId, actorKey, closeManualSync]);

  const runSync = useCallback(async (saved?: ConnectionSnapshot, automatic = false, connectionIds?: readonly string[]): Promise<ConnectionSyncResult> => {
    cancelRequests();
    const run = revision.current;
    const connectionRun = connectionRevision.current;
    const current = () => active.current && currentActor.current === actorKey && revision.current === run;
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
      applyPolicy(policy, snapshot, false, connectionRun);
      if (automatic && policy.automaticSyncPaused) {
        setConnectionStatuses(emptyStatuses());
        setAccountStatuses({});
        return empty;
      }
      const syncAccounts = snapshot.accounts.filter(supportsRegistrarSync);
      const savedOnlyAccounts = snapshot.accounts.filter(account => !supportsRegistrarSync(account));
      const accountNext = snapshotAccountStatuses(snapshot, policy.accountStatuses);
      if (automatic && isSyncCacheFresh(policy, snapshot.updated)
        && syncAccounts.every(account => {
          const status = policy.accountStatuses?.[account.id];
          return status && ![`idle`, `checking`].includes(status.state);
        })) {
        let includedCount = 0;
        for (const account of syncAccounts.filter(value => value.provider === `hostinger`)) {
          const status = accountNext[account.id];
          if (!status) continue;
          const discovered = status.discoveredDomains ?? [];
          const included = discovered.filter(domain => domain.meta?.externalRegistration === true
            && domain.meta?.hostingProvider === `Hostinger` && domain.meta?.source === `Hostinger Hosting API`);
          if (!included.length) continue;
          const latest = await connectionsAPI.getConnections(userId);
          if (!current()) return empty;
          if (latest.updated !== snapshot.updated || latest.accounts.find(value => value.id === account.id)?.values !== account.values) throw new Error(`Connections Changed — Save Again To Sync`);
          const count = await api.syncRegistrarDomains(included.map(domain => ({
            ...domain,
            meta: { ...domain.meta, automaticallyIncluded: true, registrarProvider: account.provider, registrarConnectionId: account.id },
          })), userId, owner.current);
          if (!current()) return empty;
          includedCount += count;
          const countNext = status.count + count;
          const includedNames = new Set(included.map(domain => domain.name));
          accountNext[account.id] = {
            ...status,
            count: countNext,
            message: formatSyncNotice({ count: countNext }),
            discoveredDomains: discovered.filter(domain => !includedNames.has(domain.name)),
          };
        }
        if (includedCount) {
          await refreshDomains();
          if (!current()) return empty;
        }
        const statuses = includedCount ? aggregateStatuses(snapshot.accounts, accountNext)
          : { ...policy.statuses, squarespace: aggregateStatuses(snapshot.accounts, accountNext).squarespace };
        if (includedCount || savedOnlyAccounts.some(account => {
          const status = policy.accountStatuses?.[account.id];
          return status?.state !== `idle` || status?.message !== savedOnlyMessage || status?.count !== 0;
        })) {
          const cached = await saveSyncCache(userId, snapshot.updated, statuses, 0, current, accountNext);
          if (!current()) return empty;
          applyPolicy(cached, snapshot, false, connectionRun);
        }
        setConnectionStatuses(statuses);
        setAccountStatuses(accountNext);
        return { ...empty, count: includedCount };
      }
      const accounts = syncAccounts.filter(account => !connectionIds || connectionIds.includes(account.id));
      setSyncing(Boolean(accounts.length));
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
      if (accounts.length || savedOnlyAccounts.length) {
        const cached = await saveSyncCache(userId, snapshot.updated, next, successful ? Date.now() : 0, current, accountNext);
        if (!current()) return empty;
        applyPolicy(cached, snapshot, false, connectionRun);
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
  }, [enabled, userId, actorKey, applyPolicy, cancelRequests, refreshDomains]);

  const requestManualSync = useCallback(async (connectionId?: string, provider?: ConnectionProvider, allAccounts = false) => {
    if (currentActor.current !== actorKey) return;
    if (!enabled || !userId || !active.current || !canSyncManually) { closeManualSync(); return; }
    if (syncingRef.current || manualRequest.current) return;
    const request = Symbol(`manual-sync`);
    const run = revision.current;
    const connectionRun = connectionRevision.current;
    const current = () => active.current && currentActor.current === actorKey && connectionRevision.current === connectionRun
      && revision.current === run && manualRequest.current === request;
    manualRequest.current = request;
    setManualNotice(``);
    try {
      const [snapshot, policy] = await Promise.all([connectionsAPI.getConnections(userId), getSyncPolicy(userId)]);
      if (!current()) return;
      if (snapshot.userId !== userId || policy.userId !== userId) throw new Error(`Sign In To Sync Your Domains`);
      applyPolicy(policy, snapshot);
      const accounts = eligibleSyncAccounts(snapshot).filter(account => provider === undefined || account.provider === provider);
      const selected = connectionId === undefined ? accounts?.[0] : accounts.find(account => account.id === connectionId);
      if ((connectionId !== undefined || provider !== undefined || allAccounts) && !selected) {
        closeManualSync();
        setManualNotice(`Registrar Connection Is No Longer Available`);
        return;
      }
      if (!selected || !canResumeSync(policy, snapshot)) {
        closeManualSync();
        setManualNotice(`Save A Successful Registrar Connection Before Syncing`);
        return;
      }
      if (!allAccounts && connectionId === undefined && accounts.length > 1) {
        manualSyncActor.current = actorKey;
        manualSyncProvider.current = provider;
        setManualSyncChoices(accounts.map(account => {
          const providerLabel = connectionFields.find(field => field.id === account.provider)?.label ?? account.provider;
          const duplicate = accounts.some(value => value.provider === account.provider && value.id !== account.id);
          return { id: account.id, label: `${providerLabel}${duplicate ? ` · Account ${account.number}` : ``}` };
        }));
        return;
      }
      setManualPending(true);
      closeManualSync();
      const reservation = await reserveManualSync(userId);
      if (!current()) return;
      applyPolicy(reservation.policy, snapshot);
      if (!reservation.allowed) return;
      await runSync(snapshot, false, allAccounts ? accounts.map(account => account.id) : [selected.id]);
    } catch (failure) {
      if (current()) {
        closeManualSync();
        setManualNotice(failure instanceof Error ? failure.message : `Could Not Sync Domains`);
      }
    } finally {
      if (manualRequest.current === request) {
        manualRequest.current = null;
        if (active.current && currentActor.current === actorKey) setManualPending(false);
      }
    }
  }, [enabled, userId, actorKey, canSyncManually, applyPolicy, closeManualSync, runSync]);

  const syncManually = useCallback((connectionId?: string) => requestManualSync(connectionId,
    connectionId !== undefined && manualSyncActor.current === actorKey ? manualSyncProvider.current : undefined), [actorKey, requestManualSync]);
  const syncAllManually = useCallback(() => requestManualSync(undefined,
    manualSyncActor.current === actorKey ? manualSyncProvider.current : undefined, true), [actorKey, requestManualSync]);
  const syncRegistrarDomains = useCallback((provider: ConnectionProvider) => requestManualSync(undefined, provider), [requestManualSync]);

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
      const connectionRun = connectionRevision.current;
      const current = () => mounted && active.current && currentActor.current === actorKey && connectionRevision.current === connectionRun
        && operation === request && revision.current === run;
      try {
        const [snapshot, policy] = await Promise.all([connectionsAPI.getConnections(userId), getSyncPolicy(userId)]);
        if (current()) applyPolicy(policy, snapshot, true);
      } catch (failure) {
        if (!current()) return;
        setCanSyncManually(false);
        closeManualSync();
        clearConnectedSyncRegistrars();
        setSyncError(failure instanceof Error ? failure.message : `Could Not Load Sync Settings`);
      }
    };
    const fail = (failure: Error) => {
      if (!mounted || !active.current || currentActor.current !== actorKey) return;
      setCanSyncManually(false);
      closeManualSync();
      clearConnectedSyncRegistrars();
      setSyncError(failure.message);
    };
    const unsubscribe = connectionsAPI.subscribeConnections(changedUserId => {
      if (changedUserId !== userId || currentActor.current !== actorKey) return;
      closeManualSync();
      clearConnectedSyncRegistrars();
      void refreshPolicy();
    }, userId, fail);
    const unsubscribePolicy = subscribeSyncPolicy(changedUserId => {
      if (changedUserId === userId) void refreshPolicy();
    }, userId, fail);
    const resume = () => { void refreshPolicy(); };
    const policyKey = accountStorageKey(SYNC_POLICY_STORAGE_KEY, userId);
    const connectionKey = accountStorageKey(CONNECTIONS_STORAGE_KEY, userId);
    const storageChanged = (event: StorageEvent) => {
      if (!mounted || !active.current || currentActor.current !== actorKey) return;
      if (event.key !== null && event.key !== policyKey && event.key !== connectionKey) return;
      if (event.key === null || event.key === connectionKey) {
        closeManualSync();
        clearConnectedSyncRegistrars();
      }
      void refreshPolicy();
    };
    const cloud = firebaseEnabled && !useLocalStorage;
    if (!cloud && typeof window !== `undefined`) {
      window.addEventListener(`focus`, resume);
      window.addEventListener(`storage`, storageChanged);
    }
    return () => {
      mounted = false;
      unsubscribe();
      unsubscribePolicy();
      if (!cloud && typeof window !== `undefined`) {
        window.removeEventListener(`focus`, resume);
        window.removeEventListener(`storage`, storageChanged);
      }
    };
  }, [enabled, userId, actorKey, applyPolicy, closeManualSync, clearConnectedSyncRegistrars]);

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
    manualRequest.current = null;
    setManualPending(false);
    closeManualSync();
    clearConnectedSyncRegistrars();
    active.current = enabled;
    if (enabled) void runSync(undefined, true);
    else resetSyncState();
    return () => { active.current = false; cancelRequests(); };
  }, [enabled, loginRevision, runSync, cancelRequests, closeManualSync, resetSyncState, clearConnectedSyncRegistrars]);

  useEffect(() => subscribeAccountDataReset(changedUserId => {
    if (changedUserId !== userId) return;
    active.current = false;
    resetSyncState();
  }), [userId, resetSyncState]);

  const syncConnections = useCallback((snapshot?: ConnectionSnapshot, connectionIds?: readonly string[]) => runSync(snapshot, false, connectionIds), [runSync]);
  const manualSyncWaitSeconds = enabled && canSyncManually ? Math.max(0, Math.ceil((cooldownUntil - clock) / 1000)) : 0;
  const wait = `${Math.floor(manualSyncWaitSeconds / 60)}:${String(manualSyncWaitSeconds % 60).padStart(2, `0`)}`;
  return {
    syncManually,
    syncAllManually,
    syncRegistrarDomains,
    closeManualSync,
    connectedSyncRegistrars: enabled && userId && connectedSyncActor.current === actorKey ? connectedSyncRegistrars : [],
    manualSyncChoices: enabled && userId && manualSyncActor.current === actorKey ? manualSyncChoices : [],
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
