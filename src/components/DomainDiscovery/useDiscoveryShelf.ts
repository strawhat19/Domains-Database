import { useCallback, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';

export type DiscoveryCardDensity = `full` | `compact` | `pill`;

export const discoveryCardGap = 12;
export const discoveryShelfCardHeights = { full: 232, compact: 84, pill: 40 };

interface DiscoveryShelfOptions {
  count: number;
  loading: boolean;
  sidebar: boolean;
  availableHeight?: number;
}

export const useDiscoveryShelf = ({ count, loading, sidebar, availableHeight }: DiscoveryShelfOptions) => {
  const { height } = useWindowDimensions();
  const [shelfHeight, setShelfHeight] = useState<number | null>(null);
  const panelHeight = Math.max(220, availableHeight ?? height - 300);
  const viewportHeight = shelfHeight ?? panelHeight - 150;
  const buffering = sidebar && loading && count < 3;
  const displayedCount = buffering ? 3 : count;
  const trackHeight = (cardCount: number, cardHeight: number) => (
    cardCount * cardHeight + Math.max(0, cardCount - 1) * discoveryCardGap + 4
  );
  const density: DiscoveryCardDensity = !sidebar || trackHeight(displayedCount, discoveryShelfCardHeights.full) <= viewportHeight
    ? `full` : trackHeight(displayedCount, discoveryShelfCardHeights.compact) <= viewportHeight ? `compact` : `pill`;
  const overflow = sidebar && density === `pill` && trackHeight(displayedCount, discoveryShelfCardHeights.pill) > viewportHeight;
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (Number.isFinite(nextHeight) && nextHeight >= 0) setShelfHeight(current => current === nextHeight ? current : nextHeight);
  }, []);

  return {
    density,
    onLayout,
    overflow,
    buffering,
    panelHeight,
    gap: discoveryCardGap,
    placeholderCount: buffering || (loading && count === 0) ? 3 : 0,
  };
};
