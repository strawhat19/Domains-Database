import { createStyles } from './styles.native';
import { portfolioHaptic } from '../../shared/common/haptics.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext as PageScrollContext } from '../../shared/scrollContext/ScrollContext';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, AppState, PanResponder, ScrollView, Text, View, useWindowDimensions, type GestureResponderEvent, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';

export type NativeDragKind = `domain` | `group` | `collection`;
export interface NativeDragItem { id: string; kind: NativeDragKind; label: string; }
export interface NativeDropTarget {
  groupId?: string | null;
  targetId?: string;
  collectionId?: string | null;
  groupKey?: string;
  placement?: `before` | `after`;
}
interface Rect { x: number; y: number; width: number; height: number; }
interface Zone {
  id: string;
  accepts: NativeDragKind[];
  target: NativeDropTarget;
  scrollIds: string[];
  horizontal?: boolean;
  measure: () => Promise<Rect>;
}
interface ScrollRegion {
  id: string;
  page?: boolean;
  horizontal: boolean;
  parents: string[];
  measure: () => Promise<Rect>;
  scrollBy: (amount: number) => boolean;
}
interface Controller {
  scope: string;
  activeId: string | null;
  activeKind: NativeDragKind | null;
  targetId: string | null;
  placement: `before` | `after`;
  suppressed: { current: number };
  interruption: { current: number };
  begin: (item: NativeDragItem, view: View | null, x: number, y: number, isCurrent: () => boolean) => void;
  update: (x: number, y: number) => void;
  end: (cancel?: boolean) => void;
  registerZone: (zone: Zone) => () => void;
  registerScroll: (region: ScrollRegion) => () => void;
}
const DragContext = createContext<Controller | null>(null);
const DragScrollContext = createContext<string[]>([]);
const inside = (rect: Rect | undefined, x: number, y: number) => Boolean(rect && rect.width > 0 && rect.height > 0 && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height);
const measure = (view: View | null): Promise<Rect> => new Promise(resolve => {
  if (!view) { resolve({ x: 0, y: 0, width: 0, height: 0 }); return; }
  view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
});

