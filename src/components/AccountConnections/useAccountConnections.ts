import { useRef, useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { normalizeDomainName } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';
import { formatSyncNotice } from '../../shared/registrarSync/messages';
import type { ConnectionSyncResult } from '../../shared/registrarSync/types';
import { EMPTY_CONNECTIONS, type ConnectionValues, type ConnectionProvider } from '../../shared/connections/types';

type ConnectionInput = ConnectionProvider | `godaddyAccountId`;
const EMPTY_VISIBILITY: Record<ConnectionInput, boolean> = {
  godaddy: true, porkbun: true, namesilo: true, hostinger: true, namecheap: true, godaddyAccountId: true,
};
const godaddyAccountLine = /^\s*(?:export\s+)?GODADDY_(?:CUSTOMER|SHOPPER)_ID\s*=/;
const withoutGoDaddyAccountId = (values: string) => values.split(/\r?\n/).filter(line => !godaddyAccountLine.test(line)).join(`\n`);
const goDaddyAccountId = (values: string) => {
  const line = values.split(/\r?\n/).find(value => godaddyAccountLine.test(value));
  const raw = line?.slice(line.indexOf(`=`) + 1)?.trim() ?? ``;
  return raw.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? raw;
};
const visibilityForValues = (values: ConnectionValues): Record<ConnectionInput, boolean> => ({
  godaddy: !withoutGoDaddyAccountId(values.godaddy).trim(),
  porkbun: !values.porkbun.trim(),
  namesilo: !values.namesilo.trim(),
  hostinger: !values.hostinger.trim(),
  namecheap: !values.namecheap.trim(),
  godaddyAccountId: !goDaddyAccountId(values.godaddy),
});

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
  formatSyncNotice(result, `${label}${result.errors.length ? ` — Sync Finished With Errors` : ``}`);

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
  const [hasSyncedDomains, setHasSyncedDomains] = useState(false);
  const [visibility, setVisibility] = useState({ ...EMPTY_VISIBILITY });
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
    setHasSyncedDomains(false);
    setVisibility({ ...EMPTY_VISIBILITY });
    if (!userId) setLoading(false);
    else connectionsAPI.getConnections(userId).then(snapshot => {
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      setValues(snapshot.values);
      setConfirmedNames(externalDomains(snapshot.values.hostinger));
      setVisibility(visibilityForValues(snapshot.values));
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
    setHasSyncedDomains(false);
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
    setHasSyncedDomains(false);
    setValues(current => {
      const accountLines = provider === `godaddy` && !value.split(/\r?\n/).some(line => godaddyAccountLine.test(line))
        ? current.godaddy.split(/\r?\n/).filter(line => godaddyAccountLine.test(line)) : [];
      return { ...current, [provider]: accountLines.length ? [value, ...accountLines].filter(Boolean).join(`\n`) : value };
    });
  };
  const changeGodaddyAccountId = (value: string) => {
    if (!isCurrent() || operationBusy.current) return;
    setHasSyncedDomains(false);
    if (/[\r\n\u0000]/.test(value)) { setError(`Enter A Customer UUID Or Numeric Shopper ID`); return; }
    setError(``);
    setNotice(``);
    const accountId = value.trim();
    const key = /^\d+$/.test(accountId) ? `GODADDY_SHOPPER_ID` : `GODADDY_CUSTOMER_ID`;
    setValues(current => ({
      ...current,
      godaddy: [withoutGoDaddyAccountId(current.godaddy).trimEnd(), accountId ? `${key}=${accountId}` : ``].filter(Boolean).join(`\n`),
    }));
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
      setHasSyncedDomains(result.count > 0);
      setNotice(syncNotice(`Connections Saved`, result));
      setError(result.errors.join(`\n`));
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
      setVisibility({ ...EMPTY_VISIBILITY });
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
      setHasSyncedDomains(result.count > 0);
      setNotice(syncNotice(`Ownership Confirmed`, result));
      setError(result.errors.join(`\n`));
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Include Domain`);
    } finally { finishOperation(operation); }
  };
  const dismiss = () => { setError(``); setNotice(``); setHasSyncedDomains(false); };
  const currentView = viewActor === actorKey;
  const currentValues = currentView ? values : { ...EMPTY_CONNECTIONS };
  const godaddyAccountId = goDaddyAccountId(currentValues.godaddy);
  const inputValues = { ...currentValues, godaddy: withoutGoDaddyAccountId(currentValues.godaddy) };
  const inputValue = (field: ConnectionInput) => field === `godaddyAccountId` ? godaddyAccountId : inputValues[field];
  const isVisible = (field: ConnectionInput) => currentView && (!inputValue(field).trim() || visibility[field]);
  const toggleVisibility = (field: ConnectionInput) => {
    if (!isCurrent() || operationBusy.current || loading || !inputValue(field).trim()) return;
    setVisibility(current => ({ ...current, [field]: !current[field] }));
  };
  const discoveredDomains = currentView ? (connectionStatuses.hostinger.discoveredDomains ?? [])
    .filter(domain => !confirmedNames.includes(domain.name.toLowerCase())) : [];
  return {
    save, clear, change, dismiss, syncing, isVisible, inputValues, includeDomain, toggleVisibility,
    godaddyAccountId, changeGodaddyAccountId, connectionStatuses, discoveredDomains,
    busy: currentView && busy, loading: !currentView || loading,
    showDomainsLink: currentView && !busy && hasSyncedDomains,
    error: currentView ? error : ``, notice: currentView ? notice : ``, includingName: currentView ? includingName : ``,
    values: currentValues,
  };
};
