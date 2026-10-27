import AdminUsers from '../AdminUsers';
import AdminPlans from '../AdminPlans';
import AdminGitHub from '../AdminGitHub';
import AdminPayments from '../AdminPayments';
import AdminEvents from '../AdminEvents';
import AdminDomains from '../AdminDomains';
import AdminFeatures from '../AdminFeatures';
import AdminFeedback from '../AdminFeedback';
import HeadingActions from './HeadingActions';
import AccountSidebar from '../AccountSidebar';
import { createStyles } from './styles.native';
import AdminAnalytics from '../AdminAnalytics';
import ProtectedRoute from '../ProtectedRoute';
import FormSubmissions from '../FormSubmissions';
import { useRef, useMemo, useState, useEffect } from 'react';
import AdminObservability from '../AdminObservability';
import AdminNotifications from '../AdminNotifications';
import { useAdminDashboard } from './useAdminDashboard';
import AdminRecordPreviews from '../AdminRecordPreviews';
import { elementProps } from '../../shared/elementProps';
import { AdminButton, AdminLoading } from '../AdminWidgets';
import AdminDashboardSummary from '../AdminDashboardSummary';
import { useTheme } from '../../shared/themeContext/useTheme';
import { canManageRoles, canViewPayments, type AdminSection } from '../../shared/admin/permissions';
import { Text, View, Platform, Pressable, useWindowDimensions } from 'react-native';
import { Bug, Cpu, Bell, Star, Users, Wallet, Globe2, FileText, GitBranch, RotateCcw, CalendarDays, ClipboardList, MessageCircle, MessagesSquare, LayoutDashboard, SlidersHorizontal } from 'lucide-react-native';

const sections = {
  overview: { title: `Dashboard`, parent: `Dashboard`, Icon: LayoutDashboard },
  users: { title: `Users`, parent: `Dashboard`, Icon: Users },
  features: { title: `Features`, parent: `Dashboard`, Icon: SlidersHorizontal },
  plans: { title: `Plans`, parent: `Dashboard`, Icon: Wallet },
  payments: { title: `Payments`, parent: `Dashboard`, Icon: Wallet },
  domains: { title: `Domains`, parent: `Dashboard`, Icon: Globe2 },
  events: { title: `Events`, parent: `Dashboard`, Icon: CalendarDays },
  notifications: { title: `Notifications`, parent: `Dashboard`, Icon: Bell },
  reviews: { title: `Reviews`, parent: `Feedback`, Icon: Star },
  bugReports: { title: `Bug`, parent: `Feedback`, Icon: Bug },
  aiChats: { title: `Chats`, parent: `Feedback`, Icon: MessagesSquare },
  feedback: { title: `Feedback`, parent: `Feedback`, Icon: MessageCircle },
  messages: { title: `Messages`, parent: `Feedback`, Icon: MessagesSquare },
  requests: { title: `Forms`, parent: `Feedback`, Icon: ClipboardList },
  formSubmissions: { title: `Forms`, parent: `Feedback`, Icon: ClipboardList },
  reports: { title: `Reports`, parent: `Dashboard`, Icon: FileText },
  analytics: { title: `Analytics`, parent: `Dashboard`, Icon: LayoutDashboard },
  observability: { title: `Health`, parent: `Dashboard`, Icon: Cpu },
};

