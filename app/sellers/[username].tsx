import { Redirect, useLocalSearchParams } from 'expo-router';
import { sellerProfilePath, sellerUsernamePattern, normalizeSellerUsername } from '../../src/shared/marketplace/paths';

export const generateStaticParams = () => [];

const SellerProfileRedirect = () => {
  const { username } = useLocalSearchParams<{ username?: string | string[] }>();
  const value = normalizeSellerUsername(Array.isArray(username) ? username?.[0] ?? `` : username ?? ``);
  return <Redirect href={sellerUsernamePattern.test(value) ? sellerProfilePath(value) : `/404`} />;
};

export default SellerProfileRedirect;
