import { routes } from '../../shared/routes';

export const auctionTabs = [
  { id: `markets`, beta: false, label: `Markets`, href: routes.market.href },
  { id: `auctions`, beta: true, label: routes.auction.label, href: routes.auction.href },
] as const;

export type AuctionTab = (typeof auctionTabs)[number][`id`];

