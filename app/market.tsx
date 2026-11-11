import PageMeta from '../src/components/PageMeta';
import AuctionTabs from '../src/components/AuctionTabs';
import DomainMarket from '../src/components/DomainMarket';

const MarketPage = () => (
  <>
    <PageMeta title={`Domain Marketplace`} description={`Browse domains for sale, contact sellers, and make offers`} />
    <DomainMarket />
    <AuctionTabs activeTab={`markets`} />
  </>
);

export default MarketPage;
