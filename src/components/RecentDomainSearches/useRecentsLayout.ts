import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export const useRecentsLayout = () => {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Number.isFinite(nextWidth) && nextWidth > 0) setWidth(nextWidth);
  }, []);

  return { onLayout, iconOnly: width !== null && width < 320 };
};
