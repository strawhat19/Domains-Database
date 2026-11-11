import { parse } from 'tldts';
import { api } from '../../../api';
import { Roles } from '../../../types/types';
import { useMemo, useState, useEffect } from 'react';
import type { DomainRecord } from '../../../shared/types';
import { useAuth } from '../../../shared/authContext/useAuth';
import { getDomainStatus } from '../../../shared/domainUtils';
import { useDomains } from '../../../shared/domainContext/useDomains';
import { getListingFields, type SuggestedListingFields } from '../listingFields';
import { getPortfolioColumnDisplay } from '../../../shared/portfolioColumns';

export type { SuggestedListingFields } from '../listingFields';

export interface ListingSuggestionsProps {
  disabled?: boolean;
  variant?: `browse` | `sell`;
  dismissedIds: readonly string[];
  onDismiss: (id: string) => void;
  onSelect: (domain: string, fields: SuggestedListingFields) => void;
  excludedDomains?: readonly string[];
}

const suggestionLimit = 24;
const emptyDomains: DomainRecord[] = [];
type PortfolioResult = { scope: string; records: DomainRecord[]; failed: boolean };

export const useListingSuggestions = (excludedDomains: readonly string[] | undefined, dismissedIds: readonly string[]) => {
  const { user, loginRevision, loading: authLoading } = useAuth();
  const portfolio = useDomains();
  const accountId = !authLoading && user?.active && !user.anonymous && user.role !== Roles.Guest ? user.id : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const scope = accountId ? `${accountId}:${loginRevision}:${attempt}` : ``;
  const useFallback = Boolean(scope && !portfolio.loading && (!portfolio.loaded || (portfolio.error && !portfolio.domains.length)));
  const fallback = result?.scope === scope ? result : null;
  const domains = useFallback ? fallback?.records ?? emptyDomains : portfolio.domains;
  const loading = Boolean(accountId && (portfolio.loading || (useFallback && !fallback)));
  const failed = useFallback && fallback?.failed === true;

  useEffect(() => {
    if (!useFallback || !accountId) return;
    let active = true;
    const onError = () => {
      if (active) setResult({ scope, records: emptyDomains, failed: true });
    };
    try {
      const unsubscribe = api.subscribeDomains(records => {
        if (active) setResult({ scope, records, failed: false });
      }, onError);
      return () => { active = false; unsubscribe(); };
    } catch { onError(); }
  }, [accountId, scope, useFallback]);

  const ranked = useMemo(() => {
    if (!accountId || loading) return [];
    const excluded = new Set(excludedDomains?.map(name => name.trim().toLowerCase().replace(/\.$/, ``)));
    return domains.flatMap(domain => {
      const { id, name } = domain;
      if (domain.uid !== accountId || domain.isSample || excluded.has(name) || getDomainStatus(domain) === `Expired`) return [];
      const parsed = parse(name, { allowPrivateDomains: false });
      if (!parsed.isIcann || parsed.domain !== name) return [];
      const { fields, currency, estimate } = getListingFields(domain);
      return [{ id, name, fields, currency, estimate, starred: domain.starred === true, estimateLabel: estimate === null ? null : getPortfolioColumnDisplay(domain, `estimatedValue`) }];
    }).sort((first, second) => {
      if (first.estimate !== null && second.estimate !== null) {
        if (first.currency === second.currency) return second.estimate - first.estimate || first.name.localeCompare(second.name);
        return Number(second.currency === `USD`) - Number(first.currency === `USD`) || first.currency.localeCompare(second.currency);
      }
      return Number(second.estimate !== null) - Number(first.estimate !== null)
        || Number(second.starred) - Number(first.starred) || first.name.localeCompare(second.name);
    });
  }, [accountId, domains, excludedDomains, loading]);

  const { suggestions, hasDismissedSuggestions } = useMemo(() => {
    const visible = ranked.slice(0, suggestionLimit);
    const dismissed = new Set<string>();
    let nextIndex = visible.length;
    // Replay dismissals in order so a replacement occupies the dismissed card's slot.
    for (const id of dismissedIds) {
      dismissed.add(id);
      const slot = visible.findIndex(suggestion => suggestion.id === id);
      if (slot < 0) continue;
      while (ranked[nextIndex] && dismissed.has(ranked[nextIndex].id)) nextIndex += 1;
      const next = ranked[nextIndex++];
      if (next) visible[slot] = next;
      else visible.splice(slot, 1);
    }
    return { suggestions: visible, hasDismissedSuggestions: ranked.some(suggestion => dismissed.has(suggestion.id)) };
  }, [ranked, dismissedIds]);

  return { suggestions, loading, failed, hasDismissedSuggestions, retry: () => setAttempt(current => current + 1) };
};
