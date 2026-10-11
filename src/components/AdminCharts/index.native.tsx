import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { useChartMotion } from './useChartMotion';
import { elementProps } from '../../shared/elementProps';
import type { ChartPoint, DistributionItem } from './types';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, Animated, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, notation: value >= 10_000 ? `compact` : `standard` }).format(value);

const TrendChart = ({ id, points, label = `Records`, secondaryLabel }: { id: string; points: ChartPoint[]; label?: string; secondaryLabel?: string }) => {
  const { palette } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const revision = points.map(point => `${point.label}:${point.value}:${point.secondary ?? ``}`).join(`|`);
  const motion = useChartMotion(revision);
  const chartPoints = points.filter(point => Number.isFinite(point.value) && (point.secondary === undefined || Number.isFinite(point.secondary)));
  const selected = Math.min(selectedIndex ?? chartPoints.length - 1, chartPoints.length - 1);
  const point = chartPoints[selected];
  const peak = Math.max(1, ...chartPoints.flatMap(item => [item.value, item.secondary ?? 0]));
  const x = (index: number) => 36 + index * 576 / Math.max(1, chartPoints.length - 1);
  const y = (value: number) => 158 - value * 138 / peak;
  const line = (secondary = false) => chartPoints.map((item, index) => `${index ? `L` : `M`}${x(index).toFixed(1)},${y(secondary ? item.secondary ?? 0 : item.value).toFixed(1)}`).join(` `);
  return (
    <View {...elementProps(`admin-chart`, id)} style={styles.root}>
      <View {...elementProps(`admin-chart-legend`, id)} style={styles.legend}>
        <View {...elementProps(`admin-chart-legend-item`, `${id}-primary`)} style={styles.legendItem}><View {...elementProps(`admin-chart-legend-dot`, `${id}-primary`)} style={[styles.dot, { backgroundColor: palette.accent }]} /><Text {...elementProps(`admin-chart-legend-label`, `${id}-primary`)} style={styles.text}>{label}</Text></View>
        {secondaryLabel ? <View {...elementProps(`admin-chart-legend-item`, `${id}-secondary`)} style={styles.legendItem}><View {...elementProps(`admin-chart-legend-dot`, `${id}-secondary`)} style={[styles.dot, { backgroundColor: palette.warning }]} /><Text {...elementProps(`admin-chart-legend-label`, `${id}-secondary`)} style={styles.text}>{secondaryLabel}</Text></View> : null}
      </View>
      {point ? <>
        <Animated.View {...elementProps(`admin-chart-plot`, id)} style={[styles.plot, motion]}>
          <Svg
            width={`100%`}
            height={190}
            viewBox={`0 0 640 190`}
            {...elementProps(`admin-chart-svg`, id)}
            accessibilityLabel={`${label}: ${chartPoints.map(item => `${item.label} ${formatNumber(item.value)}${secondaryLabel ? `, ${secondaryLabel} ${formatNumber(item.secondary ?? 0)}` : ``}`).join(`; `)}`}
          >
            {[0, .5, 1].map((fraction, index) => <Line key={fraction} {...elementProps(`admin-chart-grid`, `${id}-${index}`)} x1={36} x2={612} y1={y(peak * fraction)} y2={y(peak * fraction)} stroke={palette.line} strokeDasharray={`4 5`} />)}
            <Path {...elementProps(`admin-chart-area`, id)} d={`${line()} L${x(chartPoints.length - 1)},158 L36,158 Z`} fill={palette.accent} opacity={.09} />
            <Path {...elementProps(`admin-chart-line`, `${id}-primary`)} d={line()} fill={`none`} strokeWidth={2.5} stroke={palette.accent} strokeLinejoin={`round`} />
            {secondaryLabel ? <Path {...elementProps(`admin-chart-line`, `${id}-secondary`)} d={line(true)} fill={`none`} strokeWidth={2} stroke={palette.warning} strokeLinejoin={`round`} /> : null}
            <SvgText {...elementProps(`admin-chart-axis`, `${id}-peak`)} x={30} y={24} fontSize={10} textAnchor={`end`} fill={palette.muted}>{formatNumber(peak)}</SvgText>
            <SvgText {...elementProps(`admin-chart-axis`, `${id}-zero`)} x={30} y={162} fontSize={10} textAnchor={`end`} fill={palette.muted}>{`0`}</SvgText>
            <Line {...elementProps(`admin-chart-marker`, id)} x1={x(selected)} x2={x(selected)} y1={20} y2={158} stroke={palette.accent} strokeDasharray={`3 4`} opacity={.5} />
            {chartPoints.map((item, index) => <Circle key={`${item.label}-${index}`} {...elementProps(`admin-chart-point`, `${id}-${index}`)} cx={x(index)} cy={y(item.value)} r={index === selected ? 5 : 3} fill={palette.accent} onPress={() => setSelectedIndex(index)} />)}
            {[0, Math.floor((chartPoints.length - 1) / 2), chartPoints.length - 1].filter((index, position, indices) => indices.indexOf(index) === position).map(index => <SvgText key={index} {...elementProps(`admin-chart-date`, `${id}-${index}`)} x={x(index)} y={182} fontSize={10} fill={palette.muted} textAnchor={index === 0 ? `start` : index === chartPoints.length - 1 ? `end` : `middle`}>{chartPoints[index]?.label}</SvgText>)}
          </Svg>
        </Animated.View>
        <View {...elementProps(`admin-chart-selection`, id)} style={styles.selection}>
          <Text {...elementProps(`admin-chart-value`, id)} style={styles.value} accessibilityLiveRegion={`polite`}>{`${point.label} · ${label} ${formatNumber(point.value)}${secondaryLabel ? ` · ${secondaryLabel} ${formatNumber(point.secondary ?? 0)}` : ``}`}</Text>
          <View {...elementProps(`admin-chart-controls`, id)} style={styles.controls}>
            <Pressable {...elementProps(`admin-chart-button`, `${id}-previous`)} style={styles.button} disabled={selected <= 0} accessibilityRole={`button`} accessibilityLabel={`Previous Data Point`} onPress={() => setSelectedIndex(selected - 1)}><ChevronLeft {...elementProps(`admin-chart-button-icon`, `${id}-previous`)} size={14} color={palette.ink} /></Pressable>
            <Pressable {...elementProps(`admin-chart-button`, `${id}-next`)} style={styles.button} disabled={selected >= chartPoints.length - 1} accessibilityRole={`button`} accessibilityLabel={`Next Data Point`} onPress={() => setSelectedIndex(selected + 1)}><ChevronRight {...elementProps(`admin-chart-button-icon`, `${id}-next`)} size={14} color={palette.ink} /></Pressable>
          </View>
        </View>
      </> : <Text {...elementProps(`admin-chart-empty`, id)} style={styles.text}>{`No Activity In This Range`}</Text>}
    </View>
  );
};

