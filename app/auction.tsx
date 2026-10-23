import PageMeta from '../src/components/PageMeta';
import DomainAuction from '../src/components/DomainAuction';
import StarterPlanGate from '../src/components/StarterPlanGate';

const AuctionPage = () => (
  <>
    <PageMeta noIndex title={`Domain Auction Preview`} description={`Domain auctions are planned. The working preview is available to the Owner.`} />
    <StarterPlanGate feature={`auction`}>
      <DomainAuction />
    </StarterPlanGate>
  </>
);

export default AuctionPage;
