import { useMemo, useCallback } from 'react';
import { useFeatureFlags } from '../featureFlags/useFeatureFlags';
import { getAppName, formatBrandText, formatBrandContent, getBrandedBlogImage } from './values';

export const useAppBrand = () => {
  const { flags, ready } = useFeatureFlags();
  const switched = ready && flags.nameSwitch;
  const name = getAppName(switched);
  const formatText = useCallback((text: string) => formatBrandText(text, name), [name]);
  const formatContent = useCallback(<Value>(value: Value) => formatBrandContent(value, name), [name]);
  const blogImage = useCallback((image: string) => getBrandedBlogImage(image, switched), [switched]);
  return useMemo(() => ({ name, switched, blogImage, formatText, formatContent, firstWord: switched ? `Domain` : `Domains`, lastWord: switched ? `Databases` : `Database` }), [name, switched, blogImage, formatText, formatContent]);
};
