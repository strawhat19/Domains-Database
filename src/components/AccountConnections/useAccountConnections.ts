import { useRef, useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { normalizeDomainName } from '../../shared/domainUtils';
import { useDomains } from '../../shared/domainContext/useDomains';
import { formatSyncNotice } from '../../shared/registrarSync/messages';
import type { ConnectionSyncResult } from '../../shared/registrarSync/types';
import { createConnectionDraft } from '../../shared/connections/values';
import { connectionFields, type AccountConnectionsProps, type ConnectionAccount, type ConnectionProvider } from '../../shared/connections/types';

type ConnectionInput = `values` | `godaddyAccountId`;
const godaddyAccountLine = /^\s*(?:export\s+)?GODADDY_(?:CUSTOMER|SHOPPER)_ID\s*=/;
const externalDomainLine = /^\s*(?:export\s+)?HOSTINGER_EXTERNAL_DOMAINS\s*=/;
const withoutGoDaddyAccountId = (values: string) => values.split(/\r?\n/).filter(line => !godaddyAccountLine.test(line)).join(`\n`);
const goDaddyAccountId = (values: string) => {
  const line = values.split(/\r?\n/).find(value => godaddyAccountLine.test(value));
  const raw = line?.slice(line.indexOf(`=`) + 1)?.trim() ?? ``;
  return raw.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? raw;
};
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
const withDrafts = (accounts: readonly ConnectionAccount[]) => [
  ...accounts,
  ...connectionFields.filter(field => !accounts.some(account => account.provider === field.id)).map(field => createConnectionDraft(field.id)),
];
const syncNotice = (label: string, result: ConnectionSyncResult) =>
  formatSyncNotice(result, `${label}${result.errors.length ? ` — Sync Finished With Errors` : ``}`);

export const useAccountConnections = ({ providers }: Pick<AccountConnectionsProps, `providers`> = {}) => {
  const { user, loginRevision } = useAuth();
  const { syncing, syncConnections, accountStatuses, resetConnectionSync } = useDomains();
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}`;
  const mounted = useRef(true);
  const dirty = useRef(false);
  const revision = useRef(0);
  const operationBusy = useRef(false);
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [viewActor, setViewActor] = useState(actorKey);
  const [includingKey, setIncludingKey] = useState(``);
  const [hasSyncedDomains, setHasSyncedDomains] = useState(false);
  const [accounts, setAccounts] = useState<ConnectionAccount[]>([]);
  const isCurrent = (operation?: number) => mounted.current && currentActor.current === actorKey
    && (operation === undefined || operation === revision.current);
  useEffect(() => {
    mounted.current = true;
    dirty.current = false;
    operationBusy.current = false;
    ++revision.current;
    const userId = user?.id;
    setBusy(false);
    setLoading(true);
    setViewActor(actorKey);
    setAccounts([]);
    setIncludingKey(``);
    setError(``);
    setNotice(``);
    setVisibility({});
    setHasSyncedDomains(false);
    const load = () => {
      const operation = revision.current;
      return connectionsAPI.getConnections(userId).then(snapshot => {
      if (!isCurrent(operation) || snapshot.userId !== userId || dirty.current || operationBusy.current) return;
      setAccounts(withDrafts(snapshot.accounts));
      setVisibility({});
    }).catch(() => { if (isCurrent(operation)) setError(`Could Not Load Connections`); })
      .finally(() => { if (isCurrent(operation)) setLoading(false); });
    };
    if (!userId) setLoading(false);
    else void load();
    const unsubscribe = connectionsAPI.subscribeConnections(changedUserId => {
      if (changedUserId === userId && !dirty.current && !operationBusy.current) void load();
    });
    return () => { mounted.current = false; ++revision.current; operationBusy.current = false; unsubscribe(); };
  }, [actorKey]);
  const beginOperation = () => {
    if (!user?.id || !isCurrent() || operationBusy.current || loading || syncing) return;
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
    setIncludingKey(``);
    setBusy(false);
  };
  const editAccount = (id: string, change: (account: ConnectionAccount) => ConnectionAccount) => {
    if (!isCurrent() || operationBusy.current || loading || syncing) return;
    dirty.current = true;
    setError(``);
    setNotice(``);
    setHasSyncedDomains(false);
    setAccounts(current => current.map(account => account.id === id ? change(account) : account));
  };
  const change = (id: string, value: string) => editAccount(id, account => {
    const accountLines = account.provider === `godaddy` && !value.split(/\r?\n/).some(line => godaddyAccountLine.test(line))
      ? account.values.split(/\r?\n/).filter(line => godaddyAccountLine.test(line)) : [];
    return { ...account, values: accountLines.length ? [value, ...accountLines].filter(Boolean).join(`\n`) : value };
  });
  const changeGodaddyAccountId = (id: string, value: string) => {
    if (/[\r\n\u0000]/.test(value)) { setError(`Enter A Customer UUID Or Numeric Shopper ID`); return; }
    const accountId = value.trim();
    const key = /^\d+$/.test(accountId) ? `GODADDY_SHOPPER_ID` : `GODADDY_CUSTOMER_ID`;
    editAccount(id, account => ({
      ...account, values: [withoutGoDaddyAccountId(account.values).trimEnd(), accountId ? `${key}=${accountId}` : ``].filter(Boolean).join(`\n`),
    }));
  };
  const add = (provider: ConnectionProvider) => {
    if (!isCurrent() || operationBusy.current || loading || syncing) return;
    dirty.current = true;
    setAccounts(current => [...current, createConnectionDraft(provider)]);
    setError(``);
    setNotice(``);
  };
  const save = async (accountId?: string) => {
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation)) return;
      const selected = accounts.filter(account => accountId ? account.id === accountId : !providers || providers.includes(account.provider));
      if (accountId && !selected[0]?.values.trim()) throw new Error(`Enter Connection Values Before Saving`);
      const payload = accountId
        ? [...latest.accounts.filter(account => account.id !== accountId), ...selected]
        : [...latest.accounts.filter(account => providers && !providers.includes(account.provider)), ...selected];
      const snapshot = await connectionsAPI.saveConnections(payload, userId);
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      const savedAccount = accountId ? snapshot.accounts.find(account => account.id === accountId) ?? snapshot.accounts.at(-1) : undefined;
      if (accountId && savedAccount) {
        dirty.current = accounts.some(account => account.id !== accountId && !!account.values.trim()
          && snapshot.accounts.find(value => value.id === account.id)?.values !== account.values);
        setAccounts(current => current.map(account => account.id === accountId ? savedAccount : account));
      } else {
        setAccounts(withDrafts(snapshot.accounts));
        dirty.current = false;
      }
      setVisibility({});
      setNotice(`Connections Saved — Checking Domains…`);
      const result = await syncConnections(snapshot, savedAccount ? [savedAccount.id] : undefined);
      if (!isCurrent(operation)) return;
      setHasSyncedDomains(result.count > 0);
      setNotice(syncNotice(`Connections Saved`, result));
      setError(result.errors.join(`\n`));
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Save Connections`);
    } finally { finishOperation(operation); }
  };
  const remove = async (accountId: string) => {
    const account = accounts.find(value => value.id === accountId);
    if (!account || !isCurrent() || operationBusy.current || loading || syncing) return;
    if (!account.number) {
      setAccounts(current => withDrafts(current.filter(value => value.id !== accountId)));
      return;
    }
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation)) return;
      await connectionsAPI.saveConnections(latest.accounts.filter(value => value.id !== accountId), userId);
      if (!isCurrent(operation)) return;
      resetConnectionSync();
      setAccounts(current => withDrafts(current.filter(value => value.id !== accountId)));
      setNotice(`Connection Removed`);
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Remove Connection`);
    } finally { finishOperation(operation); }
  };
  const clear = async () => {
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation)) return;
      if (providers) await connectionsAPI.saveConnections(latest.accounts.filter(account => !providers.includes(account.provider)), userId);
      else await connectionsAPI.clearConnections(userId);
      if (!isCurrent(operation)) return;
      resetConnectionSync();
      setAccounts(current => withDrafts(providers ? current.filter(account => !providers.includes(account.provider)) : []));
      setVisibility({});
      dirty.current = false;
      setNotice(`Connections Removed`);
    } catch { if (isCurrent(operation)) setError(`Could Not Remove Connections`); }
    finally { finishOperation(operation); }
  };
  const includeDomain = async (accountId: string, candidateName: string) => {
    if (!accountStatuses[accountId]?.discoveredDomains?.some(domain => domain.name === candidateName)) return;
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      const name = normalizeDomainName(candidateName);
      setIncludingKey(`${accountId}:${name}`);
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation) || latest.userId !== userId) return;
      const account = latest.accounts.find(value => value.id === accountId && value.provider === `hostinger`);
      if (!account) throw new Error(`Save Your Hostinger Connection Before Including Domains`);
      const values = includeExternalDomain(account.values, name);
      const snapshot = await connectionsAPI.saveConnections(latest.accounts.map(value => value.id === accountId ? { ...value, values } : value), userId);
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      setAccounts(current => current.map(value => {
        if (value.id !== accountId) return value;
        try { return { ...value, values: includeExternalDomain(value.values, name) }; }
        catch { return value; }
      }));
      setNotice(`Ownership Confirmed — Checking Domains…`);
      const result = await syncConnections(snapshot, [accountId]);
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
  const inputValue = (account: ConnectionAccount, field: ConnectionInput = `values`) => field === `godaddyAccountId`
    ? goDaddyAccountId(account.values) : account.provider === `godaddy` ? withoutGoDaddyAccountId(account.values) : account.values;
  const isVisible = (account: ConnectionAccount, field: ConnectionInput = `values`) => currentView
    && (!inputValue(account, field).trim() || (visibility[`${account.id}:${field}`] ?? !account.number));
  const toggleVisibility = (account: ConnectionAccount, field: ConnectionInput = `values`) => {
    if (!isCurrent() || operationBusy.current || loading || syncing || !inputValue(account, field).trim()) return;
    setVisibility(current => ({ ...current, [`${account.id}:${field}`]: !isVisible(account, field) }));
  };
  const discoveredDomains = (account: ConnectionAccount) => currentView ? (accountStatuses[account.id]?.discoveredDomains ?? [])
    .filter(domain => !externalDomains(account.values).includes(domain.name.toLowerCase())) : [];
  return {
    add, save, clear, change, remove, dismiss, syncing, isVisible, inputValue, includeDomain, toggleVisibility,
    changeGodaddyAccountId, accountStatuses, discoveredDomains,
    signedIn: !!user?.id,
    busy: currentView && busy, loading: !currentView || loading,
    showDomainsLink: currentView && !busy && hasSyncedDomains,
    error: currentView ? error : ``, notice: currentView ? notice : ``, includingKey: currentView ? includingKey : ``,
    accounts: currentView ? accounts.filter(account => !providers || providers.includes(account.provider)) : [],
  };
};
