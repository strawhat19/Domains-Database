import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminUsersRoute = () => (
  <>
    <PageMeta title={`Admin · Users`} description={`Authorized account management for Domains Database`} />
    <ProtectedRoute adminSection={routes.adminUsers.adminSection}>
      <AdminDashboard section={routes.adminUsers.adminSection} />
    </ProtectedRoute>
  </>
);

export default AdminUsersRoute;
