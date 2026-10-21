import PageMeta from '../src/components/PageMeta';
import DomainAuction from '../src/components/DomainAuction';

const AuctionPage = () => (
  <>
    <PageMeta title={`Domain Auction`} description={`Load free GoDaddy auction listings, filter shared inventory snapshots, and research domains before visiting the provider to bid.`} />
    <DomainAuction />
  </>
);

export default AuctionPage;
