import { useEffect, useRef, useState } from 'react';
import { normalizeDomainName } from '../../shared/domainUtils';
import { requestMarketplaceAfternic } from '../../shared/marketplaceAfternic/client';
import type { AfternicAccountStats, AfternicActivityRange, AfternicDomainStats, AfternicSalesPage } from '../../shared/marketplaceAfternic/activity';

const errorMessage = (failure: unknown, fallback: string) => failure instanceof Error ? failure.message : fallback;

export const useAfternicActivity = () => {
  const [days, setDays] = useState<AfternicActivityRange>(30);
  const [domain, setDomain] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState(``);
  const [stats, setStats] = useState<AfternicAccountStats | null>(null);
  const [sales, setSales] = useState<AfternicSalesPage | null>(null);
  const [statsError, setStatsError] = useState(``);
  const [salesError, setSalesError] = useState(``);
  const [busy, setBusy] = useState(false);
  const [domainStats, setDomainStats] = useState<AfternicDomainStats | null>(null);
  const [domainStatsBusy, setDomainStatsBusy] = useState(false);
  const [domainStatsError, setDomainStatsError] = useState(``);
  const pending = useRef<AbortController | null>(null);
  const pendingDomain = useRef<AbortController | null>(null);

  useEffect(() => () => {
    pending.current?.abort(); pending.current = null;
    pendingDomain.current?.abort(); pendingDomain.current = null;
  }, []);

  const load = async (range: AfternicActivityRange, page?: AfternicSalesPage, nextDomain = domain) => {
    if (page && (pending.current || page.nextOffset === null)) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const current = () => pending.current === controller && !controller.signal.aborted;
    if (days !== range) { setDays(range); setStats(null); setSales(null); setDomainStats(null); }
    const filterChanged = nextDomain !== domain;
    if (filterChanged) { setDomain(nextDomain); setSales(null); setDomainStats(null); }
    if (filterChanged || days !== range) {
      pendingDomain.current?.abort(); pendingDomain.current = null;
      setDomainStatsBusy(false); setDomainStatsError(``);
    }
    setBusy(true);
    setSalesError(``);
    if (!page) setStatsError(``);
    const { signal } = controller;
    const requests = [requestMarketplaceAfternic(`sales`, {
      days: range, offset: page?.nextOffset ?? 0, through: page?.through ?? null, ...(nextDomain ? { domain: nextDomain } : {}),
    }, signal).then(value => {
      if (!current()) return;
      if ((value.domain ?? null) !== nextDomain || nextDomain && value.sales.some(sale => sale.domain !== nextDomain)) throw new Error(`Afternic Sales Filter Could Not Be Confirmed`);
      if (!page) { setSales(value); return; }
      if (value.through !== page.through || page.total !== null && value.total !== null && page.total !== value.total
        || value.nextOffset !== null && page.nextOffset !== null && value.nextOffset <= page.nextOffset) throw new Error(`Afternic Sales Changed — Refresh The Report`);
      const seen = new Set(page.sales.map(sale => sale.id));
      const additions = value.sales.filter(sale => !seen.has(sale.id));
      setSales({ ...value, skipped: page.skipped + value.skipped + value.sales.length - additions.length, sales: [...page.sales, ...additions] });
    }).catch(failure => {
      if (current()) setSalesError(errorMessage(failure, `Afternic Sales Could Not Be Loaded`));
    })];
    if (!page && (!filterChanged || days !== range || !stats)) requests.push(requestMarketplaceAfternic(`stats`, { days: range }, signal).then(value => {
      if (current()) setStats(value);
    }).catch(failure => {
      if (current()) setStatsError(errorMessage(failure, `Afternic Account Stats Could Not Be Loaded`));
    }));
    await Promise.all(requests);
    if (current()) { pending.current = null; setBusy(false); }
  };

  const loadDomainStats = async () => {
    if (!domain || pendingDomain.current) return;
    const controller = new AbortController();
    pendingDomain.current = controller;
    setDomainStatsBusy(true);
    setDomainStatsError(``);
    try {
      const result = await requestMarketplaceAfternic(`domainStats`, { days, domain }, controller.signal);
      if (pendingDomain.current !== controller || controller.signal.aborted) return;
      if (result.domain !== domain) throw new Error(`Afternic Domain Metrics Could Not Be Confirmed`);
      setDomainStats(result);
    } catch (failure) {
      if (pendingDomain.current === controller && !controller.signal.aborted) setDomainStatsError(errorMessage(failure, `Afternic Domain Metrics Could Not Be Loaded`));
    } finally {
      if (pendingDomain.current === controller) { pendingDomain.current = null; setDomainStatsBusy(false); }
    }
  };

  const filterSales = () => {
    const input = domainInput.trim();
    let name: string | null = null;
    try { if (input) name = normalizeDomainName(input); }
    catch { setSalesError(`Enter A Full Domain Name To Filter Sales`); return; }
    void load(days, undefined, name);
  };
  const clearSalesFilter = () => { setDomainInput(``); void load(days, undefined, null); };

  return { days, stats, sales, statsError, salesError, busy, load, domain, domainInput, domainStats, domainStatsBusy, domainStatsError, loadDomainStats, setDomainInput, filterSales, clearSalesFilter };
};
