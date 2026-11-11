import type { MarketView } from '../../shared/marketRoutes';

export const marketViews = {
  browse: {
    label: `Browse`,
    title: `Buy and sell domains.`,
    description: `Browse verified names, make an offer, or list a domain you own.`,
  },
  sell: {
    label: `Sell`,
    title: `Sell your domains.`,
    description: `Set up your seller profile and manage your domain listings.`,
  },
  inbox: {
    label: `Messages`,
    title: `Offers and messages.`,
    description: `Talk with buyers and sellers and keep track of your offers.`,
  },
  orders: {
    label: `Orders`,
    title: `Your domain orders.`,
    description: `Track your purchases and sales from payment to domain transfer.`,
  },
} satisfies Record<MarketView, { label: string; title: string; description: string }>;
