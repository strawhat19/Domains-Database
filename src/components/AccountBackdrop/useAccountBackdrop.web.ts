import { useRef, useEffect } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const useAccountBackdrop = () => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    const updateMotion = () => { backdrop.dataset.motion = reducedMotion || document.hidden ? `paused` : `running`; };
    updateMotion();
    document.addEventListener(`visibilitychange`, updateMotion);
    return () => document.removeEventListener(`visibilitychange`, updateMotion);
  }, [reducedMotion]);
  return backdropRef;
};
