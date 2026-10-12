import { useMemo } from 'react';
import { Link } from 'expo-router';
import { accountDate } from './data';
import { StatusCell } from '../AdminWidgets';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { Text, View, Pressable } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { AdminSnapshot } from '../../shared/admin/types';
import { Users, Globe2, ArrowUpRight } from 'lucide-react-native';
import { getDomainStatus, formatDate } from '../../shared/domainUtils';

const AdminRecordPreviews = ({ snapshot }: { snapshot: AdminSnapshot }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`admin-record-previews`)}>
    {([{ id: `users`, title: `Users`, Icon: Users, records: snapshot.users }, { id: `domains`, title: `Domains`, Icon: Globe2, records: snapshot.domains }] as const).map(({ id, title, Icon, records }) => <View key={id} {...elementProps(`admin-recent-records`, id)} style={styles.root}>
      <View {...elementProps(`admin-recent-records-heading`, id)} style={styles.heading}><View {...elementProps(`admin-recent-records-title-row`, id)} style={styles.titleRow}><Icon {...elementProps(`admin-recent-records-icon`, id)} size={22} color={palette.accent} /><Text {...elementProps(`admin-recent-records-title`, id)} style={styles.title}>{title}</Text></View><Link href={id === `users` ? routes.adminUsers.href : routes.adminDomains.href} asChild><Pressable {...elementProps(`admin-recent-records-view-all`, id)} style={styles.link}><Text {...elementProps(`admin-recent-records-view-all-label`, id)} style={styles.detail}>{`View All`}</Text><ArrowUpRight {...elementProps(`admin-recent-records-arrow`, id)} size={13} color={palette.accent} /></Pressable></Link></View>
      <View {...elementProps(`admin-recent-records-table`, id)} style={styles.table}>{records.length ? records.slice(0, 5).sort((first, second) => first.number - second.number).map(record => {
        const status = `active` in record ? record.active ? `Active` : `Inactive` : getDomainStatus(record);
        const detail = `emailVerified` in record ? `${record.email} · ${accountDate(record.created)}` : `${record.registrar} · ${formatDate(record.expiresAt)}`;
        return <View key={record.id} {...elementProps(`admin-recent-records-row`, record.id)} style={styles.row}><Text {...elementProps(`admin-recent-records-number`, record.id)} style={styles.number}>{record.number}</Text><View {...elementProps(`admin-recent-records-identity`, record.id)} style={styles.identity}><Text {...elementProps(`admin-recent-records-name`, record.id)} style={styles.name}>{record.name}</Text><Text {...elementProps(`admin-recent-records-detail`, record.id)} style={styles.detail}>{detail}</Text></View><StatusCell id={`recent-${record.id}`} label={status} tone={status === `Expired` ? `red` : status === `Inactive` || status === `Unknown` ? `gray` : `green`} /></View>;
      }) : <Text {...elementProps(`admin-recent-records-empty`, id)} style={[styles.detail, styles.empty]}>{`No ${title} Records Yet`}</Text>}</View>
    </View>)}
  </View>;
};

export default AdminRecordPreviews;