export const ActivityChart = ({ id, points, label = `Records`, secondaryLabel }: { id: string; points: ChartPoint[]; label?: string; secondaryLabel?: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const categories = [{ key: `value` as const, label, color: palette.accent }, ...(secondaryLabel ? [{ key: `secondary` as const, label: secondaryLabel, color: palette.warning }] : [])];
  const maximum = Math.max(1, ...points.flatMap(point => categories.map(category => point[category.key] ?? 0)));
  const total = points.reduce((sum, point) => sum + categories.reduce((count, category) => count + (point[category.key] ?? 0), 0), 0);
  const motion = useChartMotion(points.map(point => `${point.label}:${point.value}:${point.secondary}`).join(`|`));
  return <Animated.View {...elementProps(`admin-activity`, id)} style={motion}>
    <View {...elementProps(`admin-activity-legend`, id)} style={{ gap: 12, marginBottom: 20, flexWrap: `wrap`, flexDirection: `row` }}>{categories.map(category => <View key={category.key} {...elementProps(`admin-activity-key`, `${id}-${category.key}`)} style={{ gap: 5, alignItems: `center`, flexDirection: `row` }}><View {...elementProps(`admin-activity-key-dot`, `${id}-${category.key}`)} style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: category.color }} /><Text {...elementProps(`admin-activity-key-label`, `${id}-${category.key}`)} style={[styles.text, { fontSize: 9 }]}>{category.label}</Text></View>)}</View>
    <View {...elementProps(`admin-activity-bars`, id)} style={{ gap: 10, flexDirection: `row` }}>{points.map((point, monthIndex) => <View key={`${point.label}-${monthIndex}`} {...elementProps(`admin-activity-month`, `${id}-${monthIndex}`)} style={{ flex: 1, gap: 9 }}>
      <View {...elementProps(`admin-activity-group`, `${id}-${monthIndex}`)} style={{ gap: 3, height: 140, borderBottomWidth: 1, borderColor: palette.line, flexDirection: `row`, alignItems: `flex-end`, justifyContent: `center` }}>{categories.map(category => <View key={category.key} {...elementProps(`admin-activity-bar`, `${id}-${monthIndex}-${category.key}`)} accessibilityLabel={`${point.label}: ${formatNumber(point[category.key] ?? 0)} ${category.label}`} style={{ width: 12, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: category.color, height: `${(point[category.key] ?? 0) / maximum * 100}%` }} />)}</View>
      <Text {...elementProps(`admin-activity-month-label`, `${id}-${monthIndex}`)} style={[styles.text, { fontSize: 10, textAlign: `center` }]}>{point.label}</Text>
    </View>)}</View>
    <Text {...elementProps(`admin-activity-note`, id)} style={[styles.text, { fontSize: 10, marginTop: 16 }]}>{total ? `${formatNumber(total)} Record(s) Created In This Period` : `No New Records In This Period`}</Text>
  </Animated.View>;
};

