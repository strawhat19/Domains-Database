import Community from '../src/components/Community';
import { useLocalSearchParams } from 'expo-router';
import PageMeta from '../src/components/PageMeta';
import { Types } from '../src/types/types';
import { isAppCollectionID } from '../src/shared/common/ids';
import { CommunityProvider } from '../src/shared/social/SocialContext';

const CommunityRoute = () => {
  const params = useLocalSearchParams<{ profile?: string | string[] }>();
  const candidate = Array.isArray(params.profile) ? params.profile[0] : params.profile;
  const profileId = isAppCollectionID(candidate, Types.User) ? candidate : undefined;
  return (
  <>
    <PageMeta title={`Community`} description={`Discover public domain portfolios, follow builders, share updates, and grow your contribution level`} />
    <CommunityProvider profileId={profileId}>
      <Community />
    </CommunityProvider>
  </>
  );
};

export default CommunityRoute;
