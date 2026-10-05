import { getAuctionPreview } from '../shared/domainAuction/preview';
import { getAuctionListings, importAuctionInventory, clearAuctionInventory } from '../shared/domainAuction/storage';

export const domainAuctionAPI = {
  getListings: getAuctionListings,
  importInventory: importAuctionInventory,
  clearInventory: clearAuctionInventory,
  getPreview: async () => getAuctionPreview(),
};
