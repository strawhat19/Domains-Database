import { api } from '../../api';
import { useAuth } from '../authContext/useAuth';
import { getRegistrarDomains } from './client';
import { connectionsAPI } from '../../api/connections';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionSyncResult, ConnectionSyncStatuses } from './types';
import { connectionFields, type ConnectionSnapshot } from '../connections/types';

const emptyStatuses = (): ConnectionSyncStatuses => ({
  godaddy: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  porkbun: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namesilo: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  hostinger: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
  namecheap: { count: 0, message: `Not Connected`, checkedAt: ``, state: `idle` },
});

export const useRegistrarSync = (refreshDomains: () => Promise<void>) => {
  const { user, loginRevision } = useAuth();
  const userId = user?.id;
  const active = useRef(false);
  const revision = useRef(0);
  const owner = useRef(user?.name ?? ``);
  const controllers = useRef<AbortController[]>([]);
  const [syncError, setSyncError] = useState(``);
  const [syncNotice, setSyncNotice] = useState(``);
  const [connectionStatuses, setConnectionStatuses] = useState(emptyStatuses);
  owner.current = user?.name ?? ``;

  const cancelRequests = useCallback(() => {
    revision.current += 1;
    controllers.current.forEach(controller => controller.abort());
    controllers.current = [];
  }, []);

  const resetConnectionSync = useCallback(() => {
    cancelRequests();
    setSyncError(``);
    setSyncNotice(``);
    setConnectionStatuses(emptyStatuses());
  }, [cancelRequests]);
  const clearSyncNotice = useCallback(() => setSyncNotice(``), []);

  const syncConnections = useCallback(async (saved?: ConnectionSnapshot): Promise<ConnectionSyncResult> => {
    cancelRequests();
    const run = revision.current;
    const current = () => active.current && revision.current === run;
    const empty = { count: 0, errors: [], warnings: [] };
    if (!userId || !current()) return empty;
    setSyncError(``);
    setSyncNotice(``);
    try {
      const snapshot = saved ?? await connectionsAPI.getConnections(userId);
      if (!current()) return empty;
      if (snapshot.userId !== userId) throw new Error(`Sign In To Sync Your Domains`);
      const fields = connectionFields.filter(field => snapshot.values[field.id]?.trim());
      const next = emptyStatuses();
      fields.forEach(field => { next[field.id] = { count: 0, message: `Checking Connection…`, checkedAt: ``, state: `checking` }; });
      setConnectionStatuses(next);
      const results = await Promise.all(fields.map(async field => {
        const controller = new AbortController();
        controllers.current.push(controller);
        try {
          const result = await getRegistrarDomains(field.id, snapshot.values[field.id], controller.signal);
          if (!current()) return empty;
          const latest = await connectionsAPI.getConnections(userId);
          if (!current()) return empty;
          if (latest.updated !== snapshot.updated || latest.values[field.id] !== snapshot.values[field.id]) throw new Error(`Connections Changed — Save Again To Sync`);
          const count = await api.syncRegistrarDomains(result.domains, userId, owner.current);
          if (!current()) return empty;
          await refreshDomains();
          if (!current()) return empty;
          const warnings = result.warnings?.map(message => `${field.label}: ${message}`) ?? [];
          setConnectionStatuses(previous => ({ ...previous, [field.id]: {
            count,
            state: `connected`,
            checkedAt: new Date().toISOString(),
            discoveredDomains: result.discoveredDomains,
            message: warnings.length ? `${count} Domain(s) Synced — ${warnings.join(`; `)}` : `${count} Domain(s) Synced`,
          } }));
          return { count, warnings, errors: [] };
        } catch (failure) {
          if (!current()) return empty;
          const message = failure instanceof Error ? failure.message : `Could Not Check Connection`;
          setConnectionStatuses(previous => ({ ...previous, [field.id]: { count: 0, message, state: `error`, checkedAt: new Date().toISOString() } }));
          return { count: 0, warnings: [], errors: [`${field.label}: ${message}`] };
        }
      }));
      if (!current()) return empty;
      const count = results.reduce((total, result) => total + result.count, 0);
      const errors = results.flatMap(result => result.errors);
      const warnings = results.flatMap(result => result.warnings);
      setSyncError(errors.join(`; `));
      if (fields.length && results.some(result => !result.errors.length)) setSyncNotice(`${errors.length ? `Partial Sync — ` : ``}${count} Domain(s) Synced${warnings.length ? ` — ${warnings.join(`; `)}` : ``}`);
      return { count, errors, warnings };
    } catch (failure) {
      if (!current()) return empty;
      const message = failure instanceof Error ? failure.message : `Could Not Load Connections`;
      setSyncError(message);
      return { count: 0, warnings: [], errors: [message] };
    }
  }, [userId, cancelRequests, refreshDomains]);

  useEffect(() => {
    active.current = true;
    void syncConnections();
    return () => { active.current = false; cancelRequests(); };
  }, [loginRevision, syncConnections, cancelRequests]);

  const syncing = Object.values(connectionStatuses).some(status => status.state === `checking`);
  return { syncing, syncError, syncNotice, syncConnections, clearSyncNotice, connectionStatuses, resetConnectionSync };
};
