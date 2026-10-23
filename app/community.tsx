import { Types } from '../src/types/types';
import PageMeta from '../src/components/PageMeta';
import { useLocalSearchParams } from 'expo-router';
import Community from '../src/components/Community';
import { isAppCollectionID } from '../src/shared/common/ids';
import StarterPlanGate from '../src/components/StarterPlanGate';
import { CommunityProvider } from '../src/shared/social/SocialContext';

const CommunityRoute = () => {
  const params = useLocalSearchParams<{ profile?: string | string[] }>();
  const candidate = Array.isArray(params.profile) ? params.profile?.[0] : params.profile;
  const profileId = isAppCollectionID(candidate, Types.User) ? candidate : undefined;
  return (
  <>
    <PageMeta title={`Community`} description={`Discover public domain portfolios, follow builders, share updates, and grow your contribution level`} />
    <StarterPlanGate feature={`community`}>
      <CommunityProvider profileId={profileId}>
        <Community />
      </CommunityProvider>
    </StarterPlanGate>
  </>
  );
};

export default CommunityRoute;
