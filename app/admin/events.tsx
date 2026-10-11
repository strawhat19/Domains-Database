import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminEventsRoute = () => (
  <>
    <PageMeta title={`Admin · Events`} description={`Scheduled events and calendar management`} />
    <AdminDashboard section={routes.adminEvents.adminSection} />
  </>
);

export default AdminEventsRoute;
