import { useMemo } from 'react';
import type { PlanRowProps } from './types';
import { createStyles } from './styles.native';
import { planColumns } from '../styles.native';
import { View, Text, Pressable } from 'react-native';
import { formatPlanDate, formatPlanPrice } from '../values';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { X, Star, Layers3, Archive, Settings, ThumbsUp } from 'lucide-react-native';

const PlanRow = ({ busy, score, saving, record, confirming, scoreLoading, onEdit, onArchive, onStatus, onRequestArchive, onCancelArchive }: PlanRowProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const rowId = `native-admin-plan-${record.id}`;
  const statusColor = record.active ? palette.success : palette.muted;
  return <View {...elementProps(rowId)} style={styles.row} accessibilityState={{ busy: saving }}>
    <View {...elementProps(`${rowId}-number`)} style={[styles.cell, { width: planColumns[0] }]}><Text {...elementProps(`${rowId}-number-badge`)} style={styles.numberBadge}>{record.number}</Text></View>
    <View {...elementProps(`${rowId}-name-cell`)} style={[styles.cell, styles.identity, { width: planColumns[1] }]}>
      <View {...elementProps(`${rowId}-thumbnail`)} style={styles.thumbnail}><Layers3 size={18} strokeWidth={1.6} color={palette.accent} {...elementProps(`${rowId}-icon`)} /></View>
      <View {...elementProps(`${rowId}-copy`)} style={styles.copy}>
        <Text {...elementProps(`${rowId}-name`)} style={styles.title}>{record.name}</Text>
        <Text {...elementProps(`${rowId}-slug`)} style={styles.slug}>{record.slug}</Text>
        <Text {...elementProps(`${rowId}-description`)} style={styles.body} numberOfLines={3}>{record.description || `—`}</Text>
        {record.highlighted && <View {...elementProps(`${rowId}-highlighted`)} style={styles.highlighted}><Star size={11} color={palette.accent} {...elementProps(`${rowId}-highlighted-icon`)} /><Text style={styles.highlightedLabel} {...elementProps(`${rowId}-highlighted-label`)}>{`Highlighted`}</Text></View>}
      </View>
    </View>
    <Text {...elementProps(`${rowId}-price`)} style={[styles.cell, styles.label, { width: planColumns[2] }]}>{formatPlanPrice(record)}</Text>
    <View {...elementProps(`${rowId}-score`)} style={[styles.cell, styles.score, { width: planColumns[3] }]} accessible accessibilityLabel={scoreLoading ? `Loading Upvote Score` : score === null ? `Upvote Score Unavailable` : `${score} Upvote(s)`} accessibilityState={{ busy: scoreLoading }}><ThumbsUp size={13} color={palette.accent} {...elementProps(`${rowId}-score-icon`)} /><Text {...elementProps(`${rowId}-score-value`)} style={styles.label}>{score ?? `—`}</Text></View>
    <View {...elementProps(`${rowId}-features`)} style={[styles.cell, styles.featureList, { width: planColumns[4] }]}>
      {record.features.length ? record.features.slice(0, 3).map((feature, index) => <Text key={index} style={styles.body} numberOfLines={2} {...elementProps(`${rowId}-feature`, `${index}`)}>{`• ${feature}`}</Text>) : <Text {...elementProps(`${rowId}-features-empty`)} style={styles.label}>{`No Features`}</Text>}
      {record.features.length > 3 && <Text {...elementProps(`${rowId}-features-more`)} style={styles.label}>{`+${record.features.length - 3} Feature(s)`}</Text>}
    </View>
    <View {...elementProps(`${rowId}-status-cell`)} style={[styles.cell, { width: planColumns[5] }]}>
      <Pressable disabled={busy} onPress={() => { void onStatus(record); }} accessibilityRole={`button`} accessibilityLabel={`${record.active ? `Deactivate` : `Activate`} ${record.name}`} accessibilityState={{ disabled: busy }} {...elementProps(`${rowId}-status`)} style={[styles.rowStatus, busy && styles.disabled]}>
        <View {...elementProps(`${rowId}-status-dot-wrap`)} style={styles.statusDotWrap}><View {...elementProps(`${rowId}-status-dot`)} style={[styles.statusDot, { backgroundColor: statusColor }]} /></View>
        <Text {...elementProps(`${rowId}-status-text`)} style={[styles.statusText, { color: statusColor }]} accessibilityLiveRegion={`polite`}>{saving ? `Saving` : record.active ? `Active` : `Inactive`}</Text>
      </Pressable>
    </View>
    <Text {...elementProps(`${rowId}-order`)} style={[styles.cell, styles.label, { width: planColumns[6] }]}>{record.displayOrder}</Text>
    <Text {...elementProps(`${rowId}-updated`)} style={[styles.cell, styles.label, { width: planColumns[7] }]}>{formatPlanDate(record.updated)}</Text>
    <View {...elementProps(`${rowId}-actions-cell`)} style={[styles.cell, { width: planColumns[8] }]}>
      <View {...elementProps(`${rowId}-actions`)} style={styles.actionsCell}>
        <Pressable disabled={busy} onPress={() => onEdit(record)} accessibilityRole={`button`} accessibilityLabel={`Edit ${record.name}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-edit`)}><Settings size={14} color={palette.accent} {...elementProps(`${rowId}-edit-icon`)} /></Pressable>
        <Pressable disabled={busy || !record.active} onPress={() => onRequestArchive(record)} accessibilityRole={`button`} accessibilityLabel={record.active ? `Archive ${record.name}` : `${record.name} Is Already Inactive`} accessibilityState={{ disabled: busy || !record.active, expanded: confirming }} style={[styles.action, (busy || !record.active) && styles.disabled]} {...elementProps(`${rowId}-archive`)}><Archive size={14} color={palette.warning} {...elementProps(`${rowId}-archive-icon`)} /></Pressable>
      </View>
      {confirming && <View {...elementProps(`${rowId}-archive-confirmation`)} style={styles.confirmation}>
        <Text {...elementProps(`${rowId}-archive-title`)} style={styles.archiveTitle}>{`Archive “${record.name}”?`}</Text>
        <Text {...elementProps(`${rowId}-archive-note`)} style={styles.archiveNote}>{`This hides the plan from Pricing. Existing account access is unchanged. You can activate it again.`}</Text>
        <View {...elementProps(`${rowId}-archive-actions`)} style={styles.actionsCell}>
          <Pressable disabled={busy} onPress={() => { void onArchive(record).then(saved => { if (saved) onCancelArchive(); }); }} accessibilityRole={`button`} accessibilityLabel={`Confirm Archive ${record.name}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-archive-confirm`)}><Archive size={14} color={palette.warning} {...elementProps(`${rowId}-archive-confirm-icon`)} /></Pressable>
          <Pressable disabled={busy} onPress={onCancelArchive} accessibilityRole={`button`} accessibilityLabel={`Cancel Archive ${record.name}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-archive-cancel`)}><X size={14} color={palette.accent} {...elementProps(`${rowId}-archive-cancel-icon`)} /></Pressable>
        </View>
      </View>}
    </View>
  </View>;
};

export default PlanRow;