export const NativePortfolioDrag = ({ children, onDrop }: { children: ReactNode; onDrop: (item: NativeDragItem, target: NativeDropTarget) => void }) => {
  const { palette } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pageScroll = useContext(PageScrollContext)?.pageScroll;
  const scope = useRef(`native-drag-${Math.random().toString(36).slice(2)}`).current;
  const pageId = `page-${scope}`;
  const rootScrollIds = useMemo(() => pageScroll ? [pageId] : [], [pageScroll, pageId]);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const root = useRef<View>(null);
  const zones = useRef(new Map<string, Zone>());
  const scrolls = useRef(new Map<string, ScrollRegion>());
  const rectangles = useRef(new Map<string, Rect>());
  const scrollRects = useRef(new Map<string, Rect>());
  const origin = useRef<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });
  const active = useRef<NativeDragItem | null>(null);
  const target = useRef<{ id: string; value: NativeDropTarget } | null>(null);
  const frame = useRef<number | null>(null);
  const refreshing = useRef<Promise<void> | null>(null);
  const refreshedSequence = useRef(-1);
  const sequence = useRef(0);
  const suppressed = useRef(0);
  const interruption = useRef(0);
  const lastTick = useRef(0);
  const latestDrop = useRef(onDrop);
  const reducedMotion = useRef(false);
  const viewport = useRef({ width: windowWidth, height: windowHeight });
  viewport.current = { width: windowWidth, height: windowHeight };
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [item, setItem] = useState<NativeDragItem | null>(null);
  const [width, setWidth] = useState(260);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<`before` | `after`>(`before`);
  latestDrop.current = onDrop;

  const refresh = (): Promise<void> => {
    if (refreshing.current) return refreshing.current;
    const version = sequence.current;
    const pending: Promise<void> = Promise.all([
      measure(root.current),
      Promise.all([...zones.current.values()].map(async zone => ({ zone, rect: await zone.measure() }))),
      Promise.all([...scrolls.current.values()].map(async region => ({ region, rect: await region.measure() }))),
    ]).then(([currentOrigin, measuredZones, measuredScrolls]) => {
      if (version !== sequence.current) return;
      origin.current = currentOrigin;
      measuredZones.forEach(({ zone, rect }) => { if (zones.current.get(zone.id) === zone) rectangles.current.set(zone.id, rect); });
      measuredScrolls.forEach(({ region, rect }) => { if (scrolls.current.get(region.id) === region) scrollRects.current.set(region.id, rect); });
      refreshedSequence.current = version;
      if (active.current) position.setValue({ x: pointer.current.x - offset.current.x - currentOrigin.x, y: pointer.current.y - offset.current.y - currentOrigin.y });
    }).finally(() => { if (refreshing.current === pending) refreshing.current = null; });
    refreshing.current = pending;
    return pending;
  };
  const within = (ids: string[]) => ids.every(id => inside(scrollRects.current.get(id), pointer.current.x, pointer.current.y));
  const clipRegion = (rect: Rect, parents: string[]): Rect => {
    const limits = [
      { x: 0, y: 0, ...viewport.current },
      origin.current,
      ...parents.flatMap(id => { const parent = scrollRects.current.get(id); return parent ? [parent] : []; }),
    ];
    const left = Math.max(rect.x, ...limits.map(limit => limit.x));
    const top = Math.max(rect.y, ...limits.map(limit => limit.y));
    const right = Math.min(rect.x + rect.width, ...limits.map(limit => limit.x + limit.width));
    const bottom = Math.min(rect.y + rect.height, ...limits.map(limit => limit.y + limit.height));
    return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  };
  const findTarget = () => {
    const moved = active.current;
    if (!moved) return;
    const { x, y } = pointer.current;
    const overSource = [...zones.current.values()].some(zone => zone.target.targetId === moved.id && zone.accepts.includes(moved.kind)
      && inside(rectangles.current.get(zone.id), x, y) && within(zone.scrollIds));
    const matches = !overSource && inside(origin.current, x, y) ? [...zones.current.values()].filter(zone => zone.accepts.includes(moved.kind)
      && zone.target.targetId !== moved.id && inside(rectangles.current.get(zone.id), x, y) && within(zone.scrollIds))
      .sort((left, right) => {
        const first = rectangles.current.get(left.id)!;
        const second = rectangles.current.get(right.id)!;
        return first.width * first.height - second.width * second.height;
      }) : [];
    const zone = matches[0];
    const rect = zone && rectangles.current.get(zone.id);
    const nextPlacement = !zone?.target.targetId || !rect ? `after` : zone.horizontal ? x < rect.x + rect.width / 2 ? `before` : `after` : y < rect.y + rect.height / 2 ? `before` : `after`;
    if (target.current?.id === zone?.id && target.current?.value.placement === nextPlacement) return;
    target.current = zone ? { id: zone.id, value: { ...zone.target, placement: nextPlacement } } : null;
    setTargetId(zone?.id ?? null);
    setPlacement(nextPlacement);
    if (zone) portfolioHaptic(`tick`);
  };
  const tick = () => {
    frame.current = null;
    if (!active.current) return;
    const now = Date.now();
    let scrolled = false;
    if (now - lastTick.current > 22) {
      lastTick.current = now;
      const scrolledAxes = new Set<boolean>();
      const regions = [...scrolls.current.values()].sort((left, right) => Number(Boolean(left.page)) - Number(Boolean(right.page)) || right.parents.length - left.parents.length);
      regions.forEach(region => {
        if (scrolledAxes.has(region.horizontal) || active.current?.kind === `collection` && !region.horizontal && !region.page) return;
        const measured = scrollRects.current.get(region.id);
        const rect = measured && clipRegion(measured, region.parents);
        const { x, y } = pointer.current;
        if (!rect || !inside(rect, x, y) || !inside(origin.current, x, y) || !within(region.parents)) return;
        const value = region.horizontal ? x - rect.x : y - rect.y;
        const size = region.horizontal ? rect.width : rect.height;
        const edge = Math.min(56, size / 4);
        const amount = value < edge ? -Math.ceil((edge - value) / 4) : value > size - edge ? Math.ceil((value - size + edge) / 4) : 0;
        if (amount && region.scrollBy(amount)) { scrolled = true; scrolledAxes.add(region.horizontal); }
      });
    }
    if (scrolled) void refresh().then(findTarget);
    findTarget();
    frame.current = requestAnimationFrame(tick);
  };
  const update = (x: number, y: number) => {
    pointer.current = { x, y };
    if (!active.current) return;
    position.setValue({ x: x - offset.current.x - origin.current.x, y: y - offset.current.y - origin.current.y });
    findTarget();
  };
  const begin = (next: NativeDragItem, view: View | null, x: number, y: number, isCurrent: () => boolean) => {
    if (active.current || !isCurrent()) return;
    const version = ++sequence.current;
    pointer.current = { x, y };
    void Promise.all([measure(view), refresh()]).then(async ([rect]) => {
      if (version !== sequence.current || !isCurrent()) return;
      if (refreshedSequence.current !== version) await refresh();
      if (version !== sequence.current || !isCurrent() || rect.width <= 0 || rect.height <= 0) return;
      active.current = next;
      offset.current = { x: Math.min(rect.width / 2, 60), y: Math.min(rect.height / 2, 32) };
      setWidth(Math.max(180, Math.min(rect.width, 330)));
      setItem(next);
      update(pointer.current.x, pointer.current.y);
      scale.setValue(1);
      if (!reducedMotion.current) Animated.spring(scale, { toValue: 1.035, damping: 20, stiffness: 260, useNativeDriver: true }).start();
      portfolioHaptic(`lift`);
      tick();
    });
  };
  const end = (cancel = false) => {
    if (cancel) ++interruption.current;
    ++sequence.current;
    const moved = active.current;
    if (moved && !cancel) findTarget();
    const destination = target.current?.value;
    active.current = null;
    target.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (moved) suppressed.current = Date.now() + 350;
    setItem(null);
    setTargetId(null);
    if (!cancel && moved && destination) latestDrop.current(moved, destination);
  };
  const callbacks = useRef({ end });
  callbacks.current = { end };
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { reducedMotion.current = value; }).catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener(`reduceMotionChanged`, value => { reducedMotion.current = value; });
    const app = AppState.addEventListener(`change`, state => { if (state !== `active`) callbacks.current.end(true); });
    const blur = AppState.addEventListener(`blur`, () => callbacks.current.end(true));
    return () => { ++sequence.current; if (frame.current !== null) cancelAnimationFrame(frame.current); motion.remove(); app.remove(); blur.remove(); };
  }, []);
  const registerZone = useCallback((zone: Zone) => {
    zones.current.set(zone.id, zone);
    return () => { if (zones.current.get(zone.id) === zone) { zones.current.delete(zone.id); rectangles.current.delete(zone.id); } };
  }, []);
  const registerScroll = useCallback((region: ScrollRegion) => {
    scrolls.current.set(region.id, region);
    return () => { if (scrolls.current.get(region.id) === region) { scrolls.current.delete(region.id); scrollRects.current.delete(region.id); } };
  }, []);
  useEffect(() => pageScroll ? registerScroll({ id: pageId, page: true, horizontal: false, parents: [], measure: pageScroll.measure, scrollBy: pageScroll.scrollBy }) : undefined, [pageScroll, pageId, registerScroll]);
  const context: Controller = {
    end, begin, scope, update, targetId, placement, suppressed, interruption, registerZone, registerScroll,
    activeId: item?.id ?? null,
    activeKind: item?.kind ?? null,
  };
  return <DragContext.Provider value={context}><DragScrollContext.Provider value={rootScrollIds}><View ref={root} collapsable={false} nativeID={`native-portfolio-drag-surface`} style={styles.root} onTouchStart={event => { if (event.nativeEvent.touches.length > 1) callbacks.current.end(true); }}>
    {children}
    {item && <Animated.View pointerEvents={`none`} nativeID={`native-portfolio-drag-preview-${item.kind}-${item.id}`} style={[styles.preview, { width, transform: [...position.getTranslateTransform(), { scale }, { rotate: `-1deg` }] }]}>
      <Text style={styles.previewKind}>{item.kind.toUpperCase()}</Text><Text style={styles.previewName} numberOfLines={3}>{item.label}</Text>
    </Animated.View>}
  </View></DragScrollContext.Provider></DragContext.Provider>;
};

