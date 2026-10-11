import { routes } from '../../src/shared/routes';
import PageMeta from '../../src/components/PageMeta';
import AdminDashboard from '../../src/components/AdminDashboard';

const AdminPlansRoute = () => <>
  <PageMeta title={`Admin · Plans`} description={`Manage plans, prices, and published pricing features`} />
  <AdminDashboard section={routes.adminPlans.adminSection} />
</>;

export default AdminPlansRoute;
