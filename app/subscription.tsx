import PageMeta from '../src/components/PageMeta';
import SubscriptionFlow from '../src/components/SubscriptionFlow';

const SubscriptionRoute = () => <>
  <PageMeta noIndex title={`Review Your Subscription`} canonicalPath={`/subscription`} description={`Review your selected plan and prepare your subscription`} />
  <SubscriptionFlow />
</>;

export default SubscriptionRoute;
