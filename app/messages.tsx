import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminMessagesRoute = () => (
  <>
    <PageMeta title={`Admin · Messages`} description={`Private support conversations with signed-in users`} />
    <AdminDashboard section={routes.adminMessages.adminSection} />
  </>
);

export default AdminMessagesRoute;
