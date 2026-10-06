import { useRef, useState, useCallback } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export const useFilterScroller = () => {
  const metrics = useRef({ offset: 0, viewport: 0, content: 0 });
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const maximum = Math.max(0, metrics.current.content - metrics.current.viewport);
    const offset = Math.min(maximum, Math.max(0, metrics.current.offset));
    const left = offset > 1;
    const right = maximum - offset > 1;
    setEdges(current => current.left === left && current.right === right ? current : { left, right });
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    metrics.current.viewport = event.nativeEvent.layout.width;
    updateEdges();
  }, [updateEdges]);

  const onContentSizeChange = useCallback((width: number) => {
    metrics.current.content = width;
    updateEdges();
  }, [updateEdges]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    metrics.current.offset = event.nativeEvent.contentOffset.x;
    metrics.current.content = event.nativeEvent.contentSize.width;
    metrics.current.viewport = event.nativeEvent.layoutMeasurement.width;
    updateEdges();
  }, [updateEdges]);

  return {
    onLayout,
    onScroll,
    onContentSizeChange,
    showLeftFade: edges.left,
    showRightFade: edges.right,
  };
};
