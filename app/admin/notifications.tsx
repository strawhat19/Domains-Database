import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminNotificationsRoute = () => <>
  <PageMeta title={`Admin · Notifications`} description={`Manage database announcements for Domains Database`} />
  <AdminDashboard section={routes.adminNotifications.adminSection} />
</>;

export default AdminNotificationsRoute;
