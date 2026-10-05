import { auctionSources, auctionTypes, auctionEndOptions } from '../../shared/domainAuction/values';

export const auctionSelectFields = [
  { key: `type`, label: `Auction Type`, allLabel: `All Types`, options: auctionTypes },
  { key: `source`, label: `Auction Source`, allLabel: `All Sources`, options: auctionSources },
  { key: `endsWithin`, label: `Ending Within`, allLabel: `Any Time`, options: auctionEndOptions },
] as const;

export const auctionTableHeadings = [
  { id: `domain`, label: `Domain` },
  { id: `source`, label: `Source / Type` },
  { id: `price`, label: `Price (USD)` },
  { id: `bids`, label: `Bids` },
  { id: `ends`, label: `Ends` },
  { id: `age`, label: `Age` },
  { id: `actions`, label: `Actions` },
] as const;

export const auctionInventoryHref = `https://inventory.auctions.godaddy.com/`;
export const auctionInventoryGuideHref = `https://www.godaddy.com/en-ca/help/download-inventory-files-for-godaddy-auctions-41284`;
