import Community from '../src/components/Community';
import PageMeta from '../src/components/PageMeta';
import { CommunityProvider } from '../src/shared/social/SocialContext';

const CommunityRoute = () => (
  <CommunityProvider>
    <PageMeta title={`Community`} description={`Public profiles, shared domains, and updates from people you follow`} />
    <Community />
  </CommunityProvider>
);

export default CommunityRoute;
