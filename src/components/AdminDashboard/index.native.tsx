import AdminUsers from '../AdminUsers';
import AdminPlans from '../AdminPlans';
import { useMemo, useState } from 'react';
import AdminDomains from '../AdminDomains';
import HeadingActions from './HeadingActions';
import AccountSidebar from '../AccountSidebar';
import { createStyles } from './styles.native';
import AdminAnalytics from '../AdminAnalytics';
import ProtectedRoute from '../ProtectedRoute';
import FormSubmissions from '../FormSubmissions';
import AdminObservability from '../AdminObservability';
import AdminNotifications from '../AdminNotifications';
import { useAdminDashboard } from './useAdminDashboard';
import AdminRecordPreviews from '../AdminRecordPreviews';
import { elementProps } from '../../shared/elementProps';
import { AdminButton, AdminLoading } from '../AdminWidgets';
import AdminDashboardSummary from '../AdminDashboardSummary';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { AdminSection } from '../../shared/admin/permissions';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { Cpu, Bell, Users, Wallet, Globe2, FileText, RotateCcw, MessageCircle, LayoutDashboard } from 'lucide-react-native';

const sections = {
  overview: { title: `Dashboard`, group: `General`, Icon: LayoutDashboard },
  users: { title: `Users`, group: `Accounts`, Icon: Users },
  plans: { title: `Plans`, group: `Accounts`, Icon: Wallet },
  domains: { title: `Domains`, group: `Portfolio`, Icon: Globe2 },
  notifications: { title: `Notifications`, group: `General`, Icon: Bell },
  requests: { title: `Requests`, group: `Feedback`, Icon: MessageCircle },
  reports: { title: `Reports`, group: `General`, Icon: FileText },
  analytics: { title: `Analytics`, group: `Website`, Icon: LayoutDashboard },
  observability: { title: `Analytics`, group: `Website`, Icon: LayoutDashboard },
};

