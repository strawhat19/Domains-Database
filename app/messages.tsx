import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminMessagesRoute = () => (
  <>
    <PageMeta title={`Admin · Messages`} description={`Future messages inbox`} />
    <AdminDashboard section={routes.adminMessages.adminSection} />
  </>
);

export default AdminMessagesRoute;
