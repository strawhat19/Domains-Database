import { useState } from 'react';

export const useDomainSiteIcon = (sourceUrls: string[]) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sourceUrl = sourceUrls?.[sourceIndex] ?? ``;
  const failed = !sourceUrl;
  const onLoad = () => setLoaded(true);
  const onError = () => {
    setLoaded(false);
    setSourceIndex(index => sourceUrls?.[index] === sourceUrl ? index + 1 : index);
  };
  return { failed, loaded, onLoad, onError, sourceUrl };
};
