import { useRef, useState, useEffect } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

export const useLandingActivity = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (typeof IntersectionObserver === `undefined`) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false));
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return { gridRef, paused: reducedMotion || !visible };
};
