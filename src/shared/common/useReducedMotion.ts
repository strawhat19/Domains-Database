import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    const update = (enabled: boolean) => { if (mounted) setReducedMotion(enabled); };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(true));
    const subscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, update);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reducedMotion;
};
