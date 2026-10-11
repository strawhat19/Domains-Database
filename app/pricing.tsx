import Pricing from '../src/components/Pricing';
import PageMeta from '../src/components/PageMeta';

const PricingRoute = () => <>
  <PageMeta title={`Plans And Pricing`} canonicalPath={`/pricing`} description={`Explore Domains Database plans, prices, and portfolio features`} />
  <Pricing />
</>;

export default PricingRoute;
