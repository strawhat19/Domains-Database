import { useContext } from 'react';
import { SocialContext } from './SocialContext';

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error(`useSocial Must Be Used Inside CommunityProvider`);
  return context;
};
