import { createStyles } from './styles.native';
import type { PaymentTrendProps } from './types';
import { useMemo, useState, useCallback } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Pressable, PanResponder } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { dayLabel, metricValue, metricReading, trendGeometry } from './data';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react-native';

const PaymentTrend = ({ id, points, series }: PaymentTrendProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [width, setWidth] = useState(320);
  const [timelineWidth, setTimelineWidth] = useState(240);
  const [selected, setSelected] = useState<number | null>(null);
  const index = Math.min(selected ?? points.length - 1, points.length - 1);
  const point = points?.[index];
  const height = 220;
  const geometry = trendGeometry(points, series, width, height);
  const inspect = useCallback((position: number) => setSelected(Math.min(points.length - 1, Math.max(0, Math.round(position / Math.max(1, timelineWidth) * (points.length - 1))))), [points.length, timelineWidth]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: event => inspect(event.nativeEvent.locationX),
    onPanResponderMove: event => inspect(event.nativeEvent.locationX),
  }), [inspect]);
  const labels = [...new Set([0, ...(width >= 420 ? [Math.floor((points.length - 1) / 2)] : []), points.length - 1])].filter(value => points?.[value]);
  return <View {...elementProps(`admin-payments-trend`, id)} style={styles.trend}>
    <View {...elementProps(`admin-payments-legend`, id)} style={styles.row}>{series.map(item => <View key={item.key} {...elementProps(`admin-payments-legend-item`, `${id}-${item.key}`)} style={styles.legendItem}><View {...elementProps(`admin-payments-legend-dot`, `${id}-${item.key}`)} style={[styles.dot, { backgroundColor: palette[item.tone] }]} /><Text {...elementProps(`admin-payments-legend-label`, `${id}-${item.key}`)} style={styles.small}>{item.label}</Text></View>)}</View>
    <View {...elementProps(`admin-payments-reading`, id)} style={styles.reading}><Text {...elementProps(`admin-payments-reading-date`, id)} style={styles.small}>{point ? `${dayLabel(point.date, true)} · UTC` : `No Measurements`}</Text><Text {...elementProps(`admin-payments-reading-value`, id)} style={styles.label} accessibilityLiveRegion={`polite`}>{metricReading(point, series)}</Text></View>
    <View {...elementProps(`admin-payments-plot`, id)} onLayout={event => setWidth(Math.max(180, event.nativeEvent.layout.width))} style={styles.plot}>
      <Svg {...elementProps(`admin-payments-svg`, id)} width={`100%`} height={height} viewBox={`0 0 ${width} ${height}`} accessibilityRole={`image`} accessibilityLabel={`${series.map(item => item.label).join(` And `)} By UTC Day. Missing measurements keep their day and break the line. Use the day timeline or List to inspect values.`}>
        {[0, .5, 1].map(fraction => <Line key={fraction} {...elementProps(`admin-payments-grid`, `${id}-${fraction}`)} x1={geometry.plot.left} x2={geometry.plot.right} y1={geometry.y(geometry.ceiling * fraction)} y2={geometry.y(geometry.ceiling * fraction)} stroke={palette.line} strokeWidth={1} vectorEffect={`non-scaling-stroke`} />)}
        {[0, .5, 1].map(fraction => <SvgText key={fraction} {...elementProps(`admin-payments-tick`, `${id}-${fraction}`)} x={geometry.plot.left - 7} y={geometry.y(geometry.ceiling * fraction) + 4} textAnchor={`end`} fontSize={10} fill={palette.muted}>{metricValue(series[0]?.key ?? ``, geometry.ceiling * fraction)}</SvgText>)}
        {geometry.lines.map(line => <Path key={line.key} {...elementProps(`admin-payments-line`, `${id}-${line.key}`)} d={line.path} fill={`none`} stroke={palette[line.tone]} strokeWidth={2.5} strokeLinejoin={`round`} strokeLinecap={`round`} vectorEffect={`non-scaling-stroke`} />)}
        {geometry.lines.flatMap(line => line.coordinates.map((coordinate, position) => coordinate.y === null ? null : <Circle key={`${line.key}-${position}`} {...elementProps(`admin-payments-point`, `${id}-${line.key}-${position}`)} cx={coordinate.x} cy={coordinate.y} r={index === position ? 4 : 1.8} fill={palette[line.tone]} onPress={() => setSelected(position)} />))}
        {point ? <Line {...elementProps(`admin-payments-selection`, id)} x1={geometry.x(index)} x2={geometry.x(index)} y1={geometry.plot.top} y2={geometry.plot.bottom} stroke={palette.muted} strokeDasharray={`3 4`} vectorEffect={`non-scaling-stroke`} /> : null}
        {labels.map(position => <SvgText key={position} {...elementProps(`admin-payments-date`, `${id}-${position}`)} x={geometry.x(position)} y={height - 7} fontSize={10} fill={palette.muted} textAnchor={position === 0 ? `start` : position === points.length - 1 ? `end` : `middle`}>{dayLabel(points[position].date)}</SvgText>)}
      </Svg>
    </View>
    {!geometry.measured ? <Text {...elementProps(`admin-payments-measurements-unavailable`, id)} style={styles.small}>{`No Measurements Available For This Chart`}</Text> : null}
    {points.length > 1 ? <View {...elementProps(`admin-payments-timeline-wrap`, id)} style={[styles.timeline, { paddingLeft: geometry.plot.left, paddingRight: 16 }]}>
      <View {...elementProps(`admin-payments-timeline-copy`, id)} style={styles.row}><MoveHorizontal {...elementProps(`admin-payments-timeline-icon`, id)} size={13} color={palette.muted} accessible={false} /><Text {...elementProps(`admin-payments-timeline-label`, id)} style={styles.small}>{`Day Timeline · Drag To Inspect`}</Text></View>
      <View {...elementProps(`admin-payments-timeline`, id)} {...pan.panHandlers} onLayout={event => setTimelineWidth(event.nativeEvent.layout.width)} style={styles.timelineTouch} accessible accessibilityRole={`adjustable`} accessibilityLabel={`Day Timeline`} accessibilityHint={`Swipe Up Or Down To Change Day, Or Drag Across The Track`} accessibilityValue={{ min: 0, max: points.length - 1, now: Math.max(0, index), text: point ? `${dayLabel(point.date, true)}, ${metricReading(point, series)}` : `No Measurements` }} accessibilityActions={[{ name: `increment`, label: `Next Day` }, { name: `decrement`, label: `Previous Day` }]} onAccessibilityAction={event => setSelected(Math.min(points.length - 1, Math.max(0, index + (event.nativeEvent.actionName === `increment` ? 1 : -1))))}>
        <View pointerEvents={`none`} {...elementProps(`admin-payments-timeline-track`, id)} style={styles.timelineTrack} /><View pointerEvents={`none`} {...elementProps(`admin-payments-timeline-thumb`, id)} style={[styles.timelineThumb, { left: Math.max(0, index) / Math.max(1, points.length - 1) * Math.max(0, timelineWidth - 12) }]} />
      </View>
      <View {...elementProps(`admin-payments-inspection-buttons`, id)} style={styles.row}>
        <Pressable {...elementProps(`admin-payments-previous`, id)} accessibilityRole={`button`} accessibilityLabel={`Previous Day`} disabled={index <= 0} accessibilityState={{ disabled: index <= 0 }} onPress={() => setSelected(index - 1)} style={[styles.button, index <= 0 && styles.disabled]}><ChevronLeft {...elementProps(`admin-payments-previous-icon`, id)} size={14} color={palette.accent} accessible={false} /><Text {...elementProps(`admin-payments-previous-label`, id)} style={styles.buttonText}>{`Previous`}</Text></Pressable>
        <Pressable {...elementProps(`admin-payments-next`, id)} accessibilityRole={`button`} accessibilityLabel={`Next Day`} disabled={index >= points.length - 1} accessibilityState={{ disabled: index >= points.length - 1 }} onPress={() => setSelected(index + 1)} style={[styles.button, index >= points.length - 1 && styles.disabled]}><Text {...elementProps(`admin-payments-next-label`, id)} style={styles.buttonText}>{`Next`}</Text><ChevronRight {...elementProps(`admin-payments-next-icon`, id)} size={14} color={palette.accent} accessible={false} /></Pressable>
      </View>
    </View> : null}
    <Text {...elementProps(`admin-payments-missing-note`, id)} style={styles.small}>{`UTC Daily Buckets · — Means Unavailable · Today Is Partial`}</Text>
  </View>;
};
export default PaymentTrend;
