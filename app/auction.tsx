import PageMeta from '../src/components/PageMeta';
import DomainAuction from '../src/components/DomainAuction';

const AuctionPage = () => (
  <>
    <PageMeta title={`Domain Auction`} description={`Import free auction inventory, filter domain listings, and research domain statistics and source estimates.`} />
    <DomainAuction />
  </>
);

export default AuctionPage;
