import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastPlacement } from '../../shared/toastPlacement/useToastPlacement';

export const useToastAnchor = (maxWidth: number, headerHeight = 0, scrollToTopVisible = false) => {
  const placement = useToastPlacement();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const inset = width <= 600 ? 16 : 24;
  const left = Math.max(inset, insets.left);
  const right = Math.max(inset, insets.right);
  const top = Math.max(inset, insets.top) + headerHeight;
  const bottom = Math.max(inset, insets.bottom) + (scrollToTopVisible && placement === `bottom-right` ? 52 : 0);

  return {
    placement,
    style: Platform.OS === `web` ? undefined : {
      width: Math.min(maxWidth, Math.max(0, width - left - right)),
      ...(placement.endsWith(`left`) ? { left } : { right }),
      ...(placement.startsWith(`top`) ? { top } : { bottom }),
    },
  };
};
