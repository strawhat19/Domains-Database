import { useMemo, useState, useCallback } from 'react';
import { createStyles } from './styles.native';
import type { DomainSearchLoaderProps } from './types';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useLoadingScreen } from '../LoadingScreen/useLoadingScreen';
import { useTheme } from '../../shared/themeContext/useTheme';

export const useDomainSearchLoader = ({ sidebar, availableHeight }: DomainSearchLoaderProps) => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const { skeletonMotion } = useLoadingScreen();
  const [measuredWidth, setMeasuredWidth] = useState(width);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const budget = availableHeight !== undefined && Number.isFinite(availableHeight) && availableHeight > 0
    ? availableHeight
    : undefined;
  const compact = budget !== undefined && budget < 470;
  const minimal = budget !== undefined && budget < 260;
  const wide = Boolean(sidebar && measuredWidth >= 800 && (budget === undefined || budget >= 180));
  const showIntro = budget === undefined || budget >= 180;
  const showShelf = budget === undefined || budget >= 300;
  const showRecents = !minimal && (!compact || (wide && (budget ?? 0) >= 370));
  const sidebarCount = Math.max(1, Math.min(4, Math.floor(((budget ?? 520) - 136) / 96)));
  const resultCount = measuredWidth >= 1100 ? 3 : measuredWidth >= 620 ? 2 : 1;
  const rowCount = compact ? 1 : 2;
  const pillCount = measuredWidth < 500 ? 2 : 3;
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const nextWidth = nativeEvent.layout.width;
    if (nextWidth > 0) setMeasuredWidth(nextWidth);
  }, []);

  return {
    wide,
    budget,
    styles,
    palette,
    minimal,
    compact,
    onLayout,
    rowCount,
    pillCount,
    showIntro,
    showShelf,
    showRecents,
    resultCount,
    sidebarCount,
    skeletonMotion,
  };
};
