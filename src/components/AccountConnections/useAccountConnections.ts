import { useRouter } from 'expo-router';
import { routes } from '../../shared/routes';
import type { ToastStackNotice } from '../ToastStack/types';
import { useLocalStorage } from '../../shared/config';
import { useRef, useEffect, useState } from 'react';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { useDomains } from '../../shared/domainContext/useDomains';
import { formatSyncNotice } from '../../shared/registrarSync/messages';
import { resumeAutomaticSync } from '../../shared/registrarSync/policy';
import type { ConnectionSyncResult } from '../../shared/registrarSync/types';
import { createConnectionDraft } from '../../shared/connections/values';
import { hasProPlanAccess, hasUnlimitedPlanAccess } from '../../shared/accountPlans';
import { MAX_CONNECTION_ENV_SIZE, parseConnectionEnvironment } from '../../shared/connections/file';
import { connectionTabs, proConnectionProviders, type ConnectionTabProvider } from '../../shared/connections/catalog';
import { TOAST_ENTRY_DELAY, TOAST_EXIT_DELAY, TOAST_ENTER_DURATION, TOAST_VISIBLE_DURATION, TOAST_REMINDER_DURATION } from '../ToastStack/motion';
import { connectionFields, type AccountConnectionsProps, type ConnectionAccount, type ConnectionProvider } from '../../shared/connections/types';
import { connectionInputFields, connectionInputValue, supportsRegistrarSync, withConnectionInputValue, type ConnectionInputKey } from '../../shared/connections/inputs';

const withDrafts = (accounts: readonly ConnectionAccount[]) => [
  ...accounts,
  ...connectionFields.filter(field => !accounts.some(account => account.provider === field.id)).map(field => createConnectionDraft(field.id)),
];
const syncNotice = (label: string, result: ConnectionSyncResult) =>
  formatSyncNotice(result, `${label}${result.errors.length ? ` — Sync Finished With Errors` : ``}`);

