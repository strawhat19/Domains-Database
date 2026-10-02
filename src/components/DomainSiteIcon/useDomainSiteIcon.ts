import { useState } from 'react';

export const useDomainSiteIcon = () => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const onLoad = () => setLoaded(true);
  const onError = () => setFailed(true);
  return { failed, loaded, onLoad, onError };
};
