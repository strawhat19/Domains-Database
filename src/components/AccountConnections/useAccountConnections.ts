import { useRef, useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { normalizeDomainName } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';
import type { ConnectionSyncResult } from '../../shared/registrarSync/types';
import { EMPTY_CONNECTIONS, type ConnectionProvider } from '../../shared/connections/types';

const externalDomainLine = /^\s*(?:export\s+)?HOSTINGER_EXTERNAL_DOMAINS\s*=/;
const externalDomains = (values: string) => {
  const line = values.split(/\r?\n/).find(value => externalDomainLine.test(value));
  const raw = line?.slice(line.indexOf(`=`) + 1)?.trim() ?? ``;
  const names = raw.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? raw;
  return [...new Set(names.split(`,`).map(name => name.trim().toLowerCase()).filter(Boolean))];
};
const includeExternalDomain = (values: string, name: string) => {
  const names = [...new Set([...externalDomains(values), name])];
  if (names.length > 200) throw new Error(`Hostinger Supports Up To 200 Confirmed External Domains`);
  const lines = values.split(/\r?\n/).filter(line => !externalDomainLine.test(line));
  return [...lines, `HOSTINGER_EXTERNAL_DOMAINS=${names.join(`,`)}`].filter(Boolean).join(`\n`);
};
const syncNotice = (label: string, result: ConnectionSyncResult) =>
  `${label} — ${result.errors.length ? `Sync Finished With Errors; ` : ``}${result.count} Domain(s) Synced${result.warnings.length ? ` — ${result.warnings.join(`; `)}` : ``}`;

export const useAccountConnections = () => {
  const { user, loginRevision } = useAuth();
  const { syncing, syncConnections, connectionStatuses, resetConnectionSync } = useDomains();
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}`;
  const mounted = useRef(true);
  const revision = useRef(0);
  const operationBusy = useRef(false);
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [visible, setVisible] = useState(false);
  const [viewActor, setViewActor] = useState(actorKey);
  const [includingName, setIncludingName] = useState(``);
  const [confirmedNames, setConfirmedNames] = useState<string[]>([]);
  const [values, setValues] = useState({ ...EMPTY_CONNECTIONS });
  const isCurrent = (operation?: number) => mounted.current && currentActor.current === actorKey
    && (operation === undefined || operation === revision.current);
  useEffect(() => {
    mounted.current = true;
    operationBusy.current = false;
    const operation = ++revision.current;
    const userId = user?.id;
    setBusy(false);
    setLoading(true);
    setViewActor(actorKey);
    setValues({ ...EMPTY_CONNECTIONS });
    setConfirmedNames([]);
    setIncludingName(``);
    setError(``);
    setNotice(``);
    setVisible(false);
    if (!userId) setLoading(false);
    else connectionsAPI.getConnections(userId).then(snapshot => {
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      setValues(snapshot.values);
      setConfirmedNames(externalDomains(snapshot.values.hostinger));
      setVisible(Object.values(snapshot.values).every(value => !value));
    }).catch(() => { if (isCurrent(operation)) setError(`Could Not Load Connections`); })
      .finally(() => { if (isCurrent(operation)) setLoading(false); });
    return () => { mounted.current = false; ++revision.current; operationBusy.current = false; };
  }, [actorKey]);
  const beginOperation = () => {
    if (!user?.id || !isCurrent() || operationBusy.current || loading) return;
    operationBusy.current = true;
    const operation = ++revision.current;
    setBusy(true);
    setError(``);
    setNotice(``);
    return { operation, userId: user.id };
  };
  const finishOperation = (operation: number) => {
    if (!isCurrent(operation)) return;
    operationBusy.current = false;
    setIncludingName(``);
    setBusy(false);
  };
  const change = (provider: ConnectionProvider, value: string) => {
    if (!isCurrent() || operationBusy.current) return;
    setError(``);
    setNotice(``);
    setValues(current => ({ ...current, [provider]: value }));
  };
  const save = async () => {
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const snapshot = await connectionsAPI.saveConnections(values, userId);
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      setValues(snapshot.values);
      setConfirmedNames(externalDomains(snapshot.values.hostinger));
      setNotice(`Connections Saved — Checking Domains…`);
      const result = await syncConnections(snapshot);
      if (!isCurrent(operation)) return;
      setNotice(syncNotice(`Connections Saved`, result));
      setError(result.errors.join(`; `));
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Save Connections`);
    } finally { finishOperation(operation); }
  };
  const clear = async () => {
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      await connectionsAPI.clearConnections(userId);
      if (!isCurrent(operation)) return;
      resetConnectionSync();
      setValues({ ...EMPTY_CONNECTIONS });
      setConfirmedNames([]);
      setVisible(true);
      setNotice(`Connections Removed`);
    } catch { if (isCurrent(operation)) setError(`Could Not Remove Connections`); }
    finally { finishOperation(operation); }
  };
  const includeDomain = async (candidateName: string) => {
    if (syncing || !connectionStatuses.hostinger.discoveredDomains?.some(domain => domain.name === candidateName)) return;
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const name = normalizeDomainName(candidateName);
      setIncludingName(name);
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation) || latest.userId !== userId) return;
      if (!latest.values.hostinger) throw new Error(`Save Your Hostinger Connection Before Including Domains`);
      const hostinger = includeExternalDomain(latest.values.hostinger, name);
      const snapshot = await connectionsAPI.saveConnections({ ...latest.values, hostinger }, userId);
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      setConfirmedNames(externalDomains(snapshot.values.hostinger));
      setValues(current => {
        try { return { ...current, hostinger: includeExternalDomain(current.hostinger, name) }; }
        catch { return current; }
      });
      setNotice(`Ownership Confirmed — Checking Domains…`);
      const result = await syncConnections(snapshot);
      if (!isCurrent(operation)) return;
      setNotice(syncNotice(`Ownership Confirmed`, result));
      setError(result.errors.join(`; `));
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Include Domain`);
    } finally { finishOperation(operation); }
  };
  const dismiss = () => { setError(``); setNotice(``); };
  const currentView = viewActor === actorKey;
  const discoveredDomains = currentView ? (connectionStatuses.hostinger.discoveredDomains ?? [])
    .filter(domain => !confirmedNames.includes(domain.name.toLowerCase())) : [];
  return {
    save, clear, change, dismiss, syncing, setVisible, includeDomain, connectionStatuses, discoveredDomains,
    busy: currentView && busy, loading: !currentView || loading, visible: currentView && visible,
    error: currentView ? error : ``, notice: currentView ? notice : ``, includingName: currentView ? includingName : ``,
    values: currentView ? values : { ...EMPTY_CONNECTIONS },
  };
};