const DashboardContent = ({ section }: { section: AdminSection }) => {
  const state = useAdminDashboard(section);
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [headingActionsTarget, setHeadingActionsTarget] = useState<HTMLElement | null>(null);
  const [analyticsPanel, setAnalyticsPanel] = useState<`traffic` | `github`>(`traffic`);
  const pendingTabFocus = useRef<`traffic` | `github` | null>(null);
  const githubAllowed = canManageRoles(state.user);
  const visibleAnalyticsPanel = githubAllowed ? analyticsPanel : `traffic`;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const snapshot = state.snapshot;
  const analytics = section === `analytics` || section === `observability` || section === `payments`;
  const { title, parent, Icon: TitleIcon } = sections[section];
  const analyticsIdPrefix = section === `overview` ? `admin-dashboard-analytics` : `admin-analytics`;
  const selectAnalyticsPanel = (panel: `traffic` | `github`) => {
    if (panel === visibleAnalyticsPanel) return;
    pendingTabFocus.current = panel;
    setAnalyticsPanel(panel);
  };
  useEffect(() => {
    if (Platform.OS === `web` && pendingTabFocus.current) document.getElementById(`${analyticsIdPrefix}-view-${pendingTabFocus.current}`)?.focus({ preventScroll: true });
    pendingTabFocus.current = null;
  }, [visibleAnalyticsPanel, analyticsIdPrefix]);
  const analyticsTabs = (
    <View {...elementProps(`${analyticsIdPrefix}-views`)} style={[styles.analyticsViews, section === `overview` && styles.analyticsViewsInline]} accessibilityRole={`tablist`} accessibilityLabel={`Analytics View`}>
      {([{ id: `traffic`, label: `Traffic`, Icon: Globe2 }, { id: `github`, label: `GitHub`, Icon: GitBranch }] as const).filter(({ id }) => id !== `github` || githubAllowed).map(({ id, label, Icon }) => <Pressable
        key={id}
        tabIndex={visibleAnalyticsPanel === id ? 0 : -1}
        {...elementProps(`${analyticsIdPrefix}-view`, id)}
        accessibilityRole={`tab`}
        accessibilityState={{ selected: visibleAnalyticsPanel === id }}
        onPress={() => selectAnalyticsPanel(id)}
        style={[styles.analyticsView, visibleAnalyticsPanel === id && styles.analyticsViewActive]}
        {...(Platform.OS === `web` ? { 'aria-controls': `${analyticsIdPrefix}-content`, 'aria-selected': visibleAnalyticsPanel === id, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
          if (![`End`, `Home`, `ArrowLeft`, `ArrowRight`].includes(event.key) || !githubAllowed) return;
          event.preventDefault();
          const next = event.key === `Home` ? `traffic` : event.key === `End` ? `github` : id === `traffic` ? `github` : `traffic`;
          selectAnalyticsPanel(next);
        } } : {})}
      ><Icon {...elementProps(`${analyticsIdPrefix}-view-icon`, id)} size={15} color={visibleAnalyticsPanel === id ? palette.accent : palette.muted} /><Text {...elementProps(`${analyticsIdPrefix}-view-label`, id)} style={[styles.analyticsViewText, visibleAnalyticsPanel === id && { color: palette.accent }]}>{label}</Text></Pressable>)}
    </View>
  );
  return <View {...elementProps(`account-layout`, `admin-${section}`)} style={[styles.root, width <= 650 && styles.compact]}>
    <AccountSidebar section={section} counts={snapshot?.canInspectAccounts ? { users: snapshot.userCoverage.loaded, domains: snapshot.domainCoverage.loaded, notifications: snapshot.notificationCoverage?.loaded } : undefined} countsLoading={state.loading} />
    <View {...elementProps(`admin-dashboard-content`, section)} style={[styles.content, width <= 650 && styles.compactContent]}>
      <View {...elementProps(`admin-dashboard-heading`, section)} style={[styles.heading, width <= 850 && !analytics && styles.headingCompact, (section === `users` || section === `features` || section === `plans` || section === `domains` || section === `notifications`) && styles.tableHeading]}>
        <View {...elementProps(`admin-dashboard-heading-copy`, section)} style={styles.headingCopy}>
          <View {...elementProps(`admin-dashboard-eyebrow`, section)} style={styles.eyebrow}>
            <View {...elementProps(`admin-dashboard-eyebrow-line`, section)} style={styles.eyebrowLine} />
            <Text {...elementProps(`admin-dashboard-eyebrow-label`, section)} style={styles.eyebrowText}>{`ADMIN`}</Text>
            <Text {...elementProps(`admin-dashboard-eyebrow-separator`, section)} style={[styles.eyebrowText, styles.eyebrowSeparator]}>{`·`}</Text>
            <Text {...elementProps(`admin-dashboard-eyebrow-parent`, section)} style={styles.eyebrowText}>{parent.toUpperCase()}</Text>
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
        <View {...elementProps(`${analyticsIdPrefix}-content`)} role={`tabpanel`} aria-labelledby={`${analyticsIdPrefix}-view-${visibleAnalyticsPanel}`}>
          {visibleAnalyticsPanel === `traffic` ? <AdminAnalytics compact headingTabs={analyticsTabs} /> : <AdminGitHub headingTabs={analyticsTabs} />}
        </View>
        <AdminObservability compact />
        {canViewPayments(state.user) ? <AdminPayments compact /> : null}
        {state.loading ? <View {...elementProps(`admin-dashboard-loading`)} style={styles.loading}><AdminLoading id={`database-overview`} label={`Loading Domain Activity And Account Records`} /></View> : null}
        {snapshot ? <AdminDashboardSummary snapshot={snapshot} onRefresh={state.refresh} /> : null}
      </> : section === `feedback` || section === `reviews` || section === `bugReports` || section === `aiChats` || section === `messages` ? <AdminFeedback section={section} /> : section === `events` ? <AdminEvents /> : section === `users` ? <AdminUsers /> : section === `features` ? <AdminFeatures /> : section === `payments` ? <AdminPayments headingActionsTarget={headingActionsTarget} /> : section === `plans` ? <AdminPlans headingActionsTarget={headingActionsTarget} /> : section === `domains` ? <AdminDomains snapshot={snapshot} loading={state.loading} /> : section === `requests` || section === `formSubmissions` ? <FormSubmissions /> : section === `reports` ? <>
        {state.loading ? <AdminLoading id={`reports`} label={`Loading Account And Domain Reports`} /> : snapshot ? <AdminRecordPreviews snapshot={snapshot} /> : null}
        <FormSubmissions />
      </> : section === `notifications` ? <AdminNotifications headingActionsTarget={headingActionsTarget} /> : section === `observability` ? <AdminObservability headingActionsTarget={headingActionsTarget} /> : <>
        {analyticsTabs}
        <View {...elementProps(`${analyticsIdPrefix}-content`)} role={`tabpanel`} aria-labelledby={`${analyticsIdPrefix}-view-${visibleAnalyticsPanel}`}>
          {visibleAnalyticsPanel === `traffic` ? <AdminAnalytics headingActionsTarget={headingActionsTarget} outcomesLoading={state.loading} outcomes={snapshot?.canInspectAccounts ? { accounts: snapshot.users.map(record => record.created), domains: snapshot.domains.map(record => record.created) } : undefined} /> : <AdminGitHub headingActionsTarget={headingActionsTarget} />}
        </View>
        {snapshot && visibleAnalyticsPanel === `traffic` ? <AdminDashboardSummary showSource snapshot={snapshot} onRefresh={state.refresh} /> : null}
      </>}
    </View>
  </View>;
};

const AdminDashboard = ({ section = `overview` }: { section?: AdminSection }) => <ProtectedRoute adminSection={section}><DashboardContent key={section} section={section} /></ProtectedRoute>;
export default AdminDashboard;
