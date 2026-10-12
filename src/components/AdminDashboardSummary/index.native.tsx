import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import { getAdminSummary } from '../AdminDashboard/data';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { AdminSnapshot } from '../../shared/admin/types';
import { ActivityChart, DistributionChart } from '../AdminCharts';
import { AdminPanel, AdminStats, AdminButton } from '../AdminWidgets';
import { Bell, Users, Globe2, RotateCcw, CircleCheck, CalendarClock } from 'lucide-react-native';

const AdminDashboardSummary = ({ snapshot, onRefresh, showSource = false }: { snapshot: AdminSnapshot; showSource?: boolean; onRefresh?: () => void }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const summary = useMemo(() => getAdminSummary(snapshot), [snapshot]);
  return <View {...elementProps(`admin-dashboard-body`)} style={styles.body}>
    {snapshot.canInspectAccounts ? <View {...elementProps(`admin-dashboard-charts`)} style={styles.columns}>
      <View {...elementProps(`admin-dashboard-column`, `activity`)} style={styles.activityColumn}><AdminPanel id={`record-activity`} title={`Domain Activity`} note={`Recent Loaded Records · Last 6 Months`}><ActivityChart id={`records`} points={summary.months} label={`Accounts`} secondaryLabel={`Domains`} /></AdminPanel></View>
      <View {...elementProps(`admin-dashboard-column`, `statuses`)} style={styles.statusColumn}><AdminPanel id={`domain-status`} title={`Domain Status`} note={`Loaded Domains`}><DistributionChart id={`domain-status`} label={`Domain(s)`} items={summary.statuses} /><Text {...elementProps(`admin-dashboard-status-note`)} style={styles.note}>{`Expiry And Renewal Status · ${snapshot.domainCoverage.loaded}${snapshot.domainCoverage.hasMore ? `+` : ``} Domain(s) Loaded`}</Text></AdminPanel></View>
    </View> : null}
    <AdminStats id={`overview`} variant={`pills`} stats={[
      { id: `registered`, Icon: Users, label: `Registered`, value: snapshot.registeredAccounts ?? `—`, hint: `Lifetime Counter · Includes Removed Accounts` },
      ...(snapshot.canInspectAccounts ? [
        { id: `users`, Icon: Users, label: `Users`, value: snapshot.userCoverage.loaded, href: routes.adminUsers.href, hint: `Loaded Account Window` },
        { id: `domains`, Icon: Globe2, label: `Domains`, value: snapshot.domainCoverage.loaded, href: routes.adminDomains.href, hint: `Loaded Domain Window` },
        { id: `notifications`, Icon: Bell, label: `Notifications`, value: snapshot.notificationCoverage?.loaded ?? `—`, href: routes.adminNotifications.href, hint: snapshot.notificationCoverage ? `Loaded Notification Window` : `Notification Count Unavailable` },
        { id: `active`, Icon: CircleCheck, label: `Active Users`, value: summary.activeAccounts, href: routes.adminUsers.href, hint: `Loaded Account Window` },
        { id: `renewals`, Icon: CalendarClock, label: `Renewing Soon`, value: summary.renewing, href: routes.adminDomains.href, hint: `Within Loaded Domains` },
      ] : []),
    ]} />
    {!!snapshot.notificationError && <View {...elementProps(`admin-notifications-summary-feedback`)} style={styles.source}><Text {...elementProps(`admin-notifications-summary-error`)} style={[styles.note, { color: palette.danger }]} accessibilityRole={`alert`}>{snapshot.notificationError}</Text>{onRefresh ? <AdminButton id={`notifications-summary-retry`} Icon={RotateCcw} label={`Refresh Database`} onPress={onRefresh} /> : null}</View>}
    {showSource ? <View {...elementProps(`admin-database-source`)} style={styles.source}>
      <View {...elementProps(`admin-database-source-dot`)} style={[styles.sourceDot, { backgroundColor: snapshot.mode === `firebase` ? palette.success : palette.muted }]} />
      <Text {...elementProps(`admin-database-source-label`)} style={styles.note}>{`${snapshot.mode === `firebase` ? `Realtime Firestore` : `Local Device Data`} · Updated ${new Date(snapshot.updatedAt).toLocaleTimeString()} · Registered = Lifetime Signups${snapshot.canInspectAccounts ? ` · ${snapshot.userCoverage.loaded}${snapshot.userCoverage.hasMore ? `+` : ``} User(s) / ${snapshot.domainCoverage.loaded}${snapshot.domainCoverage.hasMore ? `+` : ``} Domain(s) Loaded` : ``}`}</Text>
    </View> : null}
  </View>;
};

export default AdminDashboardSummary;
