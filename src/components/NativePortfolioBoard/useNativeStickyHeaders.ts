import { Animated, type LayoutChangeEvent, type View } from 'react-native';
import { useCallback, useContext, useEffect, useMemo, useRef, type RefObject } from 'react';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';

type Listener = (layoutChanged: boolean) => void;
interface StickySnapshot { top: number; page: number; inner: number; }
export interface NativeStickyColumn {
  ref: RefObject<View | null>;
  translation: Animated.Value;
  refresh: () => void;
  getSnapshot: () => StickySnapshot;
  subscribe: (listener: Listener) => () => void;
  onScrollPosition: (position: number) => void;
  onHeadingLayout: (event: LayoutChangeEvent) => void;
}
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(value, Math.max(0, maximum)));

export const useNativeStickyColumn = (layoutKey: string, width: number, height: number): NativeStickyColumn => {
  const pageScroll = useContext(ScrollContext)?.pageScroll;
  const ref = useRef<View>(null);
  const translation = useRef(new Animated.Value(0)).current;
  const listeners = useRef(new Set<Listener>());
  const frame = useRef<number | null>(null);
  const generation = useRef(0);
  const inner = useRef(0);
  const viewportTop = useRef(0);
  const snapshot = useRef<StickySnapshot>({ top: 0, page: 0, inner: 0 });
  const metrics = useRef({ ready: false, contentY: 0, height: 0, headingY: 1, headingHeight: 48 });
  const update = useCallback((layoutChanged = false) => {
    const page = pageScroll?.getPosition() ?? 0;
    const metric = metrics.current;
    const headingTop = metric.contentY - page + metric.headingY;
    const offset = metric.ready ? clamp(viewportTop.current - headingTop, metric.height - metric.headingY - metric.headingHeight) : 0;
    translation.setValue(offset);
    snapshot.current = { page, inner: inner.current, top: headingTop + offset + metric.headingHeight };
    listeners.current.forEach(listener => listener(layoutChanged));
  }, [pageScroll, translation]);
  const refresh = useCallback(() => {
    const version = ++generation.current;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      ref.current?.measureInWindow((_x, y, _width, measuredHeight) => {
        if (version !== generation.current || measuredHeight <= 0) return;
        metrics.current = { ...metrics.current, ready: true, height: measuredHeight, contentY: y + (pageScroll?.getPosition() ?? 0) };
        update(true);
      });
      if (pageScroll) void pageScroll.measure().then(viewport => {
        if (version !== generation.current) return;
        viewportTop.current = viewport.y;
        update(true);
      });
      else { viewportTop.current = 0; update(true); }
    });
  }, [pageScroll, update]);
  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => { listeners.current.delete(listener); };
  }, []);
  const onScrollPosition = useCallback((position: number) => { inner.current = position; update(); }, [update]);
  const onHeadingLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    metrics.current.headingY = nativeEvent.layout.y;
    metrics.current.headingHeight = nativeEvent.layout.height;
    update(true);
  }, [update]);
  useEffect(() => {
    refresh();
    const unsubscribe = pageScroll?.subscribe?.(layoutChanged => layoutChanged ? refresh() : update());
    return () => {
      ++generation.current;
      unsubscribe?.();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [pageScroll, refresh, update, layoutKey, width, height]);
  return useMemo(() => ({ ref, refresh, subscribe, translation, onHeadingLayout, onScrollPosition, getSnapshot: () => snapshot.current }), [refresh, subscribe, translation, onHeadingLayout, onScrollPosition]);
};

export const useNativeStickyGroup = (column: NativeStickyColumn, expanded: boolean, layoutKey: unknown) => {
  const ref = useRef<View>(null);
  const frame = useRef<number | null>(null);
  const generation = useRef(0);
  const translation = useRef(new Animated.Value(0)).current;
  const metrics = useRef({ ready: false, contentY: 0, height: 0, headingY: 1, headingHeight: 44 });
  const update = useCallback(() => {
    const snapshot = column.getSnapshot();
    const metric = metrics.current;
    const headingTop = metric.contentY - snapshot.page - snapshot.inner + metric.headingY;
    const offset = expanded && metric.ready ? clamp(snapshot.top - headingTop, metric.height - metric.headingY - metric.headingHeight) : 0;
    translation.setValue(offset);
  }, [column, expanded, translation]);
  const refresh = useCallback(() => {
    const version = ++generation.current;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      ref.current?.measureInWindow((_x, y, _width, height) => {
        if (version !== generation.current || height <= 0) return;
        const snapshot = column.getSnapshot();
        metrics.current = { ...metrics.current, ready: true, height, contentY: y + snapshot.page + snapshot.inner };
        update();
      });
    });
  }, [column, update]);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    metrics.current.height = event.nativeEvent.layout.height;
    update();
    refresh();
  }, [refresh, update]);
  const onHeadingLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    metrics.current.headingY = nativeEvent.layout.y;
    metrics.current.headingHeight = nativeEvent.layout.height;
    update();
  }, [update]);
  useEffect(() => {
    refresh();
    const unsubscribe = column.subscribe(layoutChanged => layoutChanged ? refresh() : update());
    return () => {
      ++generation.current;
      unsubscribe();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [column, expanded, layoutKey, refresh, update]);
  return { ref, refresh, onLayout, translation, onHeadingLayout };
};
