import { routes } from '../src/shared/routes';
import Community from '../src/components/Community';
import PageMeta from '../src/components/PageMeta';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { CommunityProvider } from '../src/shared/social/SocialContext';

const CommunityRoute = () => (
  <>
    <PageMeta title={`Community`} description={`Public profiles, shared domains, and updates from people you follow`} />
    <ProtectedRoute minRole={routes.community.minRole}>
      <CommunityProvider>
        <Community />
      </CommunityProvider>
    </ProtectedRoute>
  </>
);

export default CommunityRoute;