export const NativeDragSource = ({ item, children, onTap, onHold, style, disabled = false }: { item: NativeDragItem; children: ReactNode; onTap?: () => void; onHold: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) => {
  const drag = useContext(DragContext);
  const ref = useRef<View>(null);
  const identity = `${item.kind}:${item.id}`;
  const latest = useRef({ item, drag, onTap, onHold, identity, disabled });
  latest.current = { item, drag, onTap, onHold, identity, disabled };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceVersion = useRef(0);
  const startedInterruption = useRef(0);
  const startedIdentity = useRef(identity);
  const tracking = useRef(false);
  const armed = useRef(false);
  const owned = useRef(false);
  const consumed = useRef(false);
  const owner = useRef<Controller | null>(null);
  const focused = useRef(AppState.currentState == null || AppState.currentState === `active`);
  const origin = useRef({ x: 0, y: 0 });
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    if (menuTimer.current) clearTimeout(menuTimer.current);
    timer.current = null;
    menuTimer.current = null;
  };
  const validSession = () => !latest.current.disabled && focused.current && (AppState.currentState == null || AppState.currentState === `active`)
    && latest.current.identity === startedIdentity.current
    && latest.current.drag?.interruption.current === startedInterruption.current;
  const cancel = () => {
    ++sourceVersion.current;
    clear();
    tracking.current = false;
    armed.current = false;
    consumed.current = true;
    if (owned.current) owner.current?.end(true);
    owned.current = false;
    owner.current = null;
  };
  const begin = () => {
    const current = latest.current;
    const surface = current.drag;
    if (!surface || !tracking.current || !armed.current || consumed.current || owned.current || !validSession() || surface.activeId) return;
    clear();
    const token = sourceVersion.current;
    const scope = surface.scope;
    const sourceIdentity = current.identity;
    owned.current = true;
    owner.current = surface;
    surface.begin(current.item, ref.current, origin.current.x, origin.current.y, () => token === sourceVersion.current
      && tracking.current && !consumed.current && validSession() && latest.current.identity === sourceIdentity && latest.current.drag?.scope === scope);
  };
  const start = (event: GestureResponderEvent) => {
    if (latest.current.disabled) { cancel(); return; }
    if (event.nativeEvent.touches.length !== 1) { cancel(); return; }
    if (latest.current.drag?.activeId) return;
    cancel();
    if (!focused.current || AppState.currentState != null && AppState.currentState !== `active`) return;
    consumed.current = false;
    tracking.current = true;
    startedIdentity.current = latest.current.identity;
    startedInterruption.current = latest.current.drag?.interruption.current ?? 0;
    origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    const token = sourceVersion.current;
    timer.current = setTimeout(() => {
      if (token !== sourceVersion.current || !tracking.current || !validSession()) return;
      armed.current = true;
      if (latest.current.item.kind === `collection`) { begin(); return; }
      menuTimer.current = setTimeout(() => {
        if (token !== sourceVersion.current || !tracking.current || owned.current || !validSession()) return;
        consumed.current = true;
        tracking.current = false;
        if (latest.current.drag) latest.current.drag.suppressed.current = Date.now() + 350;
        latest.current.onHold();
      }, 150);
    }, 300);
  };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (event, gesture) => {
      if (event.nativeEvent.touches.length !== 1 || !validSession()) { cancel(); return false; }
      if (!tracking.current || consumed.current) return false;
      const moved = Math.hypot(gesture.dx, gesture.dy) > 8;
      if (moved && !armed.current) { cancel(); return false; }
      return owned.current || (moved && armed.current);
    },
    onPanResponderGrant: () => { if (!validSession()) { cancel(); return; } clear(); begin(); },
    onPanResponderStart: event => { if (event.nativeEvent.touches.length !== 1) cancel(); },
    onPanResponderMove: (event, gesture) => {
      if (event.nativeEvent.touches.length !== 1 || !validSession()) { cancel(); return; }
      if (owned.current) owner.current?.update(gesture.moveX, gesture.moveY);
    },
    onPanResponderRelease: (event, gesture) => {
      clear();
      if (!owned.current || !validSession()) { cancel(); return; }
      owner.current?.update(gesture.moveX || event.nativeEvent.pageX, gesture.moveY || event.nativeEvent.pageY);
      owner.current?.end();
      ++sourceVersion.current;
      owned.current = false;
      owner.current = null;
      tracking.current = false;
      consumed.current = true;
    },
    onPanResponderTerminate: cancel,
    onPanResponderTerminationRequest: () => !owned.current,
  }), []);
  const finish = () => {
    clear();
    const valid = validSession();
    if (owned.current) {
      owner.current?.end(!valid);
      owned.current = false;
      owner.current = null;
      consumed.current = true;
    }
    const tapped = valid && tracking.current && !consumed.current;
    ++sourceVersion.current;
    tracking.current = false;
    armed.current = false;
    if (tapped && Date.now() >= (latest.current.drag?.suppressed.current ?? 0)) latest.current.onTap?.();
  };
  useEffect(() => {
    const state = AppState.addEventListener(`change`, value => { focused.current = value === `active`; if (!focused.current) cancel(); });
    const blur = AppState.addEventListener(`blur`, () => { focused.current = false; cancel(); });
    const focus = AppState.addEventListener(`focus`, () => { focused.current = AppState.currentState == null || AppState.currentState === `active`; });
    return () => { cancel(); state.remove(); blur.remove(); focus.remove(); };
  }, [identity, disabled]);
  return <View
    ref={ref}
    collapsable={false}
    nativeID={`native-drag-source-${item.kind}-${item.id}`}
    accessible
    accessibilityRole={`button`}
    accessibilityState={{ disabled }}
    accessibilityLabel={`${item.label}, ${item.kind}`}
    accessibilityHint={`Tap To Edit. Hold Then Move To Drag. Hold Still For Actions. Swipe To Scroll`}
    accessibilityActions={[{ name: `activate`, label: `Edit` }, { name: `longpress`, label: `Open Actions` }]}
    onAccessibilityAction={event => { cancel(); if (disabled) return; if (event.nativeEvent.actionName === `longpress`) onHold(); else if (event.nativeEvent.actionName === `activate`) onTap?.(); }}
    onTouchStart={start}
    onTouchEnd={finish}
    onTouchCancel={cancel}
    {...pan.panHandlers}
    style={[style, drag?.activeId === item.id && { opacity: .25 }]}
  >{children}</View>;
};

