import { Types } from '../../src/types/types';
import { getPublicProfileHref } from '../../src/shared/routes';
import { isAppCollectionID } from '../../src/shared/common/ids';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { sellerUsernamePattern, normalizeSellerUsername } from '../../src/shared/marketplace/paths';

export const generateStaticParams = () => [];

const PublicProfileRedirect = () => {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const profileKey = Array.isArray(id) ? id?.[0] ?? `` : id ?? ``;
  const username = normalizeSellerUsername(profileKey);
  const key = isAppCollectionID(profileKey, Types.User) ? profileKey : sellerUsernamePattern.test(username) ? username : null;
  return <Redirect href={key ? getPublicProfileHref(key) : `/404`} />;
};

export default PublicProfileRedirect;