export const DistributionChart = ({ id, items, label = `Records` }: { id: string; items: DistributionItem[]; label?: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const data = items.filter(item => Number.isFinite(item.value) && item.value >= 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [palette.accent, palette.success, palette.warning, palette.danger, palette.muted];
  const circumference = 2 * Math.PI * 48;
  const motion = useChartMotion(data.map(item => `${item.label}:${item.value}`).join(`|`));
  let offset = 0;
  return (
    <Animated.View {...elementProps(`admin-distribution`, id)} style={[styles.distribution, motion]}>
      <View {...elementProps(`admin-distribution-ring`, id)} style={styles.ring}>
        <Svg {...elementProps(`admin-distribution-svg`, id)} width={128} height={128} viewBox={`0 0 128 128`} accessibilityLabel={`${formatNumber(total)} Total; ${data.map(item => `${item.label}: ${formatNumber(item.value)}`).join(`; `)}`}>
          <Circle {...elementProps(`admin-distribution-track`, id)} cx={64} cy={64} r={48} fill={`none`} strokeWidth={12} stroke={palette.subtle} />
          {data.map((item, index) => {
            const length = total ? item.value / total * circumference : 0;
            const segmentOffset = offset;
            offset += length;
            return <Circle key={`${item.label}-${index}`} {...elementProps(`admin-distribution-segment`, `${id}-${index}`)} cx={64} cy={64} r={48} fill={`none`} strokeWidth={12} rotation={-90} origin={`64,64`} stroke={item.color ?? colors[index % colors.length]} strokeDashoffset={-segmentOffset} strokeDasharray={`${length} ${circumference - length}`} />;
          })}
          <SvgText {...elementProps(`admin-distribution-total`, id)} x={64} y={63} fontSize={22} textAnchor={`middle`} fill={palette.ink} fontWeight={`700`}>{formatNumber(total)}</SvgText>
          <SvgText {...elementProps(`admin-distribution-caption`, id)} x={64} y={80} fontSize={10} textAnchor={`middle`} fill={palette.muted}>{label}</SvgText>
        </Svg>
      </View>
      <View {...elementProps(`admin-distribution-rows`, id)} style={styles.rows}>
        {data.length ? data.map((item, index) => <View key={`${item.label}-${index}`} {...elementProps(`admin-distribution-row`, `${id}-${index}`)} style={styles.row}>
          <View {...elementProps(`admin-distribution-heading`, `${id}-${index}`)} style={styles.rowHeading}><Text {...elementProps(`admin-distribution-label`, `${id}-${index}`)} style={styles.text}>{item.label}</Text><Text {...elementProps(`admin-distribution-value`, `${id}-${index}`)} style={styles.value}>{formatNumber(item.value)}</Text></View>
          <View {...elementProps(`admin-distribution-bar-track`, `${id}-${index}`)} style={styles.track}><View {...elementProps(`admin-chart-bar`, `${id}-${index}`)} style={[styles.bar, { width: `${total ? item.value / total * 100 : 0}%`, backgroundColor: item.color ?? colors[index % colors.length] }]} /></View>
        </View>) : <Text {...elementProps(`admin-distribution-empty`, id)} style={styles.text}>{`No Records Yet`}</Text>}
      </View>
    </Animated.View>
  );
};

export default TrendChart;