export const NativeDropZone = ({ id, accepts, target, children, horizontal = false, style, disabled = false }: { id: string; accepts: NativeDragKind[]; target: NativeDropTarget; children: ReactNode; horizontal?: boolean; style?: StyleProp<ViewStyle>; disabled?: boolean }) => {
  const drag = useContext(DragContext);
  const scrollIds = useContext(DragScrollContext);
  const ref = useRef<View>(null);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const targetKey = JSON.stringify(target);
  const acceptsKey = accepts.join(`,`);
  useEffect(() => disabled ? undefined : drag?.registerZone({ id, accepts, target, horizontal, scrollIds, measure: () => measure(ref.current) }), [id, targetKey, acceptsKey, horizontal, disabled, scrollIds, drag?.registerZone]);
  const active = !disabled && drag?.targetId === id;
  const edge = horizontal ? { width: 3, top: 0, bottom: 0, ...(drag?.placement === `before` ? { left: 0 } : { right: 0 }) } : { height: 3, left: 0, right: 0, ...(drag?.placement === `before` ? { top: 0 } : { bottom: 0 }) };
  return <View ref={ref} collapsable={false} nativeID={`native-drop-zone-${id}`} style={[style, active && styles.target]}>{children}{active && target.targetId && <View pointerEvents={`none`} nativeID={`native-drop-insertion-${id}`} style={[styles.insertion, edge]} />}</View>;
};

