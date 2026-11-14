import { api } from '../../api';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import type { DomainRecord } from '../../shared/types';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import { readDomainParkingMetrics } from '../../shared/domainParking/values';
import { fetchDomainParking } from '../../shared/domainParking/client';
import { normalizeDomainName } from '../../shared/domainUtils';
import { connectionInputValue } from '../../shared/connections/inputs';
import type { DomainParkingMetrics } from '../../shared/domainParking/types';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

type ParkingAccount = { id: string; number: number };
type ParkingView = { busy: boolean; error: string; accounts: ParkingAccount[]; result: DomainParkingMetrics | null; emptyCheck: DomainParkingMetrics | null };
const initial: ParkingView = { busy: false, error: ``, accounts: [], result: null, emptyCheck: null };

export const useDomainParking = (domain: DomainRecord) => {
  const { user, loading, loginRevision } = useAuth();
  const { revision, hasGoDaddyConnection } = useConnectionAvailability();
  const userId = !useLocalStorage && !loading && user?.active === true && !user.anonymous
    && user.role !== `Guest` && !domain.isSample && domain.uid === user.id ? user.id : null;
  const available = Boolean(userId && hasGoDaddyConnection);
  const saved = userId ? readDomainParkingMetrics(domain.meta?.goDaddyParking, domain.name) : undefined;
  const scope = `${userId ?? ``}:${loginRevision}:${revision}:${domain.id}:${domain.name}`;
  const current = useRef(scope);
  const pending = useRef<AbortController | null>(null);
  const [view, setView] = useState({ ...initial, scope });
  current.current = scope;

  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, [scope]);

  const lookup = async (selected?: string) => {
    if (!available || !userId || pending.current || current.current !== scope) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    pending.current = controller;
    const active = () => current.current === scope && pending.current === controller;
    setView(previous => ({ ...initial, scope, busy: true, result: previous.scope === scope ? previous.result : null }));
    try {
      const snapshot = await connectionsAPI.getConnections(userId);
      const accounts = snapshot.accounts.filter(account => account.provider === `godaddy`
        && connectionInputValue(account, `GODADDY_API_KEY`).trim() && connectionInputValue(account, `GODADDY_API_SECRET`).trim())
        .map(({ id, number }) => ({ id, number })).sort((left, right) => left.number - right.number);
      if (!active()) return;
      if (controller.signal.aborted) throw new Error(`Parking Metrics Request Timed Out`);
      const associated = accounts.find(account => account.id === domain.meta?.registrarConnectionId);
      const account = selected ? accounts.find(account => account.id === selected) : associated ?? (accounts.length === 1 ? accounts[0] : undefined);
      if (!account && !selected && accounts.length > 1) { setView(previous => ({ ...previous, busy: false, accounts })); return; }
      if (!account) throw new Error(`Save A GoDaddy Classic Key And Secret In Connections To Check Parking Metrics`);
      const result = await fetchDomainParking(domain.id, account.id, normalizeDomainName(domain.name), controller.signal);
      if (!active() || controller.signal.aborted) return;
      clearTimeout(timeout);
      await api.saveDomainParking(domain.id, domain.name, result, userId);
      if (active()) setView(previous => ({
        ...initial, scope,
        result: result.report || !previous.result?.report ? result : previous.result,
        emptyCheck: result.report ? null : result,
      }));
    } catch (failure) {
      if (active()) setView(previous => ({ ...previous, busy: false, error: controller.signal.aborted ? `Parking Metrics Request Timed Out`
        : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : `Could Not Reach GoDaddy Parking Metrics` }));
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  };

  const visible = userId && view.scope === scope ? view : initial;
  const latest = visible.result;
  const result = latest && (!saved || (!saved.report || latest.report) && Date.parse(latest.checkedAt) >= Date.parse(saved.checkedAt)) ? latest : saved ?? null;
  const notice = result?.report && visible.emptyCheck && Date.parse(visible.emptyCheck.checkedAt) >= Date.parse(result.checkedAt)
    ? `Latest GoDaddy Check Returned No Parking Data · ${new Date(visible.emptyCheck.checkedAt).toLocaleString()}` : ``;
  return { ...visible, result, notice, available, lookup };
};
