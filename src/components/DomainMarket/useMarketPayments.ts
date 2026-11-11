import { useEffect, useRef, useState } from 'react';
import { marketError } from './useDomainMarket';
import type { MarketplaceOrder, MarketplaceOrderSide, MarketplacePayoutStatus } from '../../shared/marketplace/paymentTypes';
import { cancelMarketplaceCheckout, getMarketplaceOrder, getMarketplacePayoutStatus, listMarketplaceOrders, openMarketplacePayoutDashboard, openMarketplacePayoutSetup, openMarketplaceStripeUrl, startMarketplaceCheckout } from '../../api/marketplacePayments';

export const marketCheckoutUnavailable = `Online Checkout Is Currently Unavailable`;
export const marketCheckoutSandbox = `Stripe Sandbox · Test Payments Only`;

export const useMarketCheckout = () => {
  const [error, setError] = useState(``);
  const [pending, setPending] = useState(false);
  const checkout = async (listingId: string, offerId?: string) => {
    if (pending) return;
    setPending(true);
    setError(``);
    try {
      const result = await startMarketplaceCheckout(listingId, offerId);
      if (result.url) await openMarketplaceStripeUrl(result.url);
      return result.order;
    } catch (failure) { setError(marketError(failure)); }
    finally { setPending(false); }
  };
  return { error, pending, checkout };
};

export const useMarketPayouts = (enabled: boolean) => {
  const [status, setStatus] = useState<MarketplacePayoutStatus | null>(null);
  const [error, setError] = useState(``);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision(current => current + 1);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setError(``);
    void getMarketplacePayoutStatus(controller.signal).then(result => {
      if (!controller.signal.aborted) setStatus(result);
    }, failure => { if (!controller.signal.aborted) setError(marketError(failure)); });
    return () => controller.abort();
  }, [enabled, revision]);
  const open = async (operation: typeof openMarketplacePayoutSetup) => {
    if (pending) return;
    setPending(true);
    setError(``);
    try { await openMarketplaceStripeUrl((await operation()).url); }
    catch (failure) { setError(marketError(failure)); }
    finally { setPending(false); }
  };
  return { status, error, pending, reload, openSetup: () => open(openMarketplacePayoutSetup), openDashboard: () => open(openMarketplacePayoutDashboard) };
};

const emptyHistory = (scope: string) => ({ scope, orders: [] as MarketplaceOrder[], error: ``, loading: true });

export const useMarketOrders = (accountId: string, orderId?: string) => {
  const [side, setSide] = useState<MarketplaceOrderSide>(`buying`);
  const historyScope = `${accountId}:${side}`;
  const orderScope = orderId ? `${accountId}:${orderId}` : ``;
  const [history, setHistory] = useState(() => emptyHistory(historyScope));
  const [detail, setDetail] = useState<{ scope: string; order: MarketplaceOrder | null; error: string; loading: boolean } | null>(null);
  const [actionError, setActionError] = useState(``);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const focusedOrder = useRef(``);
  const reload = () => { setActionError(``); setRevision(current => current + 1); };
  useEffect(() => {
    const controller = new AbortController();
    setHistory(emptyHistory(historyScope));
    void listMarketplaceOrders(side, controller.signal).then(orders => {
      if (!controller.signal.aborted) setHistory({ scope: historyScope, orders, error: ``, loading: false });
    }, failure => {
      if (!controller.signal.aborted) setHistory({ scope: historyScope, orders: [], error: marketError(failure), loading: false });
    });
    return () => controller.abort();
  }, [historyScope, side, revision]);

  useEffect(() => {
    if (!orderId) { focusedOrder.current = ``; return; }
    const controller = new AbortController();
    setDetail(current => ({ scope: orderScope, order: current?.scope === orderScope ? current.order : null, error: ``, loading: true }));
    void getMarketplaceOrder(orderId, controller.signal).then(order => {
      if (controller.signal.aborted) return;
      setDetail({ scope: orderScope, order, error: ``, loading: false });
      if (focusedOrder.current !== orderScope) {
        focusedOrder.current = orderScope;
        setSide(order.buyerId === accountId ? `buying` : `selling`);
      }
    }, failure => {
      if (!controller.signal.aborted) setDetail({ scope: orderScope, order: null, error: marketError(failure), loading: false });
    });
    return () => controller.abort();
  }, [accountId, orderId, orderScope, revision]);

  const current = history.scope === historyScope ? history : emptyHistory(historyScope);
  const selection = detail?.scope === orderScope ? detail : null;
  const orderLoading = Boolean(orderId && (!selection || selection.loading));
  const selected = selection?.order;
  const pinned = selected && side === (selected.buyerId === accountId ? `buying` : `selling`) ? selected : null;
  const orders = pinned ? [pinned, ...current.orders.filter(order => order.id !== pinned.id)] : current.orders;

  const run = async (operation: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    setActionError(``);
    try { await operation(); reload(); } catch (failure) { setActionError(marketError(failure)); }
    finally { setPending(false); }
  };
  return { side, setSide, orders, pending, reload, orderLoading, loading: current.loading, error: actionError || current.error, orderError: selection?.error ?? ``,
    cancel: (id: string) => run(async () => { await cancelMarketplaceCheckout(id); }),
    resume: (order: MarketplaceOrder) => run(async () => {
      const result = await startMarketplaceCheckout(order.listingId, order.offerId ?? undefined);
      if (result.url) await openMarketplaceStripeUrl(result.url);
    }),
  };
};
