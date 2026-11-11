import { Redirect } from 'expo-router';
import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AuctionTabs from '../src/components/AuctionTabs';
import DomainAuction from '../src/components/DomainAuction';
import StarterPlanGate from '../src/components/StarterPlanGate';
import { useLegacyMarketRouteParams } from '../src/shared/marketplace/useMarketRouteParams';

const AuctionPage = () => {
  const marketParams = useLegacyMarketRouteParams();
  if (marketParams) return <Redirect href={{ params: marketParams, pathname: routes.market.href }} />;
  return (
    <>
      <PageMeta noIndex title={`Domain Auction Preview`} description={`Domain auctions are planned. The working preview is available to the Owner.`} />
      <StarterPlanGate feature={`auction`}><DomainAuction /></StarterPlanGate>
      <AuctionTabs activeTab={`auctions`} />
    </>
  );
};

export default AuctionPage;
