import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { NotificationRowProps } from './types';
import { View, Text, Pressable } from 'react-native';
import { notificationColumns } from '../styles.native';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { X, Heart, Trash2, Settings, Construction } from 'lucide-react-native';
import { getNotificationStatusLabel, formatNotificationDate } from '../useAdminNotifications';

const NotificationRow = ({ busy, record, confirming, onEdit, onDelete, onStatus, onRequestDelete, onCancelDelete }: NotificationRowProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const rowId = `native-admin-notification-${record.id}`;
  const Icon = record.kind === `development` ? Construction : Heart;
  const active = getNotificationStatusLabel(record) === `Active`;
  const statusColor = active ? palette.success : palette.muted;
  return <View {...elementProps(rowId)} style={styles.row}>
    <View {...elementProps(`${rowId}-number`)} style={[styles.cell, { width: notificationColumns[0] }]}><Text {...elementProps(`${rowId}-number-badge`)} style={styles.numberBadge}>{record.number}</Text></View>
    <View {...elementProps(`${rowId}-title-cell`)} style={[styles.cell, styles.identity, { width: notificationColumns[1] }]}>
      <View {...elementProps(`${rowId}-thumbnail`)} style={styles.thumbnail}><Icon size={18} strokeWidth={1.6} color={palette.accent} {...elementProps(`${rowId}-icon`)} /></View>
      <View {...elementProps(`${rowId}-copy`)} style={styles.copy}>
        <Text {...elementProps(`${rowId}-title`)} style={styles.title}>{record.title || record.name}</Text>
        <Text {...elementProps(`${rowId}-slug`)} style={styles.slug}>{record.slug || `—`}</Text>
        <Text {...elementProps(`${rowId}-body`)} style={styles.body} numberOfLines={3}>{record.body || record.description || record.details}</Text>
      </View>
    </View>
    <Text {...elementProps(`${rowId}-kind`)} style={[styles.cell, styles.label, { width: notificationColumns[2] }]}>{record.kind === `development` ? `Development` : `Announcement`}</Text>
    <View {...elementProps(`${rowId}-status-cell`)} style={[styles.cell, { width: notificationColumns[3] }]}>
      <Pressable disabled={busy} onPress={() => { void onStatus(record); }} accessibilityRole={`button`} accessibilityLabel={`${active ? `Deactivate` : `Activate`} ${record.title}`} accessibilityState={{ disabled: busy }} {...elementProps(`${rowId}-status`)} style={[styles.rowStatus, busy && styles.disabled]}>
        <View {...elementProps(`${rowId}-status-dot-wrap`)} style={styles.statusDotWrap}><View {...elementProps(`${rowId}-status-dot`)} style={[styles.statusDot, { backgroundColor: statusColor }]} /></View>
        <Text {...elementProps(`${rowId}-status-text`)} style={[styles.statusText, { color: statusColor }]}>{active ? `Active` : `Inactive`}</Text>
      </Pressable>
    </View>
    <Text {...elementProps(`${rowId}-updated`)} style={[styles.cell, styles.label, { width: notificationColumns[4] }]}>{formatNotificationDate(record.updated)}</Text>
    <View {...elementProps(`${rowId}-actions-cell`)} style={[styles.cell, { width: notificationColumns[5] }]}>
      <View {...elementProps(`${rowId}-actions`)} style={styles.actionsCell}>
        <Pressable disabled={busy} onPress={() => onEdit(record)} accessibilityRole={`button`} accessibilityLabel={`Edit ${record.title}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-edit`)}><Settings size={14} color={palette.accent} {...elementProps(`${rowId}-edit-icon`)} /></Pressable>
        <Pressable disabled={busy} onPress={() => onRequestDelete(record)} accessibilityRole={`button`} accessibilityLabel={`Delete ${record.title}`} accessibilityState={{ disabled: busy, expanded: confirming }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-delete`)}><Trash2 size={14} color={palette.danger} {...elementProps(`${rowId}-delete-icon`)} /></Pressable>
      </View>
      {confirming && <View {...elementProps(`${rowId}-delete-confirmation`)} style={styles.confirmation}>
        <Text {...elementProps(`${rowId}-delete-title`)} style={styles.deleteTitle}>{`Delete “${record.title}”?`}</Text>
        <Text {...elementProps(`${rowId}-delete-note`)} style={styles.deleteNote}>{`This removes the saved notification from Admin and public pages.`}</Text>
        <View {...elementProps(`${rowId}-delete-actions`)} style={styles.actionsCell}>
          <Pressable disabled={busy} onPress={() => { void onDelete(record).then(saved => { if (saved) onCancelDelete(); }); }} accessibilityRole={`button`} accessibilityLabel={`Confirm Delete ${record.title}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-delete-confirm`)}><Trash2 size={14} color={palette.danger} {...elementProps(`${rowId}-delete-confirm-icon`)} /></Pressable>
          <Pressable disabled={busy} onPress={onCancelDelete} accessibilityRole={`button`} accessibilityLabel={`Cancel Delete ${record.title}`} accessibilityState={{ disabled: busy }} style={[styles.action, busy && styles.disabled]} {...elementProps(`${rowId}-delete-cancel`)}><X size={14} color={palette.accent} {...elementProps(`${rowId}-delete-cancel-icon`)} /></Pressable>
        </View>
      </View>}
    </View>
  </View>;
};

export default NotificationRow;
