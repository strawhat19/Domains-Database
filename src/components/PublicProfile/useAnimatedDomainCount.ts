import { useRef, useState, useEffect } from 'react';
import { useReducedMotionPreference } from '../../shared/common/useReducedMotion';

export const useAnimatedDomainCount = (total: number) => {
  const [count, setCount] = useState(0);
  const finished = useRef(false);
  const { ready, reducedMotion } = useReducedMotionPreference();

  useEffect(() => {
    if (!ready || finished.current) return;
    if (reducedMotion || total === 0) {
      finished.current = true;
      setCount(total);
      return;
    }

    let frame: number;
    let startedAt: number | undefined;
    const animate = (now: number) => {
      startedAt ??= now;
      const progress = Math.min((now - startedAt) / 650, 1);
      setCount(Math.round(total * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else finished.current = true;
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ready, reducedMotion, total]);

  return ready ? reducedMotion ? total : count : undefined;
};