const DashboardContent = ({ section }: { section: AdminSection }) => {
  const state = useAdminDashboard(section);
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [headingActionsTarget, setHeadingActionsTarget] = useState<HTMLElement | null>(null);
  const [analyticsPanel, setAnalyticsPanel] = useState<`traffic` | `runtime`>(section === `observability` ? `runtime` : `traffic`);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const snapshot = state.snapshot;
  const analytics = section === `analytics` || section === `observability`;
  const { title, group, Icon: TitleIcon } = sections[section];
  return <View {...elementProps(`account-layout`, `admin-${section}`)} style={[styles.root, width <= 650 && styles.compact]}>
    <AccountSidebar section={section} counts={snapshot?.canInspectAccounts ? { users: snapshot.userCoverage.loaded, domains: snapshot.domainCoverage.loaded, notifications: snapshot.notificationCoverage?.loaded } : undefined} countsLoading={state.loading} />
    <View {...elementProps(`admin-dashboard-content`, section)} style={styles.content}>
      <View {...elementProps(`admin-dashboard-heading`, section)} style={[styles.heading, width <= 850 && !analytics && styles.headingCompact, (section === `users` || section === `plans` || section === `domains` || section === `notifications`) && styles.tableHeading]}>
        <View {...elementProps(`admin-dashboard-heading-copy`, section)} style={styles.headingCopy}>
          <View {...elementProps(`admin-dashboard-eyebrow`, section)} style={styles.eyebrow}>
            <View {...elementProps(`admin-dashboard-eyebrow-line`, section)} style={styles.eyebrowLine} />
            <Text {...elementProps(`admin-dashboard-eyebrow-label`, section)} style={styles.eyebrowText}>{`ADMIN`}</Text>
            <Text {...elementProps(`admin-dashboard-eyebrow-separator`, section)} style={styles.eyebrowText}>{`·`}</Text>
            <Text {...elementProps(`admin-dashboard-eyebrow-group`, section)} style={styles.eyebrowText}>{group.toUpperCase()}</Text>
          </View>
          <View {...elementProps(`admin-dashboard-title-row`, section)} style={styles.titleRow}>
            <TitleIcon {...elementProps(`admin-dashboard-title-icon`, section)} size={28} color={palette.accent} />
            <Text {...elementProps(`admin-dashboard-title`, section)} style={styles.title} accessibilityRole={`header`}>{title}</Text>
          </View>
        </View>
        {analytics || section === `plans` || section === `notifications` ? <HeadingActions onTarget={setHeadingActionsTarget} /> : state.error || section === `reports` ? <AdminButton id={`snapshot-refresh`} Icon={RotateCcw} label={`Refresh`} disabled={state.loading} onPress={state.refresh} /> : null}
      </View>
      {state.error ? <View {...elementProps(`admin-database-error`)} style={styles.errorBox} accessibilityRole={`alert`}><Text {...elementProps(`admin-database-error-message`)} style={styles.error}>{state.error}</Text><Text {...elementProps(`admin-database-retry-note`)} style={styles.copy}>{`Use Refresh To Reconnect`}</Text>{analytics ? <AdminButton id={`database-retry`} Icon={RotateCcw} label={`Refresh Database`} disabled={state.loading} onPress={state.refresh} /> : null}</View> : null}
      {section === `overview` ? <>
        <AdminAnalytics compact />
        <AdminObservability compact />
        {state.loading ? <View {...elementProps(`admin-dashboard-loading`)} style={styles.loading}><AdminLoading id={`database-overview`} label={`Loading Domain Activity And Account Records`} /></View> : null}
        {snapshot ? <AdminDashboardSummary snapshot={snapshot} onRefresh={state.refresh} /> : null}
      </> : section === `users` ? <AdminUsers /> : section === `plans` ? <AdminPlans headingActionsTarget={headingActionsTarget} /> : section === `domains` ? <AdminDomains snapshot={snapshot} loading={state.loading} /> : section === `requests` ? <FormSubmissions /> : section === `reports` ? <>
        {state.loading ? <AdminLoading id={`reports`} label={`Loading Account And Domain Reports`} /> : snapshot ? <AdminRecordPreviews snapshot={snapshot} /> : null}
        <FormSubmissions />
      </> : section === `notifications` ? <AdminNotifications headingActionsTarget={headingActionsTarget} /> : <>
        <View {...elementProps(`admin-analytics-views`)} style={styles.analyticsViews} accessibilityLabel={`Analytics View`}>
          {([{ id: `traffic`, label: `Website Traffic`, Icon: Globe2 }, { id: `runtime`, label: `Runtime Health`, Icon: Cpu }] as const).map(({ id, label, Icon }) => <Pressable key={id} {...elementProps(`admin-analytics-view`, id)} accessibilityRole={`button`} accessibilityState={{ selected: analyticsPanel === id }} onPress={() => setAnalyticsPanel(id)} style={[styles.analyticsView, analyticsPanel === id && styles.analyticsViewActive]}><Icon {...elementProps(`admin-analytics-view-icon`, id)} size={15} color={analyticsPanel === id ? palette.accent : palette.muted} /><Text {...elementProps(`admin-analytics-view-label`, id)} style={[styles.analyticsViewText, analyticsPanel === id && { color: palette.accent }]}>{label}</Text></Pressable>)}
        </View>
        {analyticsPanel === `traffic` ? <AdminAnalytics headingActionsTarget={headingActionsTarget} outcomesLoading={state.loading} outcomes={snapshot?.canInspectAccounts ? { accounts: snapshot.users.map(record => record.created), domains: snapshot.domains.map(record => record.created) } : undefined} /> : <AdminObservability headingActionsTarget={headingActionsTarget} />}
        {snapshot ? <AdminDashboardSummary snapshot={snapshot} onRefresh={state.refresh} previewRecords={false} /> : null}
      </>}
    </View>
  </View>;
};

const AdminDashboard = ({ section = `overview` }: { section?: AdminSection }) => <ProtectedRoute adminSection={section}><DashboardContent key={section} section={section} /></ProtectedRoute>;
export default AdminDashboard;
