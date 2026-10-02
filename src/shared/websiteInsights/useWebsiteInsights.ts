import { api } from '../../api';
import { MAX_INSIGHT_DOMAINS } from './types';
import { getWebsiteInsights } from './client';
import type { DomainRecord } from '../types';
import { useAuth } from '../authContext/useAuth';
import { useCallback, useEffect, useRef, useState } from 'react';

const pause = (signal: AbortSignal) => new Promise<void>(resolve => {
  const finish = () => { clearTimeout(timer); signal.removeEventListener(`abort`, finish); resolve(); };
  const timer = setTimeout(finish, 1_100);
  signal.addEventListener(`abort`, finish, { once: true });
  if (signal.aborted) finish();
});

export const useWebsiteInsights = (refreshDomains: () => Promise<void>) => {
  const { user } = useAuth();
  const userId = user?.id;
  const active = useRef(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [insightError, setInsightError] = useState(``);
  const [insightNotice, setInsightNotice] = useState(``);
  const clearInsightError = useCallback(() => setInsightError(``), []);
  const clearInsightNotice = useCallback(() => setInsightNotice(``), []);

  useEffect(() => {
    active.current = true;
    revision.current += 1;
    setRefreshing(false);
    setInsightError(``);
    setInsightNotice(``);
    return () => { active.current = false; revision.current += 1; controller.current?.abort(); controller.current = null; };
  }, [userId]);

  const refreshWebsiteInsights = useCallback(async (records: DomainRecord[]) => {
    if (!userId || !active.current || controller.current) return;
    const currentController = new AbortController();
    const run = ++revision.current;
    const current = () => active.current && revision.current === run && !currentController.signal.aborted;
    controller.current = currentController;
    const domains = [...new Map(records.map(domain => [domain.id, domain])).values()];
    const chosen = domains.slice(0, MAX_INSIGHT_DOMAINS);
    const remaining = domains.length - chosen.length;
    const errors: string[] = [];
    let checked = 0;
    setRefreshing(true);
    setInsightError(``);
    setInsightNotice(``);
    try {
      for (const [index, domain] of chosen.entries()) {
        if (!current()) return;
        try {
          const insights = await getWebsiteInsights(domain.name, currentController.signal);
          if (!current()) return;
          await api.saveWebsiteInsights(domain.id, domain.name, insights, userId);
          if (!current()) return;
          checked += 1;
          errors.push(...insights.errors.map(message => `${domain.name}: ${message}`));
          await refreshDomains();
        } catch (failure) {
          if (!current()) return;
          errors.push(`${domain.name}: ${failure instanceof Error ? failure.message : `Website Insights Unavailable`}`);
        }
        if (current() && index < chosen.length - 1) await pause(currentController.signal);
      }
      if (!current()) return;
      setInsightError(errors.join(`; `));
      setInsightNotice(`${checked} Website(s) Checked${errors.length ? ` — Some Insights Unavailable` : ``}${remaining ? ` — ${remaining} More Domain(s) Remain` : ``}`);
    } finally {
      if (controller.current === currentController) controller.current = null;
      if (current()) setRefreshing(false);
    }
  }, [userId, refreshDomains]);

  return { refreshing, insightError, insightNotice, clearInsightError, clearInsightNotice, refreshWebsiteInsights };
};
