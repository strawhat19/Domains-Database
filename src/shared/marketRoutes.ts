import { routes } from './routes';
import { isAppCollectionID } from './common/ids';

const recordParam = (value: unknown, type: `MarketListing` | `MarketOrder`) => typeof value === `string`
  && value.length <= 250
  && !/[\u0000-\u001f\u007f/\\]/.test(value)
  && isAppCollectionID(value, type) ? value : undefined;

export type MarketView = `browse` | `sell` | `inbox` | `orders`;
export type MarketSearchParams = Partial<Record<`tab` | `listing` | `sellDomain` | `marketplaceView` | `marketplaceOrder` | `marketplacePayout` | `marketplaceCheckout`, string | string[]>>;

const marketViewParam = (value: unknown): MarketView | undefined => value === `browse` || value === `sell` || value === `inbox` || value === `orders` ? value : undefined;
const sellDomainParam = (value: unknown) => {
  if (typeof value !== `string` || value.length > 253) return undefined;
  const domain = value.trim();
  const labels = domain.replace(/\.$/, ``).split(`.`);
  return labels.length > 1 && labels.every(label => /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u.test(label)) ? domain : undefined;
};

export const getMarketRouteParams = (input: MarketSearchParams) => {
  const sellDomain = sellDomainParam(input.sellDomain);
  const listing = recordParam(input.listing, `MarketListing`);
  const marketplaceView = marketViewParam(input.marketplaceView);
  const marketplaceOrder = recordParam(input.marketplaceOrder, `MarketOrder`);
  const marketplacePayout = input.marketplacePayout === `return` || input.marketplacePayout === `refresh` ? input.marketplacePayout : undefined;
  return {
    ...(listing ? { listing } : {}),
    ...(sellDomain ? { sellDomain } : {}),
    ...(marketplaceView ? { marketplaceView } : {}),
    ...(marketplaceOrder ? { marketplaceOrder } : {}),
    ...(marketplacePayout ? { marketplacePayout } : {}),
    ...(input.marketplaceCheckout === `cancelled` ? { marketplaceCheckout: `cancelled` as const } : {}),
  };
};

export const getLegacyMarketRouteParams = (input: MarketSearchParams) => {
  if (input.tab === `auctions`) return undefined;
  const params = getMarketRouteParams(input);
  return input.tab === `markets` || Object.keys(params).length > 0 ? params : undefined;
};

export const getMarketAuthParams = (params: ReturnType<typeof getMarketRouteParams>, view: MarketView) => ({
  marketplaceView: view,
  returnTo: routes.market.href,
  ...(view === `browse` && params.listing ? { listing: params.listing } : {}),
  ...(view === `sell` && params.sellDomain ? { sellDomain: params.sellDomain } : {}),
  ...(view === `sell` && params.marketplacePayout ? { marketplacePayout: params.marketplacePayout } : {}),
  ...(view === `orders` && params.marketplaceOrder ? { marketplaceOrder: params.marketplaceOrder } : {}),
});
export type MarketAuthParams = ReturnType<typeof getMarketAuthParams>;
