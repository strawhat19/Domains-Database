import { useContext } from 'react';
import { FeatureFlagsContext } from './FeatureFlagsContext';

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error(`Use Features Inside Features Provider`);
  return context;
};
