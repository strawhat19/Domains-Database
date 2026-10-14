import { useEffect, useLayoutEffect, useState } from 'react';

const useBrowserLayoutEffect = typeof window === `undefined` ? useEffect : useLayoutEffect;

export const useMobilePortfolio = () => {
  const [mobile, setMobile] = useState(false);
  useBrowserLayoutEffect(() => {
    const query = window.matchMedia(`(max-width: 900px)`);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener(`change`, update);
    return () => query.removeEventListener(`change`, update);
  }, []);
  return mobile;
};
