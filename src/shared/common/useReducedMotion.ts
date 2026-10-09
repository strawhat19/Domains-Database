import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotionPreference = () => {
  const [preference, setPreference] = useState({ ready: false, reducedMotion: true });
  useEffect(() => {
    let mounted = true;
    const update = (reducedMotion: boolean) => {
      if (mounted) setPreference(current => current.ready && current.reducedMotion === reducedMotion ? current : { ready: true, reducedMotion });
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(true));
    const subscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, update);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return preference;
};
export const useReducedMotion = () => useReducedMotionPreference().reducedMotion;
