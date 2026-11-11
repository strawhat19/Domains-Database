import { Types } from '../../src/types/types';
import { useLocalSearchParams } from 'expo-router';
import PublicProfile from '../../src/components/PublicProfile';
import SellerProfile from '../../src/components/SellerProfile';
import { isAppCollectionID } from '../../src/shared/common/ids';

export const generateStaticParams = () => [];

const PublicProfilePage = () => {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const profileKey = Array.isArray(id) ? id?.[0] ?? `` : id ?? ``;
  return isAppCollectionID(profileKey, Types.User) ? <PublicProfile id={profileKey} /> : <SellerProfile username={profileKey} />;
};

export default PublicProfilePage;
