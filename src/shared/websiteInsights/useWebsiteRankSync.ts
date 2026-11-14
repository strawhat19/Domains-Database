import { api } from '../../api';
import { getWebsiteRanks } from './client';
import { MAX_INSIGHT_DOMAINS } from './types';
import { getDomainSource } from '../domainUtils';
import { useCallback, useEffect, useRef } from 'react';
import { subscribeAccountDataReset } from '../accountData/state';
import { getWebsiteInsightDomain, normalizeWebsiteInsights } from './values';

const RANK_FRESHNESS_MS = 86_400_000;

export const useWebsiteRankSync = (userId: string | undefined, actorKey: string, enabled: boolean, refreshDomains: () => Promise<void>) => {
  const active = useRef(false);
  const currentActor = useRef(actorKey);
  const controller = useRef<AbortController | null>(null);
  const attempted = useRef(new Set<string>());
  currentActor.current = actorKey;
  if (!enabled) active.current = false;

  useEffect(() => {
    const cancel = () => {
      active.current = false;
      controller.current?.abort();
      controller.current = null;
      attempted.current.clear();
    };
    active.current = enabled;
    const unsubscribe = subscribeAccountDataReset(changedUserId => { if (changedUserId === userId) cancel(); });
    return () => { unsubscribe(); cancel(); };
  }, [enabled, userId, actorKey]);

  return useCallback(async () => {
    if (!userId || !active.current || currentActor.current !== actorKey || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    const current = () => active.current && currentActor.current === actorKey && !request.signal.aborted;
    try {
      const records = await api.getDomains();
      if (!current()) return;
      const cutoff = Date.now() - RANK_FRESHNESS_MS;
      const candidates = records.flatMap(record => {
        const domain = getWebsiteInsightDomain(record.name);
        if (!domain || record.isSample || getDomainSource(record) !== `registrar`
          || (record.meta?.externalRegistration === true && record.meta?.ownershipConfirmed !== true)) return [];
        let checkedAt = 0;
        if (record.meta?.websiteInsights) {
          try { checkedAt = Date.parse(normalizeWebsiteInsights(record.meta.websiteInsights, domain).trancoCheckedAt ?? ``) || 0; }
          catch { /* An earlier invalid record has no confirmed check date. */ }
        }
        return checkedAt < cutoff ? [{ record, domain, checkedAt }] : [];
      }).sort((first, second) => first.checkedAt - second.checkedAt || first.domain.localeCompare(second.domain));
      if (!candidates.length) return;
      if (candidates.every(({ domain }) => attempted.current.has(domain))) attempted.current.clear();
      const selected = new Map(candidates.filter(({ domain }) => !attempted.current.has(domain))
        .slice(0, MAX_INSIGHT_DOMAINS).map(({ domain, record }) => [domain, record]));
      const ranks = await getWebsiteRanks([...selected.keys()], request.signal);
      if (!current()) return;
      const matches = ranks.flatMap(rank => {
        const record = selected.get(rank.domain);
        return record ? [{ id: record.id, name: record.name, insights: rank }] : [];
      });
      if (!current()) return;
      const saved = matches.length > 0 && await api.saveWebsiteRanks(matches, userId);
      if (!current()) return;
      for (const domain of selected.keys()) attempted.current.add(domain);
      if (saved) await refreshDomains();
    } catch { /* Website rank checks are independent of registrar sync status. */ }
    finally { if (controller.current === request) controller.current = null; }
  }, [userId, actorKey, refreshDomains]);
};
