import { getAuctionPreview } from '../shared/domainAuction/preview';
import { getAuctionListings, importAuctionInventory, clearAuctionInventory, subscribeAuctionListings } from '../shared/domainAuction/storage';

export const domainAuctionAPI = {
  getListings: getAuctionListings,
  subscribeListings: subscribeAuctionListings,
  importInventory: importAuctionInventory,
  clearInventory: clearAuctionInventory,
  getPreview: async () => getAuctionPreview(),
};
