import PageMeta from '../src/components/PageMeta';
import DomainAuction from '../src/components/DomainAuction';
import StarterPlanGate from '../src/components/StarterPlanGate';

const AuctionPage = () => (
  <>
    <PageMeta title={`Domain Auction`} description={`Unlock GoDaddy auction listings, inventory filters, and domain research with Starter or a higher plan before visiting the provider to bid.`} />
    <StarterPlanGate feature={`auction`}>
      <DomainAuction />
    </StarterPlanGate>
  </>
);

export default AuctionPage;