interface NativeDragScrollProps extends ScrollViewProps {
  onScrollPosition?: (position: number) => void;
}

export const NativeDragScroll = ({ children, horizontal = false, style, onScrollPosition, onScroll, onLayout, onContentSizeChange, ...props }: NativeDragScrollProps) => {
  const drag = useContext(DragContext);
  const parents = useContext(DragScrollContext);
  const ref = useRef<ScrollView>(null);
  const frame = useRef<View>(null);
  const id = useRef(`native-scroll-${Math.random().toString(36).slice(2)}`).current;
  const offset = useRef(0);
  const viewport = useRef(0);
  const content = useRef(0);
  const latestPosition = useRef(onScrollPosition);
  latestPosition.current = onScrollPosition;
  const childIds = useMemo(() => [...parents, id], [parents, id]);
  useEffect(() => drag?.registerScroll({ id, parents, horizontal, measure: () => measure(frame.current), scrollBy: amount => {
    const next = Math.max(0, Math.min(content.current - viewport.current, offset.current + amount));
    if (next === offset.current) return false;
    offset.current = next;
    latestPosition.current?.(next);
    ref.current?.scrollTo(horizontal ? { x: next, animated: false } : { y: next, animated: false });
    return true;
  } }), [id, parents, horizontal, drag?.registerScroll]);
  return <View ref={frame} collapsable={false} style={style} onLayout={event => { viewport.current = horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height; onLayout?.(event); }}>
    <ScrollView {...props} ref={ref} nestedScrollEnabled horizontal={horizontal} scrollEnabled={!drag?.activeId} scrollEventThrottle={16} onContentSizeChange={(width, height) => { content.current = horizontal ? width : height; onContentSizeChange?.(width, height); }} onScroll={event => { offset.current = horizontal ? event.nativeEvent.contentOffset.x : event.nativeEvent.contentOffset.y; latestPosition.current?.(offset.current); onScroll?.(event); }}>
      <DragScrollContext.Provider value={childIds}>{children}</DragScrollContext.Provider>
    </ScrollView>
  </View>;
};
