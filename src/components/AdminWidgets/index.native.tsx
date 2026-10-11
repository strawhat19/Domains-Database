import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { createStyles } from './styles.native';
import { useMemo, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react-native';
import { Text, View, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

export interface AdminStat { id: string; label: string; value: string | number; hint?: string; href?: Href; Icon?: LucideIcon }
export const useAdminWidgetStyles = () => {
  const { palette } = useTheme();
  return { palette, styles: useMemo(() => createStyles(palette), [palette]) };
};

export const AdminPanel = ({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) => {
  const { styles } = useAdminWidgetStyles();
  return <View {...elementProps(`admin-panel`, id)} style={styles.panel}>
    <View {...elementProps(`admin-panel-heading`, id)} style={styles.panelHeading}>
      <Text {...elementProps(`admin-panel-title`, id)} style={styles.panelTitle} accessibilityRole={`header`}>{title}</Text>
      {note ? <Text {...elementProps(`admin-panel-note`, id)} style={styles.small}>{note}</Text> : null}
    </View>
    <View {...elementProps(`admin-panel-body`, id)} style={styles.panelBody}>{children}</View>
  </View>;
};

export const AdminStats = ({ id, stats, loading = false, variant = `summary` }: { id: string; stats: AdminStat[]; loading?: boolean; variant?: `summary` | `pills` }) => {
  const { styles, palette } = useAdminWidgetStyles();
  if (variant === `pills`) return <View {...elementProps(`admin-counts`, id)} style={styles.counts}>
    {stats.map(({ id: statId, label, value, hint, href, Icon }) => {
      const content = <>
        {Icon ? <Icon {...elementProps(`admin-count-icon`, `${id}-${statId}`)} size={15} color={palette.accent} /> : null}
        <Text {...elementProps(`admin-count-label`, `${id}-${statId}`)} style={styles.countLabel}>{label}</Text>
        {loading ? <View {...elementProps(`admin-skeleton`, `${id}-${statId}`)} style={[styles.skeleton, { width: 24, height: 18 }]} /> : <Text {...elementProps(`admin-count-value`, `${id}-${statId}`)} style={styles.countValue}>{value}</Text>}
        {href ? <ArrowUpRight {...elementProps(`admin-count-arrow`, `${id}-${statId}`)} size={12} color={palette.muted} /> : null}
      </>;
      return href ? <Link key={statId} href={href} asChild><Pressable {...elementProps(`admin-count`, `${id}-${statId}`)} accessibilityLabel={`${label}: ${value}${hint ? ` · ${hint}` : ``}`} style={styles.count}>{content}</Pressable></Link> : <View key={statId} {...elementProps(`admin-count`, `${id}-${statId}`)} accessibilityLabel={`${label}: ${value}${hint ? ` · ${hint}` : ``}`} style={styles.count}>{content}</View>;
    })}
  </View>;
  return <View {...elementProps(`admin-stats`, id)} style={styles.stats} accessibilityLabel={loading ? `Loading Statistics` : undefined}>
    {stats.map(({ id: statId, label, value, hint, Icon }) => <View key={statId} {...elementProps(`admin-stat`, `${id}-${statId}`)} style={styles.stat}>
      <View {...elementProps(`admin-stat-heading`, `${id}-${statId}`)} style={styles.statHeading}>{Icon ? <Icon {...elementProps(`admin-stat-icon`, `${id}-${statId}`)} size={15} color={palette.accent} /> : null}<Text {...elementProps(`admin-stat-label`, `${id}-${statId}`)} style={styles.muted}>{label}</Text></View>
      {loading ? <View {...elementProps(`admin-skeleton`, `${id}-${statId}`)} style={styles.skeleton} /> : <Text {...elementProps(`admin-stat-value`, `${id}-${statId}`)} style={styles.statValue}>{value}</Text>}
      {hint ? <Text {...elementProps(`admin-stat-hint`, `${id}-${statId}`)} style={styles.small}>{hint}</Text> : null}
    </View>)}
  </View>;
};

export const AdminButton = ({ id, label, Icon, disabled, onPress }: { id: string; label: string; Icon?: LucideIcon; disabled?: boolean; onPress: () => void }) => {
  const { styles, palette } = useAdminWidgetStyles();
  return <Pressable {...elementProps(`admin-button`, id)} disabled={disabled} accessibilityRole={`button`} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
    {Icon ? <Icon {...elementProps(`admin-button-icon`, id)} size={14} color={palette.accent} /> : null}<Text {...elementProps(`admin-button-label`, id)} style={styles.buttonText}>{label}</Text>
  </Pressable>;
};

export const StatusCell = ({ id, label, tone = `green` }: { id: string; label: string; tone?: `green` | `gray` | `red` }) => {
  const { styles, palette } = useAdminWidgetStyles();
  const color = tone === `red` ? palette.danger : tone === `gray` ? palette.muted : palette.success;
  return <View {...elementProps(`actionsCell`, id)} style={styles.actionsCell}>
    <View {...elementProps(`rowStatus`, id)} style={styles.rowStatus}>
      <View {...elementProps(`statusDotWrap`, id)} style={[styles.statusDotWrap, { backgroundColor: `${color}20` }]}><View {...elementProps(`statusDot`, id)} style={[styles.statusDot, { backgroundColor: color }]} /></View>
      <Text {...elementProps(`statusText`, id)} style={[styles.small, { fontSize: 11, color: palette.ink }]}>{label}</Text>
    </View>
  </View>;
};

export const AdminLoading = ({ id, label = `Loading Live Records` }: { id: string; label?: string }) => {
  const { styles } = useAdminWidgetStyles();
  return <View {...elementProps(`admin-loading`, id)} style={styles.loading} accessibilityLabel={label}>
    <Text {...elementProps(`admin-loading-label`, id)} style={styles.muted}>{label}</Text>
    {[0, 1, 2].map(index => <View key={index} {...elementProps(`admin-skeleton`, `${id}-${index}`)} style={[styles.skeleton, { width: `${90 - index * 15}%` }]} />)}
  </View>;
};
