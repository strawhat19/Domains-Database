import { useRef, useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomains } from '../../shared/domainContext/useDomains';
import { formatSyncNotice } from '../../shared/registrarSync/messages';
import type { ConnectionSyncResult } from '../../shared/registrarSync/types';
import { createConnectionDraft } from '../../shared/connections/values';
import { connectionInputValue, supportsRegistrarSync, withConnectionInputValue, type ConnectionInputKey } from '../../shared/connections/inputs';
import { connectionFields, type AccountConnectionsProps, type ConnectionAccount, type ConnectionProvider } from '../../shared/connections/types';

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
  const [hasSyncedDomains, setHasSyncedDomains] = useState(false);
  const [accounts, setAccounts] = useState<ConnectionAccount[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider>(connectionFields[0].id);
  const fields = connectionFields.filter(field => !providers || providers.includes(field.id));
  const activeProvider = fields.find(field => field.id === selectedProvider)?.id ?? fields[0]?.id;
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
    setError(``);
    setNotice(``);
    setVisibility({});
    setHasSyncedDomains(false);
    setSelectedProvider(connectionFields[0].id);
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
  const change = (id: string, key: ConnectionInputKey, value: string) => {
    if (!isCurrent() || operationBusy.current || loading || syncing) return;
    if (/[\r\n\u0000]/.test(value)) { setError(`Enter One Connection Value Per Field`); return; }
    setVisibility(current => ({ ...current, [`${id}:${key}`]: true }));
    editAccount(id, account => ({ ...account, values: withConnectionInputValue(account, key, value) }));
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
      const syncable = (savedAccount ? [savedAccount] : snapshot.accounts).some(supportsRegistrarSync);
      setNotice(syncable ? `Connections Saved — Checking Domains…` : `Developer OAuth Credentials Saved`);
      const result = await syncConnections(snapshot, savedAccount ? [savedAccount.id] : undefined);
      if (!isCurrent(operation)) return;
      setHasSyncedDomains(result.count > 0);
      setNotice(syncable ? syncNotice(`Connections Saved`, result)
        : `Developer OAuth Credentials Saved — Domain Sync Requires Reseller Credentials`);
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
  const dismiss = () => { setError(``); setNotice(``); setHasSyncedDomains(false); };
  const currentView = viewActor === actorKey;
  const inputValue = (account: ConnectionAccount, key: ConnectionInputKey) => currentView ? connectionInputValue(account, key) : ``;
  const isVisible = (account: ConnectionAccount, key: ConnectionInputKey) => currentView
    && (!inputValue(account, key).trim() || (visibility[`${account.id}:${key}`] ?? !account.number));
  const toggleVisibility = (account: ConnectionAccount, key: ConnectionInputKey) => {
    if (!isCurrent() || operationBusy.current || loading || syncing || !inputValue(account, key).trim()) return;
    setVisibility(current => ({ ...current, [`${account.id}:${key}`]: !isVisible(account, key) }));
  };
  return {
    add, save, clear, change, remove, dismiss, syncing, isVisible, inputValue, toggleVisibility,
    accountStatuses,
    fields, activeProvider,
    selectProvider: setSelectedProvider,
    signedIn: !!user?.id,
    busy: currentView && busy, loading: !currentView || loading,
    showDomainsLink: currentView && !busy && hasSyncedDomains,
    error: currentView ? error : ``, notice: currentView ? notice : ``,
    accounts: currentView ? accounts.filter(account => !providers || providers.includes(account.provider)) : [],
  };
};
