import { routes } from '../src/shared/routes';
import PageMeta from '../src/components/PageMeta';
import AdminDashboard from '../src/components/AdminDashboard';

const AdminReviewsRoute = () => (
  <>
    <PageMeta title={`Admin · Reviews`} description={`Review private customer ratings and feedback`} />
    <AdminDashboard section={routes.adminReviews.adminSection} />
  </>
);

export default AdminReviewsRoute;
