import { useRef, useState, useEffect } from 'react';
import { Roles } from '../../../types/types';
import { useLocalStorage } from '../../../shared/config';
import { useAuth } from '../../../shared/authContext/useAuth';
import type { AfternicCredentialField } from '../../../shared/marketplaceAfternic/types';
import { requestMarketplaceAfternic } from '../../../shared/marketplaceAfternic/client';
import { useAfternicPortfolioSync } from '../../../shared/marketplaceAfternic/PortfolioSyncContext';

type StatusResult = {
  error?: string;
  statusKey: string;
  configured?: boolean;
  canConfigure?: boolean;
};

const emptyCredentials = { key: ``, secret: `` };
const emptyDraft = { ...emptyCredentials, revealed: { key: false, secret: false } };
type CredentialDraft = typeof emptyDraft & { scope: string };
type SaveState = { statusKey: string; saving: boolean; error?: string };
type RevealState = { statusKey: string; value?: string; error?: string; pending?: boolean };

export const useAfternicConnection = () => {
  const { user, loading, loginRevision } = useAuth();
  const saveRequest = useRef<AbortController | null>(null);
  const revealRequests = useRef<Partial<Record<AfternicCredentialField, AbortController>>>({});
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [draft, setDraft] = useState<CredentialDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  const [reveals, setReveals] = useState<Partial<Record<AfternicCredentialField, RevealState>>>({});
  const accountId = !loading && user?.active && !user.anonymous && user.role !== Roles.Guest ? user.id : null;
  const scope = !useLocalStorage && accountId ? `${accountId}:${loginRevision}` : null;
  const { loadConnected, syncConnected } = useAfternicPortfolioSync(Boolean(scope));
  const statusKey = scope ? `${scope}:${revision}` : null;
  const current = statusKey && status?.statusKey === statusKey ? status : null;
  const currentSave = statusKey && saveState?.statusKey === statusKey ? saveState : null;
  const credentials = scope && draft?.scope === scope ? draft : emptyDraft;
  const revealed = {
    key: current?.configured && reveals.key?.statusKey === statusKey ? reveals.key : undefined,
    secret: current?.configured && reveals.secret?.statusKey === statusKey ? reveals.secret : undefined,
  };
  const canSave = Boolean(current?.canConfigure && credentials.key.trim() && credentials.secret.trim() && !currentSave?.saving);
  const canClear = Boolean(current?.canConfigure && (credentials.key || credentials.secret) && !currentSave?.saving);

  useEffect(() => {
    setDraft(null);
  }, [scope]);

  useEffect(() => {
    setReveals({});
    if (!statusKey) {
      setStatus(null);
      return;
    }
    const controller = new AbortController();
    const check = async () => {
      try {
        const result = await requestMarketplaceAfternic(`status`, {}, controller.signal);
        if (typeof result?.configured !== `boolean` || typeof result.canConfigure !== `boolean`) throw new Error(`Afternic Status Could Not Be Confirmed`);
        if (!controller.signal.aborted) {
          setStatus({ statusKey, configured: result.configured, canConfigure: result.canConfigure });
          if (!result.canConfigure) setDraft(null);
          if (result.configured) void loadConnected();
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          const error = failure instanceof Error && failure.message.trim() ? failure.message : `Afternic Status Could Not Be Checked`;
          setStatus({ statusKey, error });
        }
      }
    };
    void check();
    return () => {
      controller.abort();
      saveRequest.current?.abort();
      saveRequest.current = null;
      Object.values(revealRequests.current).forEach(request => request?.abort());
      revealRequests.current = {};
    };
  }, [loadConnected, statusKey]);

  const changeCredential = (field: AfternicCredentialField, value: string) => {
    if (!scope || !current?.canConfigure || saveRequest.current) return;
    setDraft(previous => ({ ...(previous?.scope === scope ? previous : emptyDraft), scope, [field]: value }));
  };

  const toggleStoredCredential = async (field: AfternicCredentialField) => {
    if (!statusKey || !current?.configured || revealRequests.current[field]) return;
    if (revealed[field]?.value) {
      setReveals(previous => ({ ...previous, [field]: undefined }));
      return;
    }

    const controller = new AbortController();
    revealRequests.current[field] = controller;
    setReveals(previous => ({ ...previous, [field]: { statusKey, pending: true } }));
    try {
      const result = await requestMarketplaceAfternic(`reveal`, { field }, controller.signal);
      if (controller.signal.aborted) return;
      if (typeof result?.value !== `string` || !result.value) throw new Error(`Afternic Credential Could Not Be Revealed`);
      setReveals(previous => ({ ...previous, [field]: { statusKey, value: result.value } }));
    } catch {
      if (!controller.signal.aborted) setReveals(previous => ({
        ...previous, [field]: { statusKey, error: `Afternic Credential Could Not Be Revealed — Try Again` },
      }));
    } finally {
      if (revealRequests.current[field] === controller) delete revealRequests.current[field];
    }
  };

  const toggleVisibility = (field: AfternicCredentialField) => {
    if (current?.configured) {
      void toggleStoredCredential(field);
      return;
    }
    if (!scope || !current?.canConfigure || saveRequest.current) return;
    setDraft(previous => previous?.scope === scope && previous[field].trim()
      ? { ...previous, revealed: { ...previous.revealed, [field]: !previous.revealed[field] } } : previous);
  };

  const clearForm = () => {
    if (!canClear || saveRequest.current) return;
    setDraft(null);
    setSaveState(null);
  };

  const save = async () => {
    if (!statusKey || !canSave || saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller;
    setSaveState({ statusKey, saving: true });
    try {
      const result = await requestMarketplaceAfternic(`configure`, { key: credentials.key.trim(), secret: credentials.secret.trim() }, controller.signal);
      if (controller.signal.aborted) return;
      if (result?.configured !== true || typeof result.canConfigure !== `boolean`) throw new Error(`Afternic Setup Could Not Be Confirmed`);
      setDraft(null);
      setStatus({ statusKey, configured: result.configured, canConfigure: result.canConfigure });
      setSaveState(null);
      void syncConnected();
    } catch (failure) {
      if (!controller.signal.aborted) setSaveState({
        statusKey, saving: false,
        error: failure instanceof Error && failure.message.trim() ? failure.message : `Afternic Could Not Be Connected`,
      });
    } finally {
      if (saveRequest.current === controller) saveRequest.current = null;
    }
  };

  return {
    save, canSave, canClear, clearForm, changeCredential, toggleVisibility,
    canCheck: Boolean(statusKey),
    error: current?.error,
    saving: currentSave?.saving === true,
    saveError: currentSave?.error,
    localMode: useLocalStorage,
    credentials, revealed,
    revealError: revealed.key?.error || revealed.secret?.error,
    configured: current?.configured,
    canConfigure: current?.canConfigure === true,
    checking: !useLocalStorage && (loading || Boolean(statusKey && !current)),
    refresh: () => { if (!saveRequest.current) setRevision(value => value + 1); },
  };
};
