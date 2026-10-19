import { useMemo } from 'react';
import { pageContent } from '../../shared/pages';
import { useAppBrand } from '../../shared/branding/useAppBrand';

export const aboutSectionIcons = [`Layers3`, `Link2`, `Search`, `SlidersHorizontal`, `ShieldCheck`] as const;

export const useAbout = () => {
  const { formatContent } = useAppBrand();
  return useMemo(() => formatContent(pageContent.about), [formatContent]);
};
