import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../../shared/config';
import { connectionsAPI } from '../../api/connections';
import { useAuth } from '../../shared/authContext/useAuth';
import type { LiveAuction } from '../../shared/domainAuction/live';
import { connectionInputValue } from '../../shared/connections/inputs';
import { checkLiveAuction } from '../../shared/domainAuction/liveClient';
import { useConnectionAvailability } from '../../shared/connections/useConnectionAvailability';

type AuctionLookupAccount = { id: string; number: number };
type AuctionLookupView = { busy: boolean; error: string; accounts: AuctionLookupAccount[]; result: LiveAuction | null };
const initial: AuctionLookupView = { busy: false, error: ``, accounts: [], result: null };

export const useLiveAuction = (domain: string, supported: boolean) => {
  const { user, loading, loginRevision } = useAuth();
  const { revision } = useConnectionAvailability();
  const viewer = !loading && user?.active === true && !user.anonymous && user.role === `Owner` && !useLocalStorage ? user.id : null;
  const available = supported && Boolean(viewer);
  const scope = `${viewer ?? ``}:${loginRevision}:${revision}:${domain}`;
  const current = useRef(scope);
  const pending = useRef<AbortController | null>(null);
  const [view, setView] = useState({ ...initial, scope });
  current.current = scope;

  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, [scope]);

  const lookup = async (selected?: string) => {
    if (!available || !viewer || pending.current || current.current !== scope) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    pending.current = controller;
    const active = () => current.current === scope && pending.current === controller;
    setView({ ...initial, scope, busy: true });
    try {
      const options = (await connectionsAPI.getConnections(viewer)).accounts.filter(account => account.provider === `godaddy`
        && connectionInputValue(account, `GODADDY_API_KEY`).trim() && connectionInputValue(account, `GODADDY_API_SECRET`).trim())
        .map(({ id, number }) => ({ id, number })).sort((left, right) => left.number - right.number);
      if (!active()) return;
      if (controller.signal.aborted) throw new Error(`Live Auction Lookup Timed Out`);
      if (!options.length) throw new Error(`Save A GoDaddy Classic API Key And Secret In Connections To Check Live Auctions`);
      if (!selected && options.length > 1) { setView({ ...initial, scope, accounts: options }); return; }
      const account = selected ? options.find(option => option.id === selected) : options[0];
      if (!account) throw new Error(`This Saved GoDaddy Connection Is Unavailable`);
      const result = await checkLiveAuction(domain, account.id, controller.signal);
      if (active()) setView({ ...initial, scope, result });
    } catch (failure) {
      if (active()) setView({ ...initial, scope, error: controller.signal.aborted ? `Live Auction Lookup Timed Out`
        : failure instanceof Error && !(failure instanceof TypeError) ? failure.message : `Could Not Reach Live Auction Lookup` });
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  };
  return { ...(available && view.scope === scope ? view : initial), available, lookup };
};
