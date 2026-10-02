import { createStyles } from './styles';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';

export const useLoadingScreen = () => {
  const { height } = useWindowDimensions();
  const { palette, isDark } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  useEffect(() => {
    let active = true;
    const change = (enabled: boolean) => { if (active) setReducedMotion(enabled); };
    void AccessibilityInfo.isReduceMotionEnabled().then(change).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(`reduceMotionChanged`, change);
    return () => { active = false; subscription?.remove(); };
  }, []);
  return { height, styles, isDark, palette, reducedMotion };
};