export const useAccountConnections = ({ providers }: Pick<AccountConnectionsProps, `providers`> = {}) => {
  const router = useRouter();
  const { user, loginRevision } = useAuth();
  const { syncing, syncConnections, accountStatuses, canSyncConnections } = useDomains();
  const connectionSync = useRef({ syncConnections, canSyncConnections });
  connectionSync.current = { syncConnections, canSyncConnections };
  const actorKey = `${user?.id ?? `guest`}:${loginRevision}`;
  const mounted = useRef(true);
  const dirty = useRef(false);
  const revision = useRef(0);
  const noticeNumber = useRef(0);
  const operationBusy = useRef(false);
  const savedValues = useRef(new Map<string, string>());
  const environmentImport = useRef<AbortController | null>(null);
  const currentActor = useRef(actorKey);
  currentActor.current = actorKey;
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [importText, setImportText] = useState(``);
  const [importError, setImportError] = useState(``);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(``);
  const [notice, setNotice] = useState(``);
  const [keyNotices, setKeyNotices] = useState<ToastStackNotice[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [viewActor, setViewActor] = useState(actorKey);
  const [hasSyncedDomains, setHasSyncedDomains] = useState(false);
  const [accounts, setAccounts] = useState<ConnectionAccount[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider>(connectionFields[0].id);
  const hasProAccess = hasProPlanAccess(user);
  const unlimitedPlanAccess = hasUnlimitedPlanAccess(user);
  const canUseProvider = (provider: ConnectionProvider) => hasProAccess || !proConnectionProviders.includes(provider);
  const fields = connectionFields.filter(field => !providers || providers.includes(field.id));
  const allowedFields = fields.filter(field => canUseProvider(field.id));
  const tabs = connectionTabs.filter(tab => !providers || providers.some(provider => provider === tab.id))
    .map(tab => ({ ...tab, pro: tab.pro && !unlimitedPlanAccess, locked: !tab.available || (tab.pro && !hasProAccess) }));
  const activeProvider = allowedFields.find(field => field.id === selectedProvider)?.id ?? allowedFields[0]?.id;
  const isCurrent = (operation?: number) => mounted.current && currentActor.current === actorKey
    && (operation === undefined || operation === revision.current);
  useEffect(() => {
    mounted.current = true;
    dirty.current = false;
    savedValues.current.clear();
    operationBusy.current = false;
    ++revision.current;
    const userId = user?.id;
    setBusy(false);
    setImporting(false);
    setImportOpen(false);
    setReadingFile(false);
    setImportText(``);
    setImportError(``);
    setLoading(true);
    setViewActor(actorKey);
    setAccounts([]);
    setError(``);
    setNotice(``);
    setKeyNotices([]);
    setVisibility({});
    setHasSyncedDomains(false);
    setSelectedProvider(connectionFields[0].id);
    const load = () => {
      const operation = revision.current;
      return connectionsAPI.getConnections(userId).then(snapshot => {
      if (!isCurrent(operation) || snapshot.userId !== userId || dirty.current || operationBusy.current) return;
      savedValues.current = new Map(snapshot.accounts.map(account => [account.id, account.values]));
      setAccounts(withDrafts(snapshot.accounts));
      setVisibility({});
    }).catch(() => { if (isCurrent(operation)) setError(`Could Not Load Connections`); })
      .finally(() => { if (isCurrent(operation)) setLoading(false); });
    };
    if (!userId) setLoading(false);
    else void load();
    const unsubscribe = connectionsAPI.subscribeConnections(changedUserId => {
      if (changedUserId === userId && !dirty.current && !operationBusy.current) void load();
    }, userId, failure => {
      if (!isCurrent()) return;
      setError(failure.message);
      setLoading(false);
    });
    return () => { mounted.current = false; ++revision.current; operationBusy.current = false; environmentImport.current?.abort(); unsubscribe(); };
  }, [actorKey]);
  const beginOperation = () => {
    if (!user?.id || !isCurrent() || operationBusy.current || loading || syncing) return;
    operationBusy.current = true;
    const operation = ++revision.current;
    setBusy(true);
    setError(``);
    setNotice(``);
    setKeyNotices([]);
    setHasSyncedDomains(false);
    return { operation, userId: user.id };
  };
  const finishOperation = (operation: number) => {
    if (!isCurrent(operation)) return;
    operationBusy.current = false;
    setBusy(false);
    setImporting(false);
  };
  const editAccount = (id: string, change: (account: ConnectionAccount) => ConnectionAccount) => {
    if (!isCurrent() || operationBusy.current || loading || syncing) return;
    if (!accounts.some(account => account.id === id && canUseProvider(account.provider))) return;
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
  const canAddConnection = (provider: ConnectionProvider) => Boolean(user?.id) && viewActor === actorKey && canUseProvider(provider) && accounts.some(account => {
    if (account.provider !== provider || account.number < 1) return false;
    const saved = { ...account, values: savedValues.current.get(account.id) ?? `` };
    return connectionFields.find(field => field.id === provider)?.keys.some(key => Boolean(connectionInputValue(saved, key).trim())) ?? false;
  });
  const add = (provider: ConnectionProvider) => {
    if (!isCurrent() || operationBusy.current || loading || syncing || !canAddConnection(provider)) return;
    dirty.current = true;
    setAccounts(current => [...current, createConnectionDraft(provider)]);
    setError(``);
    setNotice(``);
  };
  const openImport = () => {
    if (!user?.id || !isCurrent() || operationBusy.current || loading || syncing) return;
    setImportOpen(true);
  };
  const selectProvider = (provider: ConnectionTabProvider) => {
    if (!isCurrent()) return;
    const field = allowedFields.find(field => field.id === provider);
    if (field) setSelectedProvider(field.id);
  };
  const closeImport = () => {
    if (operationBusy.current) return;
    setImportOpen(false);
    setImportText(``);
    setImportError(``);
  };
  const changeImportText = (text: string) => {
    if (!isCurrent() || operationBusy.current || loading || syncing) return;
    if (text.length > MAX_CONNECTION_ENV_SIZE) { setImportText(``); setImportError(`Use .env Contents Under 256 KB`); return; }
    setImportText(text);
    setImportError(``);
  };
  const addImportNotices = (messages: string[], remindToSave = false) => {
    const batch = ++noticeNumber.current;
    const now = Date.now();
    const queued = remindToSave ? [...messages, `Remember To Save — Click Save All Connections To Keep Your Imported Keys`] : messages;
    setKeyNotices(current => {
      const previous = current.at(-1);
      const appearAt = Math.max(now, (previous?.appearAt ?? now - TOAST_ENTRY_DELAY) + TOAST_ENTRY_DELAY);
      const dismissAt = Math.max(appearAt + TOAST_ENTER_DURATION + TOAST_VISIBLE_DURATION, (previous?.dismissAt ?? 0) + TOAST_EXIT_DELAY);
      return [...current, ...queued.map((message, index) => {
        const reminder = remindToSave && index === queued.length - 1;
        const entryAt = appearAt + index * TOAST_ENTRY_DELAY;
        return {
          message, reminder, id: `env-${batch}-${index}`,
          appearAt: entryAt,
          dismissAt: Math.max(dismissAt + index * TOAST_EXIT_DELAY, entryAt + TOAST_ENTER_DURATION + (reminder ? TOAST_REMINDER_DURATION : TOAST_VISIBLE_DURATION)),
        };
      })];
    });
  };
  const readEnvironmentFiles = async (files: File[]) => {
    if (!files.length) return;
    const request = beginOperation();
    if (!request) return;
    const { operation } = request;
    setImportOpen(true);
    setReadingFile(true);
    setImportError(``);
    try {
      if (files.length !== 1) throw new Error(`Choose One .env File At A Time`);
      const file = files[0];
      if (!file?.name || !/(?:^|\.)(?:env(?:\..+)?|local|development|production|txt)$/i.test(file.name)) throw new Error(`Choose A .env Or Text File`);
      if (file.size > MAX_CONNECTION_ENV_SIZE) throw new Error(`Choose A .env File Under 256 KB`);
      const text = await file.text().catch(() => { throw new Error(`Could Not Read The .env File`); });
      if (!isCurrent(operation)) return;
      if (text.length > MAX_CONNECTION_ENV_SIZE) throw new Error(`Use .env Contents Under 256 KB`);
      if (!text.trim()) throw new Error(`The .env File Is Empty`);
      setImportText(text);
      if (loadEnvironment(text, operation)) {
        setImportOpen(false);
        setImportText(``);
      }
    } catch (failure) {
      if (isCurrent(operation)) setImportError(failure instanceof Error ? failure.message : `Could Not Read The .env File`);
    } finally {
      if (isCurrent(operation)) setReadingFile(false);
      finishOperation(operation);
    }
  };
  const loadEnvironment = (text: string, operation?: number, skipped = 0) => {
    if (!user?.id || !isCurrent(operation) || (operationBusy.current && operation === undefined) || loading || syncing) return false;
    const parsed = parseConnectionEnvironment(text, providers);
    if (!parsed.connections.length) throw new Error(`No Supported Registrar Keys Found In .env`);
    const next = [...accounts];
    const notices: string[] = [];
    const hidden: Record<string, boolean> = {};
    let added = 0;
    let duplicates = 0;
    let proSkipped = 0;
    for (const connection of parsed.connections) {
      if (!canUseProvider(connection.provider)) { proSkipped++; continue; }
      const field = connectionFields.find(field => field.id === connection.provider);
      if (!field) continue;
      const draft = { ...createConnectionDraft(connection.provider), values: connection.values };
      if (next.some(account => account.provider === draft.provider
        && field.keys.every(key => connectionInputValue(account, key) === connectionInputValue(draft, key)))) { duplicates++; continue; }
      const empty = next.findIndex(account => account.provider === draft.provider && !account.number && !account.values.trim());
      const loaded = empty >= 0 ? { ...next[empty], values: draft.values } : draft;
      if (empty >= 0) next[empty] = loaded;
      else next.push(loaded);
      for (const key of field.keys) {
        hidden[`${loaded.id}:${key}`] = false;
        if (connectionInputValue(loaded, key).trim()) notices.push(`${field.label} ${connectionInputFields[key].label} Added — Review And Save`);
      }
      added++;
    }
    if (added) {
      dirty.current = true;
      setAccounts(withDrafts(next));
      setVisibility(current => ({ ...current, ...hidden }));
    }
    const first = parsed.connections.find(connection => allowedFields.some(field => field.id === connection.provider));
    if (first) setSelectedProvider(first.provider);
    setError(``);
    setHasSyncedDomains(false);
    const summary = added ? `${added} Connection(s) Loaded From .env — Review And Save${duplicates ? ` — ${duplicates} Duplicate(s) Skipped` : ``}`
      : proSkipped && !duplicates ? `These Registrar(s) Are Available On Pro Plan` : `These .env Connection(s) Are Already Added`;
    setNotice(``);
    addImportNotices([...notices, `${summary}${proSkipped && (added || duplicates) ? ` — ${proSkipped} Pro Registrar(s) Skipped` : ``}${skipped ? ` — ${skipped} Invalid Key(s) Skipped` : ``}`], added > 0);
    return true;
  };
  const loadImportText = () => {
    try { if (loadEnvironment(importText)) closeImport(); }
    catch (failure) { if (isCurrent()) setImportError(failure instanceof Error ? failure.message : `Could Not Import .env Keys`); }
  };
  const importServerEnvironment = async () => {
    if (useLocalStorage || !user?.active || !user.firebase_uid) return;
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    const controller = new AbortController();
    environmentImport.current = controller;
    setImporting(true);
    try {
      if (!allowedFields.length) throw new Error(`These Registrar(s) Are Available On Pro Plan`);
      const result = await connectionsAPI.importEnvironmentConnections(allowedFields.map(field => field.id), userId, controller.signal);
      if (!isCurrent(operation)) return;
      if (result.connections.length) loadEnvironment(result.connections.map(connection => connection.values).join(`\n`), operation, result.skipped);
      else setNotice(`No Supported Registrar Keys Found In Server .env${result.skipped ? ` — ${result.skipped} Skipped` : ``}`);
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Import Connections From .env`);
    } finally {
      if (environmentImport.current === controller) environmentImport.current = null;
      finishOperation(operation);
    }
  };
  const save = async (accountId?: string) => {
    const request = beginOperation();
    if (!request) return;
    const { operation, userId } = request;
    try {
      if (!allowedFields.length || (accountId && accounts.some(account => account.id === accountId && !canUseProvider(account.provider)))) {
        throw new Error(`This Registrar Is Available On Pro Plan`);
      }
      const deferred = accounts.filter(account => !canUseProvider(account.provider) && (account.number
        ? account.values !== savedValues.current.get(account.id) : Boolean(account.values.trim())));
      const deferredNotice = deferred.length ? ` — ${deferred.length} Pro Connection Edit(s) Kept Unsaved` : ``;
      const latest = await connectionsAPI.getConnections(userId);
      if (!isCurrent(operation)) return;
      const selected = accounts.filter(account => canUseProvider(account.provider) && (accountId ? account.id === accountId : !providers || providers.includes(account.provider)));
      if (accountId && !selected[0]?.values.trim()) throw new Error(`Enter Connection Values Before Saving`);
      const filled = selected.filter(account => account.values.trim());
      const payload = [...latest.accounts.filter(account => !filled.some(edit => edit.id === account.id)), ...filled];
      const snapshot = await connectionsAPI.saveConnections(payload, userId);
      if (!isCurrent(operation) || snapshot.userId !== userId) return;
      const savedAccount = accountId ? snapshot.accounts.find(account => account.id === accountId) ?? snapshot.accounts.at(-1) : undefined;
      if (accountId && savedAccount) {
        savedValues.current.delete(accountId);
        savedValues.current.set(savedAccount.id, savedAccount.values);
        dirty.current = accounts.some(account => account.id !== accountId && (account.number
          ? account.values !== savedValues.current.get(account.id) : Boolean(account.values.trim())));
        setAccounts(current => current.map(account => account.id === accountId ? savedAccount : account));
      } else {
        const merged = snapshot.accounts.map(account => deferred.find(edit => edit.id === account.id) ?? account);
        const drafts = deferred.filter(account => !snapshot.accounts.some(saved => saved.id === account.id))
          .map(account => account.number ? { ...createConnectionDraft(account.provider), values: account.values } : account);
        savedValues.current = new Map(snapshot.accounts.map(account => [account.id, account.values]));
        setAccounts(withDrafts([...merged, ...drafts]));
        dirty.current = deferred.length > 0;
      }
      setVisibility({});
      const syncAccounts = savedAccount ? [savedAccount] : snapshot.accounts.filter(account => canUseProvider(account.provider));
      const syncable = syncAccounts.some(supportsRegistrarSync);
      if (!connectionSync.current.canSyncConnections) {
        if (syncable) await resumeAutomaticSync(userId, () => isCurrent(operation));
        if (!isCurrent(operation)) return;
        setNotice(`${syncable ? `Connections Saved — Open Domains To Sync` : `Developer OAuth Credentials Saved`}${deferredNotice}`);
        if (!deferred.length) router.replace(routes.domains.href);
        return;
      }
      setNotice(`${syncable ? `Connections Saved — Checking Domains…` : `Developer OAuth Credentials Saved`}${deferredNotice}`);
      const syncRequest = connectionSync.current.syncConnections(snapshot, syncAccounts.map(account => account.id));
      if (!deferred.length) router.replace(routes.domains.href);
      const result = await syncRequest;
      if (!isCurrent(operation)) return;
      setHasSyncedDomains(result.count > 0);
      setNotice(`${syncable ? syncNotice(`Connections Saved`, result)
        : `Developer OAuth Credentials Saved — Domain Sync Requires Reseller Credentials`}${deferredNotice}`);
      setError(result.errors.join(`\n`));
    } catch (failure) {
      if (isCurrent(operation)) setError(failure instanceof Error ? failure.message : `Could Not Save Connections`);
    } finally { finishOperation(operation); }
  };
  const hasFormValues = (accountId?: string) => viewActor === actorKey && accounts.some(account => (!accountId || account.id === accountId)
    && allowedFields.some(field => field.id === account.provider && field.keys.some(key => connectionInputValue(account, key).trim())));
  const clearForm = (accountId?: string) => {
    if (!user?.id || !isCurrent() || operationBusy.current || loading || syncing || !hasFormValues(accountId)) return;
    const cleared = new Set(accounts.filter(account => (!accountId || account.id === accountId)
      && allowedFields.some(field => field.id === account.provider)).map(account => account.id));
    dirty.current = true;
    setAccounts(current => current.map(account => cleared.has(account.id) ? { ...account, values: `` } : account));
    setVisibility(current => Object.fromEntries(Object.entries(current).filter(([key]) => ![...cleared].some(id => key.startsWith(`${id}:`)))));
    setError(``);
    setNotice(``);
    setKeyNotices([]);
    setHasSyncedDomains(false);
  };
  const dismissKeyNotice = (id: string) => {
    if (isCurrent()) setKeyNotices(current => current.filter(notice => notice.id !== id));
  };
  const dismiss = () => {
    setError(``);
    setNotice(``);
    setHasSyncedDomains(false);
  };
  const currentView = viewActor === actorKey;
  const inputValue = (account: ConnectionAccount, key: ConnectionInputKey) => currentView ? connectionInputValue(account, key) : ``;
  const isVisible = (account: ConnectionAccount, key: ConnectionInputKey) => currentView
    && (!inputValue(account, key).trim() || (visibility[`${account.id}:${key}`] ?? !account.number));
  const toggleVisibility = (account: ConnectionAccount, key: ConnectionInputKey) => {
    if (!isCurrent() || operationBusy.current || loading || syncing || !inputValue(account, key).trim()) return;
    setVisibility(current => ({ ...current, [`${account.id}:${key}`]: !isVisible(account, key) }));
  };
  return {
    add, save, change, dismiss, syncing, isVisible, inputValue, clearForm, hasFormValues, toggleVisibility, importServerEnvironment,
    accountStatuses, openImport, closeImport, loadImportText, changeImportText, readEnvironmentFiles,
    tabs, fields, activeProvider, canAddConnection, dismissKeyNotice, selectProvider,
    keyNotices: currentView ? keyNotices : [],
    signedIn: !!user?.id,
    importing: currentView && importing,
    importOpen: currentView && importOpen,
    readingFile: currentView && readingFile,
    importText: currentView ? importText : ``, importError: currentView ? importError : ``,
    canImportServer: currentView && !useLocalStorage && !!user?.id && !!user.active && !!user.firebase_uid,
    busy: currentView && busy, loading: !currentView || loading,
    showDomainsLink: currentView && !busy && hasSyncedDomains,
    error: currentView ? error : ``, notice: currentView ? notice : ``,
    accounts: currentView ? accounts.filter(account => !providers || providers.includes(account.provider)) : [],
  };
};
